// setup-richmenu.js
import fs from 'fs';

const LINE_ACCESS_TOKEN = 'sMfXReU85VZK4Llu4aFSuou5tGaBBza8S838av3soUb0WqW83mEn/HtanaFIZJHUUwZ0GzJyENPA8v4BLHNfb1gZVlIXsWfFB8tCorD4yz/sy+3m6311aisL1URsQPFd8YHYDbgTpA2aIo2W5dD3nQdB04t89/1O/w1cDnyilFU=';

// --- 設定 ---
// ※画像がPNGの場合は 'image/png' に変更してください
const IMAGE_TYPE = 'image/png'; 
const IMAGE_A_PATH = './image-a.png'; // 基本メニューの画像
const IMAGE_B_PATH = './image-b.png'; // 情報・ヘルプの画像

// 画像A（基本メニュー）の設計図
const menuA = {
  size: { width: 2500, height: 1686 },
  selected: true,
  name: "基本メニュー",
  chatBarText: "メニューを開く",
  areas: [
    // 右タブ（情報・ヘルプ）領域：タップで menu-b に切り替え
    { bounds: { x: 1250, y: 0, width: 1250, height: 300 }, action: { type: "richmenuswitch", richMenuAliasId: "menu-b", data: "to-b" } },
    // 各メニューボタン（仮）
    { bounds: { x: 0, y: 300, width: 1250, height: 693 }, action: { type: "uri", uri: "https://liff.line.me/2009576548-euJBjiN1/scan" } }, // 左上
    { bounds: { x: 1250, y: 300, width: 1250, height: 693 }, action: { type: "uri", uri: "https://liff.line.me/2009576548-euJBjiN1" } }, // 右上
    { bounds: { x: 0, y: 993, width: 1250, height: 693 }, action: { type: "uri", uri: "https://liff.line.me/2009576548-euJBjiN1/ranking" } }, // 左下
    { bounds: { x: 1250, y: 993, width: 1250, height: 693 }, action: { type: "uri", uri: "https://liff.line.me/2009576548-euJBjiN1/mypage" } } // 右下
  ]
};

// 画像B（情報・ヘルプ）の設計図
const menuB = {
  size: { width: 2500, height: 1686 },
  selected: true,
  name: "情報・ヘルプ",
  chatBarText: "メニューを開く",
  areas: [
    // 左タブ（基本メニュー）領域：タップで menu-a に切り替え
    { bounds: { x: 0, y: 0, width: 1250, height: 300 }, action: { type: "richmenuswitch", richMenuAliasId: "menu-a", data: "to-a" } },
    // 各メニューボタン（仮）
    { bounds: { x: 0, y: 300, width: 1250, height: 693 }, action: { type: "message", text: "準備中です！" } }, // 左上
    { bounds: { x: 1250, y: 300, width: 1250, height: 693 }, action: { type: "message", text: "準備中です！" } }, // 右上
    { bounds: { x: 0, y: 993, width: 1250, height: 693 }, action: { type: "message", text: "準備中です！" } }, // 左下
    { bounds: { x: 1250, y: 993, width: 1250, height: 693 }, action: { type: "message", text: "準備中です！" } } // 右下
  ]
};

// --- API実行用関数群 ---

// 1. 枠組みを作る
async function createRichMenu(menuData) {
  const res = await fetch('https://api.line.me/v2/bot/richmenu', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${LINE_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(menuData)
  });
  const data = await res.json();
  return data.richMenuId;
}

// 2. 画像をアップロードする
async function uploadImage(richMenuId, imagePath) {
  const imageBuffer = fs.readFileSync(imagePath);
  await fetch(`https://api-data.line.me/v2/bot/richmenu/${richMenuId}/content`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${LINE_ACCESS_TOKEN}`, 'Content-Type': IMAGE_TYPE },
    body: imageBuffer
  });
}

// 3. エイリアス（あだ名）を登録する
async function createAlias(richMenuId, aliasId) {
  await fetch('https://api.line.me/v2/bot/richmenu/alias', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${LINE_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ richMenuAliasId: aliasId, richMenuId: richMenuId })
  });
}

// 4. デフォルトメニューに設定する（全ユーザーに表示）
async function setDefault(richMenuId) {
  await fetch(`https://api.line.me/v2/bot/user/all/richmenu/${richMenuId}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${LINE_ACCESS_TOKEN}` }
  });
}

// --- メイン処理 ---
async function main() {
  try {
    console.log("🚀 セットアップ開始...");

    console.log("1. 画像Aの枠組みを作成＆画像アップロード中...");
    const idA = await createRichMenu(menuA);
    await uploadImage(idA, IMAGE_A_PATH);
    
    console.log("2. 画像Bの枠組みを作成＆画像アップロード中...");
    const idB = await createRichMenu(menuB);
    await uploadImage(idB, IMAGE_B_PATH);

    console.log("3. エイリアス（あだ名）を登録中...");
    await createAlias(idA, "menu-a");
    await createAlias(idB, "menu-b");

    console.log("4. 画像Aをデフォルトメニューに設定中...");
    await setDefault(idA);

    console.log("🎉 すべて完了しました！LINEアプリで確認してみてください！");
  } catch (error) {
    console.error("❌ エラーが発生しました:", error);
  }
}

main();