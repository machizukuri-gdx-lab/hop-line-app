import { useEffect, useState, type ReactNode } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
} from "firebase/firestore";
import { Camera } from "lucide-react";
import { db } from "../firebase";
import { PhotoLog } from "../types/spot";
import { PhotoAlbum } from "../components/PhotoAlbum";
import { GreenHeader } from "../components/GreenHeader";

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

  let pageContent: ReactNode;
  if (loading) {
    pageContent = (
      <div className="flex justify-center py-12">
        <span className="loading loading-spinner loading-lg text-success" />
      </div>
    );
  } else if (photos.length === 0) {
    pageContent = (
      <div className="text-center py-12 text-gray-400">
        <Camera size={40} className="mx-auto mb-3 opacity-40" />
        <p>写真がありません</p>
      </div>
    );
  } else {
    pageContent = <PhotoAlbum photos={photos} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <GreenHeader title="投稿写真一覧" onBack={() => navigate(-1)} />
      <div className="p-4">
        {pageContent}
      </div>
    </div>
  );
}

export default PhotosPage;
