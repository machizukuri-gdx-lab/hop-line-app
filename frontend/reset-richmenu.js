import axios from 'axios';

const TOKEN = "sMfXReU85VZK4Llu4aFSuou5tGaBBza8S838av3soUb0WqW83mEn/HtanaFIZJHUUwZ0GzJyENPA8v4BLHNfb1gZVlIXsWfFB8tCorD4yz/sy+3m6311aisL1URsQPFd8YHYDbgTpA2aIo2W5dD3nQdB04t89/1O/w1cDnyilFU=";
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
