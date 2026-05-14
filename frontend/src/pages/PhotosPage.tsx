import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
} from "firebase/firestore";
import { ChevronLeft, Camera } from "lucide-react";
import { db } from "../firebase";
import { PhotoLog } from "../types/spot";
import { PhotoAlbum } from "../components/PhotoAlbum";

function PhotosPage() {
  const { spotId } = useParams<{ spotId: string }>();
  const navigate = useNavigate();
  const [photos, setPhotos] = useState<PhotoLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!spotId) return;
    const q = query(
      collection(db, "photos"),
      where("spotId", "==", spotId),
      orderBy("createdAt", "desc")
    );
    getDocs(q)
      .then((snap) => {
        setPhotos(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<PhotoLog, "id">),
          }))
        );
      })
      .catch((e) => console.error("写真取得エラー:", e))
      .finally(() => setLoading(false));
  }, [spotId]);

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="bg-white shadow-sm px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)}>
          <ChevronLeft size={24} className="text-gray-700" />
        </button>
        <h1 className="font-bold text-gray-800">投稿写真一覧</h1>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg text-success" />
          </div>
        ) : photos.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Camera size={40} className="mx-auto mb-3 opacity-40" />
            <p>写真がありません</p>
          </div>
        ) : (
          <PhotoAlbum photos={photos} />
        )}
      </div>

    </div>
  );
}

export default PhotosPage;
