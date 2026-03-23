import { onCall } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

admin.initializeApp();

/**
 * 動作確認用の ping 関数
 * フロントから callPing() を呼んでレスポンスが返れば Functions エミュレーター接続成功
 */
export const ping = onCall({ region: "asia-northeast1" }, async (_request) => {
  return { message: "pong", timestamp: new Date().toISOString() };
});
