import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { QrCode } from "lucide-react";
import liff from "@line/liff";
import { GreenHeader } from "../components/GreenHeader";

const SPOT_URL_PATTERN = /\/spot\/([^/?#]+)/;

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
      const match = url.match(SPOT_URL_PATTERN);
      if (match) {
        navigate(`/spot/${match[1]}`);
      } else {
        setError("ホップスポットの QR コードではありません。");
      }
    } catch {
      setError("スキャンがキャンセルされました。");
    } finally {
      setScanning(false);
    }
  };

  let buttonContent: ReactNode;
  if (scanning) {
    buttonContent = (
      <>
        <span className="loading loading-spinner loading-sm"></span>
        スキャン中...
      </>
    );
  } else {
    buttonContent = (
      <>
        <QrCode size={18} />
        QR コードを読み取る
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      <GreenHeader title="QR スキャン" onBack={() => navigate("/")} />

      <div className="flex-1 flex flex-col md:flex-row items-center justify-center px-6 py-6 md:gap-8 -mt-4">
        <div className="bg-white rounded-2xl shadow-sm w-full max-w-sm p-8 text-center mb-6 md:mb-0">
          <div className="w-20 h-20 bg-[#d4f5e2] rounded-full flex items-center justify-center mx-auto mb-4">
            <QrCode size={36} className="text-[#2dc75c]" />
          </div>
          <p className="text-gray-600 text-sm leading-relaxed">
            スポットに設置された QR コードを<br />読み取ってください。
          </p>
        </div>

        <div className="flex flex-col w-full max-w-sm gap-4">
          <button
            className="btn w-full rounded-full text-white font-bold text-base bg-[#06C755] hover:bg-[#05b34c] border-none shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
            onClick={handleScan}
            disabled={scanning}
          >
            {buttonContent}
          </button>

          {error && (
            <div className="alert alert-error rounded-xl w-full">
              <span className="text-sm">{error}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ScanPage;
