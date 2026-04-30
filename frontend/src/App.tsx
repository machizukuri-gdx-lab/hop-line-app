import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { initLiff } from "./liff";
import MapPage from "./pages/MapPage";
import SpotDetailPage from "./pages/SpotDetailPage";
import ScanPage from "./pages/ScanPage";
import MyPage from "./pages/MyPage";

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
      <div data-theme="hop" className="min-h-screen flex items-center justify-center p-6 font-sans text-center">
        <p className="text-red-500">エラー: {error}</p>
      </div>
    );
  }

  if (!liffReady) {
    return (
      <div data-theme="hop" className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-success"></span>
      </div>
    );
  }

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div data-theme="hop">
        <Routes>
          <Route path="/" element={<MapPage />} />
          <Route path="/spot/:spotId" element={<SpotDetailPage />} />
          <Route path="/scan" element={<ScanPage />} />
          <Route path="/mypage" element={<MyPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
