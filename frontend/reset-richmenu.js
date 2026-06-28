import axios from 'axios';

const TOKEN = process.env.LINE_ACCESS_TOKEN;
if (!TOKEN) {
  console.error("❌ LINE_ACCESS_TOKEN が設定されていません。");
  console.error("   実行方法: node --env-file=../functions/.env reset-richmenu.js");
  process.exit(1);
}
const headers = { Authorization: `Bearer ${TOKEN}` };

async function resetAll() {
  try {
    console.log("🚀 古いリッチメニューをすべて削除します...");
    
    // 1. 登録されている全リッチメニューを取得
    const { data } = await axios.get('https://api.line.me/v2/bot/richmenu/list', { headers });
    const richmenus = data.richmenus || [];
    
    if (richmenus.length === 0) {
      console.log("✅ 削除するリッチメニューはありませんでした。");
    } else {
      // 2. ひとつずつ削除
      for (const menu of richmenus) {
        await axios.delete(`https://api.line.me/v2/bot/richmenu/${menu.richMenuId}`, { headers });
        console.log(`🗑️ 削除完了: ${menu.richMenuId}`);
      }
    }

    // 3. エイリアス（あだ名）もすべて取得して削除
    console.log("🚀 エイリアスを削除しています...");
    const { data: aliasData } = await axios.get('https://api.line.me/v2/bot/richmenu/alias/list', { headers });
    const aliases = aliasData.aliases || [];
    
    for (const alias of aliases) {
      await axios.delete(`https://api.line.me/v2/bot/richmenu/alias/${alias.richMenuAliasId}`, { headers });
      console.log(`🗑️ エイリアス削除完了: ${alias.richMenuAliasId}`);
    }

    console.log("✨ リセットが完全に終了しました！");
    console.log("👉 この後、もう一度 `node setup-richmenu.js` を実行してください。");

  } catch (error) {
    console.error("❌ エラーが発生しました:", error.response ? error.response.data : error.message);
  }
}

resetAll();
