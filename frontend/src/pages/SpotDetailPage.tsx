import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  doc,
  onSnapshot,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import liff from "@line/liff";
import {
  AlertCircle,
  Clock,
  User,
  Check,
  Droplet,
  Leaf,
  CloudRain,
} from "lucide-react";
import { db, functions } from "../firebase";
import { Spot } from "../types/spot";
import { StatusBadge } from "../components/StatusBadge";
import { GreenHeader } from "../components/GreenHeader";

const POINTS_PER_PLANT = 10;

interface WateringLog {
  id: string;
  displayName: string;
  isAnonymous: boolean;
  createdAt: Timestamp;
}

function formatTime(ts: Timestamp | null): string {
  if (!ts) return "";
  const d = ts.toDate();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const hhmm = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  if (target.getTime() === today.getTime()) return `今日 ${hhmm}`;
  if (target.getTime() === yesterday.getTime()) return `昨日 ${hhmm}`;
  return `${d.getMonth() + 1}/${d.getDate()} ${hhmm}`;
}

interface ActionSectionProps {
  spot: Spot;
  isRainy: boolean;
  fromMap: boolean;
  loading: boolean;
  onWater: () => void;
}

function ActionSection({ spot, isRainy, fromMap, loading, onWater }: ActionSectionProps) {
  if (isRainy) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-center">
        <CloudRain size={40} className="text-blue-400 mx-auto mb-3" />
        <p className="font-bold text-blue-700 text-lg">今日は雨のため水やり不要です</p>
        <p className="text-blue-500 text-sm mt-1">恵みの雨！</p>
      </div>
    );
  }
  if (spot.wateredToday) {
    return (
      <div className="bg-[#d4f5e2] border border-[#2dc75c]/30 rounded-2xl p-5 text-center">
        <Leaf size={40} className="text-[#2dc75c] mx-auto mb-3" />
        <p className="font-bold text-[#1a7a40] text-lg">本日の水やりは完了しています！</p>
        <p className="text-[#2dc75c] text-sm mt-1">ご協力ありがとうございます。</p>
      </div>
    );
  }
  if (fromMap) {
    return (
      <div className="bg-gray-100 rounded-2xl p-5 text-center">
        <p className="text-gray-500 text-sm leading-relaxed">
          現地のQRコードをスキャンすると<br />水やりを記録できます
        </p>
      </div>
    );
  }
  return (
    <button
      className="btn w-full rounded-full text-white font-bold text-base py-4 bg-[#1a7a40] hover:bg-[#155f33] border-none shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
      onClick={onWater}
      disabled={loading}
    >
      {loading ? (
        <span className="loading loading-spinner loading-sm"></span>
      ) : (
        <>
          <Droplet size={18} fill="white" />
          水やりを記録する
        </>
      )}
    </button>
  );
}

function SpotDetailPage() {
  const { spotId } = useParams<{ spotId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromMap = searchParams.get("from") === "map";
  const [spot, setSpot] = useState<Spot | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [logs, setLogs] = useState<WateringLog[]>([]);
  const [showAllLogs, setShowAllLogs] = useState(false);

  useEffect(() => {
    if (!spotId) return;
    return onSnapshot(doc(db, "spots", spotId), (snapshot) => {
      if (snapshot.exists()) {
        setSpot({ id: snapshot.id, ...(snapshot.data() as Omit<Spot, "id">) });
      } else {
        setNotFound(true);
      }
    });
  }, [spotId]);

  useEffect(() => {
    if (!spotId) return;
    const q = query(
      collection(db, "logs"),
      where("spotId", "==", spotId),
      orderBy("createdAt", "desc"),
      limit(showAllLogs ? 20 : 3)
    );
    getDocs(q)
      .then((snap) => {
        setLogs(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<WateringLog, "id">),
          }))
        );
      })
      .catch((e) => console.error("履歴取得エラー:", e));
  }, [spotId, showAllLogs]);

  const handleWater = async () => {
    if (!spot || loading) return;
    setLoading(true);
    try {
      let displayName = "匿名ユーザー";
      let isAnonymous = false;
      try {
        const profile = await liff.getProfile();
        displayName = profile.displayName;
      } catch {
        isAnonymous = true;
      }
      const recordWatering = httpsCallable(functions, "recordWatering");
      await recordWatering({ spotId: spot.id, displayName, isAnonymous });
      setDone(true);
    } catch (e) {
      console.error("水やり記録エラー:", e);
      alert("エラーが発生しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 font-sans">
        <p className="text-gray-500 mb-4">スポットが見つかりませんでした。</p>
        <button className="btn btn-outline btn-sm" onClick={() => navigate("/")}>
          マップへ戻る
        </button>
      </div>
    );
  }

  if (!spot) {
    return (
      <div className="min-h-screen flex items-center justify-center font-sans">
        <span className="loading loading-spinner loading-lg text-success"></span>
      </div>
    );
  }

  const isRainy = spot.weather?.isRainy ?? false;

  if (done) {
    return (
      <div className="min-h-screen bg-[#d4f5e2] flex flex-col items-center justify-center p-6 font-sans">
        <div className="w-20 h-20 rounded-full bg-[#2dc75c] flex items-center justify-center mb-6 shadow-lg">
          <Check size={40} color="white" strokeWidth={3} />
        </div>
        <h1 className="text-3xl font-bold text-[#1a7a40] mb-1">水やり完了！</h1>
        <p className="text-[#2dc75c] mb-8 text-base">{spot.name}</p>

        <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow mb-6">
          <p className="text-center text-gray-500 text-sm mb-2">獲得ポイント</p>
          <p className="text-center text-4xl font-bold text-amber-500">
            +{spot.plantCount * POINTS_PER_PLANT} pt
          </p>
          <hr className="my-3" />
          <p className="text-center text-sm text-gray-400">水やり記録を保存しました</p>
        </div>

        <div className="w-full max-w-sm">
          <button
            className="btn btn-success w-full rounded-full text-white font-bold text-base"
            onClick={() => navigate("/")}
          >
            MAPへ戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <GreenHeader
        title={spot.name}
        onBack={() => navigate("/")}
        weather={spot.weather}
        showLeaf
      />

      <div className="px-4 -mt-4 space-y-3 pb-8">
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="flex justify-between items-center py-2">
            <span className="text-gray-600">ホップ株数</span>
            <span className="font-bold text-lg">{spot.plantCount} 株</span>
          </div>
          <hr />
          <div className="flex justify-between items-center py-2 mt-1">
            <span className="text-gray-600">本日の状況</span>
            <StatusBadge wateredToday={spot.wateredToday} isRainy={isRainy} />
          </div>
        </div>

        {spot.memo && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 items-start">
            <AlertCircle size={18} className="text-amber-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-bold text-amber-700 text-sm">給水場所・メモ</p>
              <p className="text-amber-600 text-sm mt-0.5">{spot.memo}</p>
            </div>
          </div>
        )}

        <ActionSection
          spot={spot}
          isRainy={isRainy}
          fromMap={fromMap}
          loading={loading}
          onWater={handleWater}
        />

        <div>
          <h2 className="flex items-center gap-2 font-bold text-gray-700 mb-2">
            <Clock size={16} />
            水やり履歴（直近{showAllLogs ? "20" : "3"}件）
          </h2>
          <div className="bg-white rounded-2xl shadow-sm divide-y">
            {logs.length === 0 ? (
              <div className="px-4 py-5 text-center text-gray-400 text-sm">
                まだ履歴がありません
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex justify-between items-center px-4 py-3">
                  <span className="text-sm text-gray-600">{formatTime(log.createdAt)}</span>
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    <User size={12} />
                    {log.isAnonymous ? "匿名さん" : `${log.displayName}さん`}
                  </span>
                </div>
              ))
            )}
            {(logs.length > 0 || showAllLogs) && (
              <button
                className="w-full py-3 text-center text-[#2dc75c] font-medium text-sm hover:bg-gray-50"
                onClick={() => setShowAllLogs((v) => !v)}
              >
                {showAllLogs ? "折りたたむ" : "さらに表示"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SpotDetailPage;
