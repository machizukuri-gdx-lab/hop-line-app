import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { User, History, Camera } from "lucide-react";
import liff from "@line/liff";
import { db } from "../firebase";
import { WateringLogItem } from "../components/WateringLogItem";
import { GreenHeader } from "../components/GreenHeader";
import { PhotoAlbum } from "../components/PhotoAlbum";
import { PhotoLog } from "../types/spot";
import { formatTime } from "../utils/formatTime";

interface UserData {
  displayName: string;
  totalPoints: number;
  wateredCount: number;
}

interface WateringLog {
  id: string;
  spotName: string;
  pointsEarned: number;
  createdAt: Timestamp;
}

function MyPage() {
  const navigate = useNavigate();
  const [pictureUrl, setPictureUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>("");
  const [userData, setUserData] = useState<UserData | null>(null);
  const [logs, setLogs] = useState<WateringLog[]>([]);
  const [myPhotos, setMyPhotos] = useState<PhotoLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const profile = await liff.getProfile();
        setDisplayName(profile.displayName);
        setPictureUrl(profile.pictureUrl ?? null);

        const userSnap = await getDoc(doc(db, "users", profile.userId));
        if (userSnap.exists()) {
          setUserData(userSnap.data() as UserData);
        }

        const q = query(
          collection(db, "logs"),
          where("userId", "==", profile.userId),
          orderBy("createdAt", "desc"),
          limit(10)
        );
        const logsSnap = await getDocs(q);
        setLogs(
          logsSnap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<WateringLog, "id">),
          }))
        );

        const photosQ = query(
          collection(db, "photos"),
          where("userId", "==", profile.userId),
          orderBy("createdAt", "desc")
        );
        const photosSnap = await getDocs(photosQ);
        setMyPhotos(
          photosSnap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<PhotoLog, "id">),
          }))
        );
      } catch (e) {
        console.error("MyPage init error:", e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-sans">
        <span className="loading loading-spinner loading-lg text-success"></span>
      </div>
    );
  }

  const totalPoints = userData?.totalPoints ?? 0;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <GreenHeader title="マイページ" onBack={() => navigate("/")} />

      <div className="px-4 mt-3 flex flex-col md:flex-row gap-4 pb-8 items-start">
        {/* 会員証カード */}
        <div className="w-full md:w-1/3 bg-white rounded-2xl shadow-sm p-5">
          <p className="text-xs font-bold text-gray-400 tracking-widest mb-3">HOP SUPPORTER</p>
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-2xl font-bold text-gray-800 truncate">
                {displayName || "未設定"} さん
              </p>
              <p className="text-3xl font-bold text-amber-500 mt-2">
                {totalPoints.toLocaleString()} pt
              </p>
            </div>
            <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 shrink-0 flex items-center justify-center">
              {pictureUrl ? (
                <img src={pictureUrl} alt="profile" className="w-full h-full object-cover" />
              ) : (
                <User size={32} className="text-gray-400" />
              )}
            </div>
          </div>
        </div>

        {/* 水やり履歴 + 写真アルバム */}
        <div className="w-full md:w-2/3 space-y-4">
          <div>
            <h2 className="flex items-center gap-2 font-bold text-gray-700 mb-2">
              <History size={16} />
              最近の水やり履歴
            </h2>
            <div className="bg-white rounded-2xl shadow-sm divide-y">
              {logs.length === 0 ? (
                <div className="px-4 py-6 text-center text-gray-400 text-sm">
                  まだ水やり履歴がありません
                </div>
              ) : (
                logs.map((log) => (
                  <WateringLogItem
                    key={log.id}
                    time={log.createdAt}
                    label={log.spotName ?? "不明なスポット"}
                    subLabel={formatTime(log.createdAt)}
                    pointsEarned={log.pointsEarned}
                  />
                ))
              )}
            </div>
          </div>

          <div>
            <h2 className="flex items-center gap-2 font-bold text-gray-700 mb-2">
              <Camera size={16} />
              投稿した写真
            </h2>
            <div className="bg-white rounded-2xl shadow-sm p-4">
              <PhotoAlbum photos={myPhotos} emptyMessage="まだ写真を投稿していません" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MyPage;
