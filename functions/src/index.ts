import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
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

    const points = 2;

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

    return { success: true, pointsEarned: points };
  }
);

// 毎日 JST 4:00 (UTC 19:00) と JST 16:00 (UTC 7:00) に全スポットのステータスをリセット
export const resetDailyStatus = onSchedule(
  { schedule: "0 19,7 * * *", timeZone: "UTC", region: "asia-northeast1" },
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

// 月1回手動実行：photosコレクションとStorageを全削除（事前にローカルへバックアップすること）
export const cleanupPhotos = onCall({ region: "asia-northeast1" }, async () => {
  const bucket = getStorage().bucket();
  const photosSnap = await db.collection("photos").get();

  await Promise.all(
    photosSnap.docs.map(async (d) => {
      const { imageUrl } = d.data() as { imageUrl: string };
      try {
        const decodedPath = decodeURIComponent(
          imageUrl.split("/o/")[1].split("?")[0]
        );
        await bucket.file(decodedPath).delete();
      } catch {
        // ファイルが既に存在しない場合は無視
      }
      await d.ref.delete();
    })
  );

  return { deleted: photosSnap.size };
});

const MAX_PHOTOS_PER_SPOT = 4;
const MAX_USER_PHOTOS_PER_SPOT = 2;

interface UploadPhotoData {
  spotId: string;
  imageUrl: string;
  displayName: string;
  isAnonymous: boolean;
  lineUserId?: string;
}

export const uploadPhoto = onCall<UploadPhotoData>(
  { region: "asia-northeast1" },
  async (request) => {
    const { spotId, imageUrl, displayName, isAnonymous, lineUserId } = request.data;

    if (!spotId || !imageUrl) {
      throw new HttpsError("invalid-argument", "spotId and imageUrl are required");
    }

    const jstNow = new Date(Date.now() + 9 * 60 * 60 * 1000);
    jstNow.setHours(0, 0, 0, 0);
    const todayStartUTC = new Date(jstNow.getTime() - 9 * 60 * 60 * 1000);

    const photosRef = db.collection("photos");

    const allSnap = await photosRef
      .where("spotId", "==", spotId)
      .where("createdAt", ">=", todayStartUTC)
      .get();
    if (allSnap.size >= MAX_PHOTOS_PER_SPOT) {
      throw new HttpsError("resource-exhausted", `このスポットの写真は1日最大${MAX_PHOTOS_PER_SPOT}枚までです。`);
    }

    if (!isAnonymous && lineUserId) {
      const userSnap = await photosRef
        .where("spotId", "==", spotId)
        .where("userId", "==", lineUserId)
        .where("createdAt", ">=", todayStartUTC)
        .get();
      if (userSnap.size >= MAX_USER_PHOTOS_PER_SPOT) {
        throw new HttpsError("resource-exhausted", `本日はすでに${MAX_USER_PHOTOS_PER_SPOT}枚投稿済みです。`);
      }
    }

    const photoRef = await photosRef.add({
      spotId,
      imageUrl,
      userId: lineUserId ?? "anonymous",
      displayName: isAnonymous ? "匿名ユーザー" : displayName,
      isAnonymous,
      createdAt: FieldValue.serverTimestamp(),
    });

    if (!isAnonymous && lineUserId) {
      await db.collection("users").doc(lineUserId).set(
        { displayName, totalPoints: FieldValue.increment(1) },
        { merge: true }
      );
    }

    return { success: true, photoId: photoRef.id };
  }
);

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
