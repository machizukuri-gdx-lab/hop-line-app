import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import liff from "@line/liff";
import { db, functions } from "../firebase";

interface Spot {
  id: string;
  name: string;
  location: { lat: number; lng: number };
  wateredToday: boolean;
  plantCount: number;
}

function SpotDetailPage() {
  const { spotId } = useParams<{ spotId: string }>();
  const navigate = useNavigate();
  const [spot, setSpot] = useState<Spot | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!spotId) return;
    const unsubscribe = onSnapshot(doc(db, "spots", spotId), (snapshot) => {
      if (snapshot.exists()) {
        setSpot({ id: snapshot.id, ...(snapshot.data() as Omit<Spot, "id">) });
      } else {
        setNotFound(true);
      }
    });
    return unsubscribe;
  }, [spotId]);

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
      setTimeout(() => navigate("/"), 2500);
    } catch (e) {
      console.error("水やり記録エラー:", e);
      alert("エラーが発生しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  if (notFound) {
    return (
      <div style={styles.container}>
        <p>スポットが見つかりませんでした。</p>
        <button style={styles.backButton} onClick={() => navigate("/")}>
          ← マップへ戻る
        </button>
      </div>
    );
  }

  if (!spot) {
    return (
      <div style={styles.container}>
        <p>読み込み中...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <button style={styles.backButton} onClick={() => navigate("/")}>
        ← マップへ戻る
      </button>

      <h1 style={styles.title}>{spot.name}</h1>
      <p style={styles.info}>🌱 ホップ株数: {spot.plantCount}株</p>

      <div
        style={{
          ...styles.statusBadge,
          backgroundColor: spot.wateredToday ? "#d4f5e2" : "#fde8e8",
          color: spot.wateredToday ? "#1a7a40" : "#c0392b",
        }}
      >
        {spot.wateredToday ? "✅ 本日の水やり完了" : "💧 まだ水やりされていません"}
      </div>

      {done ? (
        <div style={styles.doneMessage}>
          <p>🌿 水やり完了！</p>
          <p>ありがとうございます！マップに戻ります...</p>
        </div>
      ) : (
        <button
          style={{
            ...styles.waterButton,
            opacity: spot.wateredToday || loading ? 0.5 : 1,
            cursor: spot.wateredToday || loading ? "not-allowed" : "pointer",
          }}
          onClick={handleWater}
          disabled={spot.wateredToday || loading}
        >
          {loading ? "記録中..." : "水やりを記録する 💧"}
        </button>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: 24,
    maxWidth: 480,
    margin: "0 auto",
    fontFamily: "Noto Sans JP, sans-serif",
  },
  backButton: {
    background: "none",
    border: "none",
    color: "#4a90e2",
    fontSize: 16,
    cursor: "pointer",
    padding: "8px 0",
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  info: {
    fontSize: 16,
    color: "#555",
    marginBottom: 16,
  },
  statusBadge: {
    padding: "12px 16px",
    borderRadius: 8,
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 32,
    textAlign: "center",
  },
  waterButton: {
    width: "100%",
    padding: "16px 0",
    backgroundColor: "#2dc75c",
    color: "white",
    border: "none",
    borderRadius: 12,
    fontSize: 18,
    fontWeight: "bold",
    boxShadow: "0 4px 12px rgba(45,199,92,0.4)",
  },
  doneMessage: {
    textAlign: "center",
    fontSize: 20,
    color: "#2dc75c",
    padding: 24,
  },
};

export default SpotDetailPage;
