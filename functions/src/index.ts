import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import axios from "axios";

initializeApp();
const db = getFirestore();

interface RecordWateringData {
  spotId: string;
  displayName: string;
  isAnonymous: boolean;
}

export const recordWatering = onCall<RecordWateringData>(
  { region: "asia-northeast1" },
  async (request) => {
    const { spotId, displayName, isAnonymous } = request.data;

    if (!spotId) {
      throw new HttpsError("invalid-argument", "spotId is required");
    }

    const spotRef = db.collection("spots").doc(spotId);
    const spotSnap = await spotRef.get();

    if (!spotSnap.exists) {
      throw new HttpsError("not-found", "Spot not found");
    }

    const spot = spotSnap.data()!;
    if (spot.wateredToday) {
      throw new HttpsError("already-exists", "Already watered today");
    }

    await spotRef.update({ wateredToday: true });

    await db.collection("logs").add({
      spotId,
      userId: request.auth?.uid ?? "anonymous",
      displayName: isAnonymous ? "匿名ユーザー" : displayName,
      isAnonymous,
      createdAt: FieldValue.serverTimestamp(),
    });

    // LINE グループへ通知 (トークン未設定時はスキップ)
    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    const groupId = process.env.LINE_GROUP_ID;
    if (token && groupId && !token.startsWith("your-")) {
      try {
        const name = isAnonymous ? "匿名ユーザー" : displayName;
        await axios.post(
          "https://api.line.me/v2/bot/message/push",
          {
            to: groupId,
            messages: [
              {
                type: "text",
                text: `${name}さんが「${spot.name}」で水やりをしました🌿`,
              },
            ],
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
      } catch (e) {
        console.error("LINE notification failed:", e);
      }
    }

    return { success: true };
  }
);

// 毎日 JST 0:00 (UTC 15:00) に全スポットのステータスをリセット
export const resetDailyStatus = onSchedule(
  { schedule: "0 15 * * *", timeZone: "UTC", region: "asia-northeast1" },
  async () => {
    const spotsSnap = await db.collection("spots").get();
    const batch = db.batch();
    spotsSnap.docs.forEach((doc) => {
      batch.update(doc.ref, { wateredToday: false });
    });
    await batch.commit();
    console.log(`Reset ${spotsSnap.size} spots to wateredToday: false`);
  }
);

export const ping = onCall({ region: "asia-northeast1" }, async (_request) => {
  return { message: "pong", timestamp: new Date().toISOString() };
});
