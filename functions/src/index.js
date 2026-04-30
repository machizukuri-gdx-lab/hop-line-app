"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchWeatherForSpots = exports.ping = exports.resetDailyStatus = exports.recordWatering = void 0;
const https_1 = require("firebase-functions/v2/https");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const axios_1 = require("axios");
(0, app_1.initializeApp)();
const db = (0, firestore_1.getFirestore)();
exports.recordWatering = (0, https_1.onCall)({ region: "asia-northeast1" }, async (request) => {
    const { spotId, displayName, isAnonymous, lineUserId } = request.data;
    if (!spotId) {
        throw new https_1.HttpsError("invalid-argument", "spotId is required");
    }
    const spotRef = db.collection("spots").doc(spotId);
    const spotSnap = await spotRef.get();
    if (!spotSnap.exists) {
        throw new https_1.HttpsError("not-found", "Spot not found");
    }
    const spot = spotSnap.data();
    if (spot.wateredToday) {
        throw new https_1.HttpsError("already-exists", "Already watered today");
    }
    await spotRef.update({ wateredToday: true });
    const points = spot.plantCount * 10;
    await db.collection("logs").add({
        spotId,
        spotName: spot.name,
        pointsEarned: points,
        userId: lineUserId !== null && lineUserId !== void 0 ? lineUserId : "anonymous",
        displayName: isAnonymous ? "匿名ユーザー" : displayName,
        isAnonymous,
        createdAt: firestore_1.FieldValue.serverTimestamp(),
    });
    if (!isAnonymous && lineUserId) {
        await db.collection("users").doc(lineUserId).set({
            displayName,
            totalPoints: firestore_1.FieldValue.increment(points),
            wateredCount: firestore_1.FieldValue.increment(1),
            lastWateredAt: firestore_1.FieldValue.serverTimestamp(),
        }, { merge: true });
    }
    // LINE グループへ通知 (トークン未設定時はスキップ)
    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    const groupId = process.env.LINE_GROUP_ID;
    if (token && groupId && !token.startsWith("your-")) {
        try {
            const name = isAnonymous ? "匿名ユーザー" : displayName;
            await axios_1.default.post("https://api.line.me/v2/bot/message/push", {
                to: groupId,
                messages: [
                    {
                        type: "text",
                        text: `${name}さんが「${spot.name}」で水やりをしました🌿`,
                    },
                ],
            }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });
        }
        catch (e) {
            console.error("LINE notification failed:", e);
        }
    }
    return { success: true, pointsEarned: points };
});
// 毎日 JST 0:00 (UTC 15:00) に全スポットのステータスをリセット
exports.resetDailyStatus = (0, scheduler_1.onSchedule)({ schedule: "0 15 * * *", timeZone: "UTC", region: "asia-northeast1" }, async () => {
    const spotsSnap = await db.collection("spots").get();
    const batch = db.batch();
    spotsSnap.docs.forEach((doc) => {
        batch.update(doc.ref, { wateredToday: false });
    });
    await batch.commit();
    console.log(`Reset ${spotsSnap.size} spots to wateredToday: false`);
});
exports.ping = (0, https_1.onCall)({ region: "asia-northeast1" }, async (_request) => {
    return { message: "pong", timestamp: new Date().toISOString() };
});
const RAINY_CODES = new Set([
    200, 201, 202, 210, 211, 212, 221, 230, 231, 232,
    300, 301, 302, 310, 311, 312, 313, 314, 321,
    500, 501, 502, 503, 504, 511, 520, 521, 522, 531,
]);
// 1時間ごとに全スポットの天気を取得してFirestoreに保存
exports.fetchWeatherForSpots = (0, scheduler_1.onSchedule)({ schedule: "0 * * * *", timeZone: "Asia/Tokyo", region: "asia-northeast1" }, async () => {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
        console.log("OPENWEATHER_API_KEY not set, skipping");
        return;
    }
    const spotsSnap = await db.collection("spots").get();
    await Promise.all(spotsSnap.docs.map(async (docSnap) => {
        const spot = docSnap.data();
        const loc = spot.location;
        if (!(loc === null || loc === void 0 ? void 0 : loc.lat) || !(loc === null || loc === void 0 ? void 0 : loc.lng))
            return;
        const { lat, lng } = loc;
        try {
            const res = await axios_1.default.get(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric&lang=ja`);
            const w = res.data;
            const conditionCode = w.weather[0].id;
            await docSnap.ref.update({
                weather: {
                    description: w.weather[0].description,
                    temp: Math.round(w.main.temp),
                    conditionCode,
                    isRainy: RAINY_CODES.has(conditionCode),
                    updatedAt: firestore_1.FieldValue.serverTimestamp(),
                },
            });
        }
        catch (e) {
            console.error(`Weather fetch failed for spot ${docSnap.id}:`, e);
        }
    }));
    console.log(`Weather updated for ${spotsSnap.size} spots`);
});
//# sourceMappingURL=index.js.map