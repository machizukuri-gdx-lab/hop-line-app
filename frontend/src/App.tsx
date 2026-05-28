import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Settings } from "lucide-react";
import liff from "@line/liff";
import { doc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { initLiff } from "./liff";
import MapPage from "./pages/MapPage";
import SpotDetailPage from "./pages/SpotDetailPage";
import ScanPage from "./pages/ScanPage";
import MyPage from "./pages/MyPage";
import RankingPage from "./pages/RankingPage";
import PhotosPage from "./pages/PhotosPage";
import InsetSpotsPage from "./pages/InsetSpotsPage";

function App() {
  const [liffReady, setLiffReady] = useState(false);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    initLiff()
      .then(async () => {
        try {
          if (liff.isLoggedIn()) {
            const profile = await liff.getProfile();
            if (profile.userId) {
              const userRef = doc(db, "users", profile.userId);
              await setDoc(userRef, {
                displayName: profile.displayName,
                pictureUrl: profile.pictureUrl || "",
              }, { merge: true });
              console.log("Profile Synced to Firestore");
            }
          }
        } catch (profileErr) {
          console.error("Profile sync error:", profileErr);
        }
        setLiffReady(true);
      })
      .catch((err: Error) => {
        console.error("LIFF Init Error:", err);
        setError(true);
      });
  }, []);

  if (error) {
    return (
      <div data-theme="hop" className="min-h-dvh bg-white flex flex-col items-center justify-center p-10 font-sans text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <Settings size={40} className="text-gray-400 animate-spin-slow" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-4">システムメンテナンス中</h1>
        <p className="text-gray-500 leading-relaxed mb-8">
          ただいまメンテナンスを行っております。<br />
          恐れ入りますが、しばらく時間を置いてから<br />再度アクセスしてください。
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="btn btn-outline rounded-full px-8"
        >
          再読み込み
        </button>
      </div>
    );
  }

  if (!liffReady) {
    return (
      <div data-theme="hop" className="min-h-dvh flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-success"></span>
      </div>
    );
  }

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div data-theme="hop" className="w-full min-h-dvh bg-gray-50 relative overflow-x-hidden">
        <Routes>
          <Route path="/" element={<MapPage />} />
          <Route path="/spot/:spotId" element={<SpotDetailPage />} />
          <Route path="/spot/:spotId/photos" element={<PhotosPage />} />
          <Route path="/scan" element={<ScanPage />} />
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/ranking" element={<RankingPage />} />
          <Route path="/spots" element={<InsetSpotsPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
