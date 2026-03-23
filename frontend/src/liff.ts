import liff from "@line/liff";

export const initLiff = async (): Promise<void> => {
  const liffId = import.meta.env.VITE_LIFF_ID as string;
  await liff.init({ liffId });

  if (!liff.isLoggedIn()) {
    liff.login();
  }
};

export const getLineProfile = async () => {
  return liff.getProfile();
};

export const getLineAccessToken = (): string | null => {
  return liff.getAccessToken();
};

export const scanQRCode = async (): Promise<string> => {
  if (liff.isInClient()) {
    const result = await liff.scanCodeV2();
    return result.value ?? "";
  }
  // 開発環境用フォールバック
  const value = window.prompt("QRコードの値を入力してください (開発環境用):");
  return value ?? "";
};
