import { useState } from "react";
import { useNavigate } from "react-router-dom";
import liff from "@line/liff";

function ScanPage() {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleScan = async () => {
    setScanning(true);
    setError(null);
    try {
      const result = await liff.scanCodeV2();
      const url = result.value;
      if (!url) {
        setError("QR コードを読み取れませんでした。");
        return;
      }
      // https://liff.line.me/{liffId}/spot/{spotId} または /spot/{spotId} の形式に対応
      const match = url.match(/\/spot\/([^/?#]+)/);
      if (match) {
        navigate(`/spot/${match[1]}`);
      } else {
        setError("ホップスポットの QR コードではありません。");
      }
    } catch (e) {
      setError("スキャンがキャンセルされました。");
    } finally {
      setScanning(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>QR スキャン</h1>
      <p style={styles.description}>
        スポットに設置された QR コードを読み取ってください。
      </p>

      <button
        style={{ ...styles.scanButton, opacity: scanning ? 0.5 : 1 }}
        onClick={handleScan}
        disabled={scanning}
      >
        {scanning ? "スキャン中..." : "📷 QR コードを読み取る"}
      </button>

      {error && <p style={styles.error}>{error}</p>}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: 24,
    maxWidth: 480,
    margin: "0 auto",
    fontFamily: "Noto Sans JP, sans-serif",
    textAlign: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: "#555",
    marginBottom: 40,
  },
  scanButton: {
    width: "100%",
    padding: "16px 0",
    backgroundColor: "#06C755",
    color: "white",
    border: "none",
    borderRadius: 12,
    fontSize: 18,
    fontWeight: "bold",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(6,199,85,0.4)",
  },
  error: {
    marginTop: 24,
    color: "#c0392b",
    fontSize: 15,
  },
};

export default ScanPage;
