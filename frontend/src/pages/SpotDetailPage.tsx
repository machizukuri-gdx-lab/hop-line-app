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
  addDoc,
  setDoc,
  increment,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { httpsCallable } from "firebase/functions";
import liff from "@line/liff";
import {
  AlertCircle,
  Clock,
  Check,
  Droplet,
  Leaf,
  CloudRain,
  Camera,
  X,
  Images,
} from "lucide-react";
import { db, functions, storage } from "../firebase";
import { Spot, PhotoLog } from "../types/spot";
import { StatusBadge } from "../components/StatusBadge";
import { GreenHeader } from "../components/GreenHeader";
import { WateringLogItem } from "../components/WateringLogItem";
import { PhotoAlbum } from "../components/PhotoAlbum";
import { SuccessScreen } from "../components/SuccessScreen";

const Hop_Points = 2;
const Hop_Photo_Points = 1;
const MAX_PHOTOS_PER_SPOT = 3;

interface WateringLog {
  id: string;
  displayName: string;
  isAnonymous: boolean;
  createdAt: Timestamp;
}

interface ActionSectionProps {
  spot: Spot;
  isRainy: boolean;
  fromMap: boolean;
  loading: boolean;
  photoUploading: boolean;
  photosAtLimit: boolean;
  userPostedToday: boolean;
  allPhotosCount: number;
  onWater: () => void;
  onPhotoPress: () => void;
}

function ActionSection({
  spot,
  isRainy,
  fromMap,
  loading,
  photoUploading,
  photosAtLimit,
  userPostedToday,
  allPhotosCount,
  onWater,
  onPhotoPress,
}: ActionSectionProps) {
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
      <div className="flex flex-col gap-3">
        <div className="bg-[#d4f5e2] border border-[#2dc75c]/30 rounded-2xl p-5 text-center">
          <Leaf size={40} className="text-[#2dc75c] mx-auto mb-3" />
          <p className="font-bold text-[#1a7a40] text-lg">本日の水やりは完了しています！</p>
          <p className="text-[#2dc75c] text-sm mt-1">ご協力ありがとうございます。</p>
        </div>
        {!fromMap && (
          <button
            className="btn w-full rounded-full text-white font-bold text-base bg-[#2563eb] hover:bg-[#1d4ed8] border-none shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
            onClick={onPhotoPress}
            disabled={photoUploading || photosAtLimit}
          >
            {photoUploading ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              <>
                <Camera size={18} />
                {userPostedToday
                  ? "本日の写真は投稿済みです"
                  : allPhotosCount >= MAX_PHOTOS_PER_SPOT
                  ? "写真は3枚までです"
                  : "写真を投稿する"}
              </>
            )}
          </button>
        )}
      </div>
    );
  }
  if (fromMap) {
    return (
      <div className="bg-gray-100 rounded-2xl p-5 text-center">
        <p className="text-gray-500 text-sm leading-relaxed">
          現地のQRコードを読み取ると<br />水やり・写真を記録できます
        </p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <button
        className="btn w-full rounded-full text-white font-bold text-base bg-[#1a7a40] hover:bg-[#155f33] border-none shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
        onClick={onWater}
        disabled={loading || photoUploading}
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
      <button
        className="btn w-full rounded-full text-white font-bold text-base bg-[#2563eb] hover:bg-[#1d4ed8] border-none shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
        onClick={onPhotoPress}
        disabled={loading || photoUploading || photosAtLimit}
      >
        {photoUploading ? (
          <span className="loading loading-spinner loading-sm"></span>
        ) : (
          <>
            <Camera size={18} />
            {userPostedToday
              ? "本日の写真は投稿済みです"
              : allPhotosCount >= MAX_PHOTOS_PER_SPOT
              ? "写真は3枚までです"
              : "写真を投稿する"}
          </>
        )}
      </button>
    </div>
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
  const [todayPhotos, setTodayPhotos] = useState<PhotoLog[]>([]);
  const [allPhotosCount, setAllPhotosCount] = useState(0);
  const [userPostedToday, setUserPostedToday] = useState(false);
  const [photoDone, setPhotoDone] = useState(false);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);

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

  useEffect(() => {
    if (!spotId) return;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayQ = query(
      collection(db, "photos"),
      where("spotId", "==", spotId),
      where("createdAt", ">=", Timestamp.fromDate(todayStart)),
      orderBy("createdAt", "desc")
    );
    getDocs(todayQ)
      .then((snap) => {
        setTodayPhotos(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<PhotoLog, "id">),
          }))
        );
      })
      .catch((e) => console.error("写真取得エラー:", e));

    const allQ = query(collection(db, "photos"), where("spotId", "==", spotId));
    const unsubscribe = onSnapshot(allQ, (snap) => {
      setAllPhotosCount(snap.size);
    });

    // 自分が今日このスポットに投稿済みかリアルタイム監視
    // cleanupPhotos 実行後もページリロード不要で即座に反映される
    let unsubscribeUser: (() => void) | undefined;
    liff.getProfile()
      .then((profile) => {
        const myTodayQ = query(
          collection(db, "photos"),
          where("spotId", "==", spotId),
          where("userId", "==", profile.userId),
          where("createdAt", ">=", Timestamp.fromDate(todayStart)),
          orderBy("createdAt", "desc"),
          limit(1)
        );
        unsubscribeUser = onSnapshot(myTodayQ, (snap) => {
          setUserPostedToday(!snap.empty);
        });
      })
      .catch(() => {
        // 匿名ユーザーは1日1回制限なし
      });

    return () => {
      unsubscribe();
      unsubscribeUser?.();
    };
  }, [spotId]);

  const handleWater = async () => {
    if (!spot || loading) return;
    setLoading(true);
    try {
      let displayName = "匿名ユーザー";
      let isAnonymous = false;
      let lineUserId: string | undefined;
      try {
        const profile = await liff.getProfile();
        displayName = profile.displayName;
        lineUserId = profile.userId;
      } catch {
        isAnonymous = true;
      }
      const recordWatering = httpsCallable(functions, "recordWatering");
      await recordWatering({ spotId: spot.id, displayName, isAnonymous, lineUserId });
      setDone(true);
    } catch (e) {
      console.error("水やり記録エラー:", e);
      alert("エラーが発生しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (file: File) => {
    if (!spot || photoUploading) return;

    if (allPhotosCount >= MAX_PHOTOS_PER_SPOT) {
      alert(`このスポットの写真は最大${MAX_PHOTOS_PER_SPOT}枚までです。`);
      return;
    }
    if (userPostedToday) {
      alert("本日はすでに写真を投稿済みです。");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("ファイルサイズが大きすぎます。10MB以下の画像を選択してください。");
      return;
    }

    setPhotoModalOpen(false);
    setPhotoUploading(true);
    try {
      let displayName = "匿名ユーザー";
      let isAnonymous = false;
      let userId = "anonymous";
      try {
        const profile = await liff.getProfile();
        displayName = profile.displayName;
        userId = profile.userId;
      } catch {
        isAnonymous = true;
      }

      const timestamp = Date.now();
      const storageRef = ref(storage, `spots/${spot.id}/${timestamp}_${userId}`);
      await uploadBytes(storageRef, file);
      const imageUrl = await getDownloadURL(storageRef);

      const photoData = {
        spotId: spot.id,
        imageUrl,
        userId,
        displayName,
        isAnonymous,
        createdAt: Timestamp.now(),
      };
      const docRef = await addDoc(collection(db, "photos"), photoData);

      if (!isAnonymous) {
        await setDoc(
          doc(db, "users", userId),
          { totalPoints: increment(Hop_Photo_Points), displayName },
          { merge: true }
        );
      }

      setTodayPhotos((prev) => [{ id: docRef.id, ...photoData }, ...prev]);
      setAllPhotosCount((prev) => prev + 1);
      setUserPostedToday(true);
      setPhotoDone(true);
    } catch (e) {
      console.error("写真アップロードエラー:", e);
      alert("写真のアップロードに失敗しました。もう一度お試しください。");
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handlePhotoUpload(file);
    e.target.value = "";
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

  if (photoDone) {
    return (
      <SuccessScreen
        icon={<Camera size={40} color="white" />}
        iconBgColor="bg-[#2563eb]"
        title="写真を投稿しました！"
        spotName={spot.name}
        points={Hop_Photo_Points}
        subLabel="写真を保存しました"
        buttonLabel="スポットに戻る"
        onButton={() => setPhotoDone(false)}
      />
    );
  }

  if (done) {
    return (
      <SuccessScreen
        icon={<Check size={40} color="white" strokeWidth={3} />}
        iconBgColor="bg-[#2dc75c]"
        title="水やり完了！"
        spotName={spot.name}
        points={Hop_Points}
        subLabel="水やり記録を保存しました"
        buttonLabel="マップへ戻る"
        onButton={() => navigate("/")}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <GreenHeader
        title={spot.name}
        onBack={() => navigate("/")}
        weather={spot.weather}
        locationName={spot.area}
        showLeaf
        imageUrl={spot.imageUrl}
      />

      <div className="px-4 flex flex-col md:flex-row gap-4 pb-8 items-start relative z-10 mt-2">
        <div className="w-full md:w-1/2 space-y-3 mt-1">
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
            photoUploading={photoUploading}
            photosAtLimit={allPhotosCount >= MAX_PHOTOS_PER_SPOT || userPostedToday}
            userPostedToday={userPostedToday}
            allPhotosCount={allPhotosCount}
            onWater={handleWater}
            onPhotoPress={() => setPhotoModalOpen(true)}
          />
        </div>

        <div className="w-full md:w-1/2 space-y-4">
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
                  <WateringLogItem
                    key={log.id}
                    time={log.createdAt}
                    label={log.isAnonymous ? "匿名 さん" : `${log.displayName} さん`}
                  />
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

          <div>
            <h2 className="flex items-center gap-2 font-bold text-gray-700 mb-2">
              <Camera size={16} />
              本日の写真
            </h2>
            <div className="bg-white rounded-2xl shadow-sm p-4">
              <PhotoAlbum photos={todayPhotos} emptyMessage="本日の写真はありません" />
              <button
                className="w-full pt-3 text-center text-[#2563eb] font-medium text-sm hover:opacity-70"
                onClick={() => navigate(`/spot/${spotId}/photos`)}
              >
                過去の写真も見る →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 隠し file input */}
      <input
        id="photo-input-camera"
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        id="photo-input-library"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* 写真選択ボトムシート */}
      {photoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setPhotoModalOpen(false)}
          />
          <div className="relative w-full bg-white rounded-t-3xl p-6 pb-10">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-800 text-lg">写真を追加</h3>
              <button
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
                onClick={() => setPhotoModalOpen(false)}
              >
                <X size={16} className="text-gray-500" />
              </button>
            </div>
            <div className="flex flex-col gap-3">
              <button
                className="btn w-full rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold border-none flex items-center justify-center gap-2"
                onClick={() => document.getElementById("photo-input-camera")?.click()}
              >
                <Camera size={18} />
                写真を撮る
              </button>
              <button
                className="btn w-full rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold border-none flex items-center justify-center gap-2"
                onClick={() => document.getElementById("photo-input-library")?.click()}
              >
                <Images size={18} />
                ライブラリから選ぶ
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default SpotDetailPage;
