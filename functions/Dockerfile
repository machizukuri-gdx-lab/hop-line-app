FROM node:20-alpine

# Firestore/Functions エミュレーターは Java が必要
RUN apk add --no-cache openjdk17-jre wget

# Firebase CLI をグローバルインストール
RUN npm install -g firebase-tools@13

WORKDIR /app

EXPOSE 4000 5001 8080 9099

# 起動時に npm install → tsc → エミュレーター起動
# (ボリュームマウント後に実行するため、依存関係が常に最新になる)
CMD ["sh", "-c", "cd /app/functions && npm install && npm run build && cd /app && firebase emulators:start --only functions,firestore,ui --project demo-hop-line"]
