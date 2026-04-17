# hop-line-app

LINE LIFF を使ったホップ水やり記録アプリ。
スポットの QR コードをスキャンして水やりを記録し、LINE グループに通知する。

---

## アーキテクチャ

```
LINE アプリ (LIFF)
    ↓
React + Vite (Render にデプロイ)
    ↓
Firebase Firestore (データベース)
Firebase Cloud Functions (API / LINE通知 / リセット)
```

---

## 開発環境と本番環境

| | 開発 | 本番 |
|---|---|---|
| Firebase プロジェクト | `hop-line-app-dev` | `hop-line-app` |
| LINE LIFF ID | `2009576548-G1udlWXm` | `2009576548-euJBjiN1` |
| LINE 通知先 | 開発グループ | 本番グループ |
| フロントエンド | `https://localhost:3000`（mkcert で自動 HTTPS） | Render |

---

## ディレクトリ構成

```
hop-line-app/
├── firebase.json              # Firebase の設定
├── firestore.rules            # Firestore セキュリティルール
├── firestore.indexes.json     # Firestore インデックス
├── frontend/                  # React フロントエンド
│   ├── src/
│   │   ├── App.tsx            # ルーティング・LIFF 初期化
│   │   ├── firebase.ts        # Firebase 接続設定
│   │   ├── liff.ts            # LIFF 初期化
│   │   └── pages/
│   │       ├── MapPage.tsx        # マップ画面（スポット一覧）
│   │       ├── SpotDetailPage.tsx # スポット詳細 + 水やりボタン
│   │       └── ScanPage.tsx       # QR スキャン画面
│   ├── .env.local             # 開発用 Firebase 設定（先輩から入手）
│   ├── .nvmrc                 # Node.js バージョン指定
│   └── vite.config.ts
└── functions/                 # Cloud Functions (Node.js)
    ├── src/
    │   └── index.ts           # recordWatering / resetDailyStatus / ping
    ├── .env                   # 本番用 LINE 認証情報（先輩から入手）
    └── .env.dev               # 開発用 LINE 認証情報（先輩から入手）
```

---

## ローカル開発環境のセットアップ

### 前提条件
- Node.js 20 以上

### 1. リポジトリをクローン

```bash
git clone https://github.com/machizukuri-gdx-lab/hop-line-app.git
cd hop-line-app
```

### 2. 環境変数ファイルを入手

先輩から以下のファイルを受け取り、指定の場所に配置する。

- `frontend/.env.local` — 開発用 Firebase 設定（`hop-line-app-dev` に接続）
- `functions/.env.dev` — 開発用 LINE Bot 認証情報（dev デプロイ時に自動で読まれる）
- `functions/.env` — 本番用 LINE Bot 認証情報（本番デプロイ時のみ必要）

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
- 水やり後、開発 LINE グループに通知が届くこと

---

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

---

## 本番デプロイ

### フロントエンド

GitHub の `main` ブランチにプッシュすると Render が自動デプロイする。
Render ダッシュボードで以下の環境変数を設定すること：

| 変数名 | 値 |
|---|---|
| `VITE_FIREBASE_PROJECT_ID` | `hop-line-app` |
| `VITE_FIREBASE_API_KEY` | Firebase の API キー |
| `VITE_FIREBASE_AUTH_DOMAIN` | `hop-line-app.firebaseapp.com` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `hop-line-app.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase の Sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase の App ID |
| `VITE_LIFF_ID` | `2009576548-euJBjiN1` |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps API キー |
| `VITE_GOOGLE_MAPS_MAP_ID` | `7f88448be7abd496e4b388e8` |

### Cloud Functions

```bash
# 開発プロジェクトにデプロイ（functions/.env.dev が自動で読まれる）
firebase deploy --only functions --project dev

# 本番プロジェクトにデプロイ（functions/.env が自動で読まれる）
firebase deploy --only functions --project default
```

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

## トラブルシューティング

- **デプロイ時に 403 エラー（The caller does not have permission）**
  Firebase CLI にログインしているアカウントが間違っている可能性がある。`firebase login --reauth` で正しいアカウントでログインし直す。

- **Cloud Build の権限エラー（ビルドが失敗する）**
  Google Cloud Console → IAM と管理 → IAM → `{プロジェクト番号}@cloudbuild.gserviceaccount.com` を検索 → 「Cloud Build サービスアカウント（roles/cloudbuild.builds.builder）」ロールを付与。

- **水やり通知が本番グループに届く（開発デプロイ時）**
  `functions/.env.dev` に開発用 `LINE_GROUP_ID` が設定されているか確認。`--project dev` でデプロイしているか確認。

- **スマホから接続できない**
  PC と同じ Wi-Fi に接続しているか確認。LINE Developers Console の Endpoint URL が PC の LAN IP（`https://[IP]:3000`）になっているか確認。スマホに Root CA 証明書がインストールされているか確認。

----

## QR コードの URL 形式

```
# 本番
https://liff.line.me/2009576548-euJBjiN1/spot/{spotId}

# 開発
https://liff.line.me/2009576548-G1udlWXm/spot/{spotId}
```
