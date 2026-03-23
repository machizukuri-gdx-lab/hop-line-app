import { useEffect, useState } from "react";
import { initLiff } from "./liff";

function App() {
  const [status, setStatus] = useState("初期化中...");

  useEffect(() => {
    initLiff()
      .then(() => setStatus("LIFF 初期化完了"))
      .catch((err) => setStatus(`エラー: ${err.message}`));
  }, []);

  return (
    <div>
      <h1>ホップ水やり記録</h1>
      <p>{status}</p>
    </div>
  );
}

export default App;
