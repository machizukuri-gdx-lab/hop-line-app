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
  lineUserId?: string;
}

export const recordWatering = onCall<RecordWateringData>(
  { region: "asia-northeast1" },
  async (request) => {
    const { spotId, displayName, isAnonymous, lineUserId } = request.data;

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

    const points = spot.plantCount * 10;

    await db.collection("logs").add({
      spotId,
      spotName: spot.name,
      pointsEarned: points,
      userId: lineUserId ?? "anonymous",
      displayName: isAnonymous ? "匿名ユーザー" : displayName,
      isAnonymous,
      createdAt: FieldValue.serverTimestamp(),
    });

    if (!isAnonymous && lineUserId) {
      await db.collection("users").doc(lineUserId).set({
        displayName,
        totalPoints: FieldValue.increment(points),
        wateredCount: FieldValue.increment(1),
        lastWateredAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    }

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

    return { success: true, pointsEarned: points };
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

const RAINY_CODES = new Set([
  200, 201, 202, 210, 211, 212, 221, 230, 231, 232,
  300, 301, 302, 310, 311, 312, 313, 314, 321,
  500, 501, 502, 503, 504, 511, 520, 521, 522, 531,
]);

// 1時間ごとに全スポットの天気を取得してFirestoreに保存
export const fetchWeatherForSpots = onSchedule(
  { schedule: "0 * * * *", timeZone: "Asia/Tokyo", region: "asia-northeast1" },
  async () => {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
      console.log("OPENWEATHER_API_KEY not set, skipping");
      return;
    }

    const spotsSnap = await db.collection("spots").get();
    await Promise.all(
      spotsSnap.docs.map(async (docSnap) => {
        const spot = docSnap.data();
        const loc = spot.location as { lat?: number; lng?: number } | undefined;
        if (!loc?.lat || !loc?.lng) return;
        const { lat, lng } = loc as { lat: number; lng: number };
        try {
          const res = await axios.get(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric&lang=ja`
          );
          const w = res.data;
          const conditionCode: number = w.weather[0].id;
          await docSnap.ref.update({
            weather: {
              description: w.weather[0].description,
              temp: Math.round(w.main.temp),
              conditionCode,
              isRainy: RAINY_CODES.has(conditionCode),
              updatedAt: FieldValue.serverTimestamp(),
            },
          });
        } catch (e) {
          console.error(`Weather fetch failed for spot ${docSnap.id}:`, e);
        }
      })
    );
    console.log(`Weather updated for ${spotsSnap.size} spots`);
  }
);
