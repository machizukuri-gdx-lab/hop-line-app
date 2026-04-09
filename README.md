# hop-line-app

LINE LIFF を使ったホップ水やり記録アプリ。
スポットの QR コードをスキャンして水やりを記録し、LINE グループに通知する。

すぎすぎです / 丈治です / ケインです

---

## アーキテクチャ

```
LINE アプリ (LIFF)
    ↓
React + Vite (Render にデプロイ)
    ↓
Firebase Firestore (データベース)
Firebase Cloud Functions (API / LINE通知 / 毎日リセット)
```

---

## ディレクトリ構成

```
hop-line-app/
├── docker-compose.yml         # ローカル開発用 Docker 設定
├── firebase.json              # Firebase / Emulator 設定
├── firestore.rules            # Firestore セキュリティルール
├── firestore.indexes.json     # Firestore インデックス
├── frontend/                  # React フロントエンド
│   ├── Dockerfile             # ローカル開発用
│   ├── src/
│   │   ├── App.tsx            # ルーティング・LIFF 初期化
│   │   ├── firebase.ts        # Firebase / Emulator 接続設定
│   │   ├── liff.ts            # LIFF 初期化
│   │   └── pages/
│   │       ├── MapPage.tsx        # マップ画面（スポット一覧）
│   │       ├── SpotDetailPage.tsx # スポット詳細 + 水やりボタン
│   │       └── ScanPage.tsx       # QR スキャン画面
│   ├── .env.local             # ローカル用環境変数（要作成・git 管理外）
│   └── vite.config.ts
└── functions/                 # Cloud Functions (Node.js)
    ├── Dockerfile             # ローカルエミュレーター用
    ├── src/
    │   └── index.ts           # recordWatering / resetDailyStatus / ping
    └── .env                   # LINE 認証情報（要作成・git 管理外）
```

---

## ローカル開発環境のセットアップ

### 前提条件
- Docker Desktop がインストールされていること
- Node.js 20 以上（`firebase deploy` 用）

### 1. リポジトリをクローン

```bash
git clone https://github.com/machizukuri-gdx-lab/hop-line-app.git
cd hop-line-app
```

### 2. 環境変数ファイルを作成

**`frontend/.env.local`**（ローカル開発用・エミュレーターに接続）

```env
VITE_USE_EMULATOR=true

VITE_FIREBASE_PROJECT_ID=demo-hop-line
VITE_FIREBASE_API_KEY=demo-api-key
VITE_FIREBASE_AUTH_DOMAIN=demo-hop-line.firebaseapp.com
VITE_FIREBASE_STORAGE_BUCKET=demo-hop-line.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=000000000000
VITE_FIREBASE_APP_ID=1:000000000000:web:0000000000000000

# ブラウザから Docker ホストへの接続（自分のマシンの LAN IP に変更）
VITE_FIRESTORE_EMULATOR_HOST=192.168.xx.xx
VITE_FUNCTIONS_EMULATOR_HOST=192.168.xx.xx

# LINE LIFF ID
VITE_LIFF_ID=2009576548-euJBjiN1

# Google Maps（本番と同じキーで OK）
VITE_GOOGLE_MAPS_API_KEY=（管理者に確認）
VITE_GOOGLE_MAPS_MAP_ID=（管理者に確認）
```

> `VITE_FIRESTORE_EMULATOR_HOST` は `ifconfig` または `ipconfig` で確認できる LAN IP（例: `192.168.1.5`）を設定する。`localhost` は Docker コンテナ内から参照できないため使用不可。

**`functions/.env`**（LINE 通知用・ローカルでは空でも動作する）

```env
LINE_CHANNEL_ACCESS_TOKEN=（管理者に確認）
LINE_GROUP_ID=（管理者に確認）
```

### 3. Docker で起動

```bash
docker-compose up --build
```

| URL | 内容 |
|---|---|
| http://localhost:3000 | React アプリ |
| http://localhost:4000 | Firebase Emulator UI |
| http://localhost:8080 | Firestore Emulator |
| http://localhost:5001 | Functions Emulator |

### 4. テストデータを登録

Emulator UI（http://localhost:4000）→ Firestore → `spots` コレクションに以下を追加：

```json
{
  "name": "専修大学中庭",
  "location": { "lat": 35.611, "lng": 139.543 },
  "wateredToday": false,
  "plantCount": 50
}
```

### 5. 動作確認

- http://localhost:3000 → マップにピンが表示されること
- http://localhost:3000/spot/{ドキュメントID} → 水やりボタンが動作すること
- http://localhost:3000/scan → QR スキャン画面が表示されること（LINE 環境以外では動作しない）

---

## 本番デプロイ

### フロントエンド（Render）

GitHub の `main` ブランチにプッシュすると Render が自動デプロイする。
Render ダッシュボードで以下の環境変数を設定すること：

| 変数名 | 内容 |
|---|---|
| `VITE_USE_EMULATOR` | `false` |
| `VITE_FIREBASE_PROJECT_ID` | `hop-line-app` |
| `VITE_FIREBASE_API_KEY` | Firebase の API キー |
| `VITE_FIREBASE_AUTH_DOMAIN` | `hop-line-app.firebaseapp.com` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `hop-line-app.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase の Sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase の App ID |
| `VITE_LIFF_ID` | `2009576548-euJBjiN1` |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps API キー |
| `VITE_GOOGLE_MAPS_MAP_ID` | Google Maps マップ ID |

### Cloud Functions（Firebase）

```bash
firebase deploy --only functions --project hop-line-app
```

`functions/.env` に `LINE_CHANNEL_ACCESS_TOKEN` と `LINE_GROUP_ID` が設定されている必要がある。

---

## Firestore データ構造

### `spots/{spotId}`
```json
{
  "name": "スポット名",
  "location": { "lat": 35.611, "lng": 139.543 },
  "wateredToday": false,
  "plantCount": 50
}
```

### `logs/{logId}`
```json
{
  "spotId": "spot1",
  "userId": "Uxxxx",
  "displayName": "田中さん",
  "isAnonymous": false,
  "createdAt": "Timestamp"
}
```

---

## Cloud Functions

| 関数名 | トリガー | 内容 |
|---|---|---|
| `recordWatering` | onCall (asia-northeast1) | 水やり記録・ログ追加・LINE グループ通知 |
| `resetDailyStatus` | onSchedule (毎日 JST 0:00) | 全スポットの `wateredToday` を `false` にリセット |
| `ping` | onCall | 疎通確認用 |

---

## QR コードの URL 形式

```
https://liff.line.me/2009576548-euJBjiN1/spot/{spotId}
```

スポットの `spotId` は Firestore のドキュメント ID。
