# hop-line-app

LINE LIFF を使ったホップ水やり記録アプリ。
スポットの QR コードをスキャンして水やりや写真を記録し、ポイントを獲得できる。


## アーキテクチャ

```
LINE アプリ (LIFF)
    ↓
React + Vite (Render にデプロイ)
    ↓
Firebase Firestore (データベース)
Firebase Storage (写真保存)
Firebase Cloud Functions (API / スケジュール)
```

---

## 開発環境と本番環境

| | 開発 | 本番 |
|---|---|---|
| Firebase プロジェクト | `hop-line-app-dev` | `hop-line-app` |
| LINE LIFF ID | `2009576548-G1udlWXm` | `2009576548-euJBjiN1` |
| フロントエンド | `https://localhost:3000`（mkcert で自動 HTTPS） | Render |

---

## ディレクトリ構成

```
hop-line-app/
├── firebase.json              # Firebase の設定
├── firestore.rules            # Firestore セキュリティルール
├── firestore.indexes.json     # Firestore インデックス
├── storage.rules              # Firebase Storage セキュリティルール
├── frontend/                  # React フロントエンド
│   ├── setup-richmenu.js      # LINE リッチメニューのセットアップスクリプト
│   ├── reset-richmenu.js      # LINE リッチメニューの全削除スクリプト
│   └── src/
│       ├── App.tsx            # ルーティング・LIFF 初期化・ユーザープロフィール同期
│       ├── firebase.ts        # Firebase 接続設定
│       ├── liff.ts            # LIFF 初期化
│       ├── types/
│       │   └── spot.ts            # Spot / PhotoLog / WeatherInfo 型定義
│       ├── utils/
│       │   └── formatTime.ts      # Timestamp を「今日 HH:mm」形式に変換
│       ├── pages/
│       │   ├── MapPage.tsx        # マップ画面（スポット一覧）
│       │   ├── SpotDetailPage.tsx # スポット詳細・水やり・写真投稿
│       │   ├── PhotosPage.tsx     # スポットの全写真一覧
│       │   ├── ScanPage.tsx       # QR コードスキャン画面（liff.scanCodeV2）
│       │   ├── InsetSpotsPage.tsx # 個人の家で育てているホップスポット一覧
│       │   ├── MyPage.tsx         # マイページ（ポイント・履歴・写真）
│       │   └── RankingPage.tsx    # ランキング画面
│       └── components/
│           ├── PhotoAlbum.tsx     # 写真グリッド＋ライトボックス
│           ├── SuccessScreen.tsx  # 水やり/写真投稿完了画面
│           ├── GreenHeader.tsx    # 共通ヘッダー
│           ├── StatusBadge.tsx    # 水やり状態バッジ
│           ├── WeatherIcon.tsx    # OpenWeatherMapコードに対応する天気アイコン
│           └── WateringLogItem.tsx# 水やり履歴アイテム
└── functions/                 # Cloud Functions (Node.js)
    ├── src/
    │   └── index.ts           # 各 Cloud Functions の実装
    ├── .env                   # 本番用 APIキー（先輩から入手）
    └── .env.dev               # 開発用 APIキー（先輩から入手）
```



## ローカル開発環境のセットアップ

### 前提条件
- Node.js 20 以上

### 1. リポジトリをクローン

```bash
git clone https://github.com/machizukuri-gdx-lab/hop-line-app.git
cd hop-line-app
```

### 2. 環境変数ファイルを入手

先輩から以下の3ファイルを受け取り、指定の場所に配置する。

| ファイル | 用途 | 必要なタイミング |
|---|---|---|
| `frontend/.env.local` | 開発用 Firebase 接続設定 | ローカル開発時 |
| `functions/.env.dev` | 開発用 APIキー | ローカル開発・開発デプロイ時 |
| `functions/.env` | 本番用 APIキー | 本番デプロイ時 |

`frontend/.env.local` に含まれるキー：

| キー | 用途 |
|---|---|
| `VITE_FIREBASE_PROJECT_ID` | Firebase プロジェクト ID（開発用） |
| `VITE_FIREBASE_API_KEY` | Firebase API キー（開発用） |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth ドメイン（開発用） |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage バケット（開発用） |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Sender ID（開発用） |
| `VITE_FIREBASE_APP_ID` | Firebase App ID（開発用） |
| `VITE_LIFF_ID` | LINE LIFF ID（開発用） |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps API キー |
| `VITE_GOOGLE_MAPS_MAP_ID` | Google Maps マップ ID |

`functions/.env` / `functions/.env.dev` に含まれるキー：

| キー | 用途 |
|---|---|
| `OPENWEATHER_API_KEY` | OpenWeatherMap 天気取得（Cloud Functions で使用） |
| `LINE_ACCESS_TOKEN` | LINE リッチメニュー操作（セットアップスクリプトで使用） |

### 3. フロントエンドを起動

```bash
cd frontend
npm install
npm run dev
```

→ https://localhost:3000 でアプリが開く（初回は macOS のキーチェーンへの証明書登録でパスワードを求められる場合がある）

### 4. 動作確認

- https://localhost:3000 → マップにスポットのピンが表示されること
- https://localhost:3000/spot/{ドキュメントID} → 水やりボタンが動作すること
- https://localhost:3000/scan → QR スキャン画面が表示されること


## スマホ実機確認

### LINE Developers Console の設定（初回のみ）

[LINE Developers Console](https://developers.line.biz/console/) で開発用 LIFF のエンドポイント URL を変更する。

- 変更前: ngrok の URL
- 変更後: `https://localhost:3000`（PC ブラウザ確認時）または `https://[PCのLAN IP]:3000`（スマホ実機確認時）

もしかしたら、APIのアクセス制限でアクセスできない可能性

### PC の LAN IP アドレス確認

```bash
ipconfig getifaddr en0
```

### スマホに Root CA 証明書をインストール（初回のみ）

```bash
# Root CA の場所を確認（ファイルマネージャで開く）
open "$(ls ~/Library/Application\ Support/vite-plugin-mkcert/)"
```

`rootCA.pem` をスマホに送信してインストールする。

**iOS の場合:**
1. AirDrop 等で `rootCA.pem` をスマホに送信
2. 設定 → 一般 → VPN とデバイス管理 → 証明書をインストール
3. 設定 → 一般 → 情報 → 証明書信頼設定 → インストールした CA を有効化

**Android の場合:**
1. `rootCA.pem` をスマホに送信
2. 設定 → セキュリティ → 証明書のインストール → CA 証明書

スマホの LINE アプリから開発 LIFF URL を開く：

```
https://liff.line.me/2009576548-G1udlWXm
```


## 本番デプロイ

### フロントエンド

GitHub の `main` ブランチにプッシュすると Render が自動デプロイする。
Render ダッシュボードで以下の環境変数を設定すること：

| 変数名 | 説明 |
|---|---|
| `VITE_FIREBASE_PROJECT_ID` | Firebase プロジェクト ID（本番用） |
| `VITE_FIREBASE_API_KEY` | Firebase API キー（本番用） |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth ドメイン（本番用） |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage バケット（本番用） |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Sender ID（本番用） |
| `VITE_FIREBASE_APP_ID` | Firebase App ID（本番用） |
| `VITE_LIFF_ID` | LINE LIFF ID（本番用） |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps API キー |
| `VITE_GOOGLE_MAPS_MAP_ID` | Google Maps マップ ID |

### Cloud Functions

```bash
# Functions のみデプロイ（ロジック変更時）
firebase deploy --only functions --project default

# Functions・Storage・インデックスをまとめてデプロイ
firebase deploy --only functions,storage,firestore:indexes --project default

# 開発プロジェクトにデプロイ
firebase deploy --only functions,storage,firestore:indexes --project dev
```



## Firestore データ構造

### `spots/{spotId}`
```json
{
  "name": "スポット名",
  "area": "エリア名",
  "location": { "lat": 35.611, "lng": 139.543 },
  "wateredToday": false,
  "plantCount": 50,
  "memo": "給水場所のメモ（任意）",
  "imageUrl": "https://... （任意）",
  "weather": {
    "description": "晴れ",
    "temp": 22,
    "conditionCode": 800,
    "isRainy": false,
    "updatedAt": "Timestamp"
  }
}
```

- `location` は必須フィールド。欠損するとマップ画面がクラッシュする。
- 位置情報が未設定のスポットは `location: { lat: 0, lng: 0 }` で保存し、マップには表示せず `/spots` ページ（`InsetSpotsPage`）で一覧表示する。

### `logs/{logId}`
```json
{
  "spotId": "spot1",
  "spotName": "スポット名",
  "userId": "Uxxxx",
  "displayName": "田中さん",
  "isAnonymous": false,
  "pointsEarned": 2,
  "createdAt": "Timestamp"
}
```

### `photos/{photoId}`
```json
{
  "spotId": "spot1",
  "imageUrl": "https://firebasestorage...",
  "userId": "Uxxxx",
  "displayName": "田中さん",
  "isAnonymous": false,
  "createdAt": "Timestamp"
}
```

### `users/{userId}`
```json
{
  "displayName": "田中さん",
  "pictureUrl": "https://profile.line-scdn.net/...",
  "totalPoints": 10,
  "wateredCount": 3,
  "lastWateredAt": "Timestamp"
}
```

`displayName` と `pictureUrl` は LIFF ログイン時に自動で同期される。



## ポイント仕様

| アクション | ポイント | 処理場所 |
|---|---|---|
| 水やり | 2 pt | Cloud Functions (`recordWatering`) |
| 写真投稿 | 1 pt | フロントエンド（直接 Firestore に書き込み） |

- 水やりは1スポット1日1回のみ記録可能。
- 写真はログインユーザーのみ1スポット1日1枚・スポット合計3枚まで。匿名ユーザーは枚数制限なし。



## Cloud Functions

| 関数名 | トリガー | 内容 |
|---|---|---|
| `recordWatering` | onCall (asia-northeast1) | 水やり記録・ログ追加・ポイント付与（2pt） |
| `resetDailyStatus` | onSchedule (毎日 JST 0:00) | 全スポットの `wateredToday` を `false` にリセット |
| `fetchWeatherForSpots` | onSchedule (毎時 JST) | OpenWeatherMap で全スポットの天気を取得・保存 |
| `cleanupPhotos` | onCall（月次手動実行） | photos コレクションと Storage の写真を全削除 |
| `ping` | onCall | 疎通確認用 |



## LINE リッチメニュー

2 タブ構成のリッチメニューを採用している。

| タブ | エイリアス | ボタン |
|---|---|---|
| 基本メニュー | `menu-a` | QR スキャン / マップ / ランキング / マイページ |
| 情報・ヘルプ | `menu-b` | 水やりの仕方 / 写真の撮り方 / 使い方 / ラボ・ホップとは |

### セットアップ手順

```bash
cd frontend

# 既存のリッチメニューを全削除（再セットアップ時）
node --env-file=../functions/.env reset-richmenu.js

# 画像（image-a.png / image-b.png）を frontend/ に配置してから実行
node --env-file=../functions/.env setup-richmenu.js
```

- `LINE_ACCESS_TOKEN` は `functions/.env` から読み込む（Node.js 20 以上が必要）。
- トークンを再発行した場合は `functions/.env` と `functions/.env.dev` の両方を更新し、チームに共有すること。



## 運用メモ

### 月次写真クリーンアップ

Storage のコストを抑えるため、月に1回手動で写真を削除する。

1. Firebase Storage Console から写真をローカルにバックアップ
2. `cleanupPhotos` を実行：
   ```bash
   firebase functions:shell --project default
   # シェルが起動したら：
   cleanupPhotos({})
   ```
3. Firestore の `photos` コレクションと Storage が空になることを確認

---

## トラブルシューティング

- **デプロイ時に 403 エラー（The caller does not have permission）**
  Firebase CLI にログインしているアカウントが間違っている可能性がある。`firebase login --reauth` で正しいアカウントでログインし直す。

- **Cloud Build の権限エラー（ビルドが失敗する）**
  Google Cloud Console → IAM と管理 → IAM → `{プロジェクト番号}@cloudbuild.gserviceaccount.com` を検索 → 「Cloud Build サービスアカウント（roles/cloudbuild.builds.builder）」ロールを付与。

- **スマホから接続できない**
  PC と同じ Wi-Fi に接続しているか確認。LINE Developers Console の Endpoint URL が PC の LAN IP（`https://[IP]:3000`）になっているか確認。スマホに Root CA 証明書がインストールされているか確認。

- **Firestore インデックスエラー（The query requires an index）**
  `firestore.indexes.json` にインデックスが定義されているか確認し、`firebase deploy --only firestore:indexes --project [dev|default]` でデプロイする。インデックスのビルドには数分かかる。

- **QR スキャンが動作しない**
  `liff.scanCodeV2()` は LIFF ブラウザ内でのみ動作する。PC ブラウザからは動作しないため、スマホの LINE アプリから開くこと。

- **リッチメニュースクリプトが `LINE_ACCESS_TOKEN が設定されていません` で失敗する**
  `functions/.env` に `LINE_ACCESS_TOKEN=xxx` が記載されているか確認する。記載済みの場合は `functions/` ディレクトリからではなく `frontend/` ディレクトリから実行しているか確認する。



## QR コードの URL 形式

```
# 本番
https://liff.line.me/2009576548-euJBjiN1/spot/{spotId}

# 開発
https://liff.line.me/2009576548-G1udlWXm/spot/{spotId}
```
