import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { initLiff } from "./liff";
import MapPage from "./pages/MapPage";
import SpotDetailPage from "./pages/SpotDetailPage";

function App() {
  const [liffReady, setLiffReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initLiff()
      .then(() => setLiffReady(true))
      .catch((err: Error) => setError(err.message));
  }, []);

  if (error) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <p>エラー: {error}</p>
      </div>
    );
  }

  if (!liffReady) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <p>読み込み中...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MapPage />} />
        <Route path="/spot/:spotId" element={<SpotDetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
