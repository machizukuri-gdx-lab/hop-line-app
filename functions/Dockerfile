FROM node:20-alpine

# Firestore/Functions エミュレーターは Java が必要
RUN apk add --no-cache openjdk17-jre wget

# Firebase CLI をグローバルインストール
RUN npm install -g firebase-tools@13

WORKDIR /app

# functions の依存関係をインストール (ビルドキャッシュ最適化)
COPY functions/package.json functions/package-lock.json* ./functions/
RUN cd functions && npm install

EXPOSE 4000 5001 8080 9099

# TypeScript をビルドしてからエミュレーターを起動
# demo- プレフィックスにより実 GCP への接続を完全遮断
CMD ["sh", "-c", "cd /app/functions && npm run build && cd /app && firebase emulators:start --only functions,firestore,ui --project demo-hop-line"]
