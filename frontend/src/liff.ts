import liff from "@line/liff";

export const initLiff = async (): Promise<void> => {
  const liffId = import.meta.env.VITE_LIFF_ID as string;
  await liff.init({ liffId });

  if (!liff.isLoggedIn()) {
    liff.login();
  }
};
