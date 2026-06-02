import { useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { PhotoLog } from "../types/spot";
import { formatTime } from "../utils/formatTime";

interface PhotoAlbumProps {
  photos: PhotoLog[];
  emptyMessage?: string;
}

export function PhotoAlbum({ photos, emptyMessage = "まだ写真がありません" }: PhotoAlbumProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoLog | null>(null);

  let photoGrid: ReactNode;
  if (photos.length === 0) {
    photoGrid = <p className="text-center text-gray-400 text-sm py-4">{emptyMessage}</p>;
  } else {
    photoGrid = (
      <div className="grid grid-cols-3 gap-2">
        {photos.map((photo) => (
          <button
            key={photo.id}
            className="aspect-square rounded-xl overflow-hidden bg-gray-100"
            onClick={() => setSelectedPhoto(photo)}
          >
            <img
              src={photo.imageUrl}
              alt="スポット写真"
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                const btn = e.currentTarget.parentElement;
                if (btn) btn.style.display = "none";
              }}
            />
          </button>
        ))}
      </div>
    );
  }

  let lightbox: ReactNode = null;
  if (selectedPhoto) {
    let authorName = selectedPhoto.displayName;
    if (selectedPhoto.isAnonymous) authorName = "匿名ユーザー";

    lightbox = (
      <div
        className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center"
        onClick={() => setSelectedPhoto(null)}
      >
        <button
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
          onClick={() => setSelectedPhoto(null)}
        >
          <X size={20} className="text-white" />
        </button>
        <img
          src={selectedPhoto.imageUrl}
          alt="写真"
          className="max-w-full max-h-[75vh] object-contain"
        />
        <div className="mt-4 text-center px-6">
          <p className="text-white font-bold text-sm">{authorName}</p>
          <p className="text-white/60 text-xs mt-1">
            {formatTime(selectedPhoto.createdAt)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {photoGrid}
      {lightbox}
    </>
  );
}
