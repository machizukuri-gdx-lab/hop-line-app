import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { User } from "lucide-react";
import liff from "@line/liff";
import { db } from "../firebase";
import { GreenHeader } from "../components/GreenHeader";

interface RankingUser {
  id: string;
  displayName: string;
  totalPoints: number;
  wateredCount: number;
}

function MedalBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center text-white font-bold text-sm shrink-0">
        1
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 font-bold text-sm shrink-0">
        2
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="w-8 h-8 rounded-full bg-orange-300 flex items-center justify-center text-white font-bold text-sm shrink-0">
        3
      </div>
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-sm shrink-0">
      {rank}
    </div>
  );
}

function RankingPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<RankingUser[]>([]);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        try {
          const profile = await liff.getProfile();
          setMyUserId(profile.userId);
        } catch {
          // 匿名の場合はハイライトなし
        }

        const q = query(
          collection(db, "users"),
          orderBy("totalPoints", "desc"),
          limit(20)
        );
        const snap = await getDocs(q);
        setUsers(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<RankingUser, "id">),
          }))
        );
      } catch (e) {
        console.error("Ranking fetch error:", e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-sans">
        <span className="loading loading-spinner loading-lg text-success"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <GreenHeader title="ランキング" onBack={() => navigate("/")} />

      <div className="px-4 mt-3 pb-8">
        <div className="bg-white rounded-2xl shadow-sm divide-y overflow-hidden">
          {users.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-400 text-sm">
              まだランキングデータがありません
            </div>
          ) : (
            users.map((user, index) => {
              const isMe = user.id === myUserId;
              return (
                <div
                  key={user.id}
                  className={`flex items-center gap-3 px-4 py-3 ${isMe ? "bg-[#d4f5e2]" : ""}`}
                >
                  <MedalBadge rank={index + 1} />
                  <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                    <User size={18} className="text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 truncate">
                      {user.displayName}
                      {isMe && (
                        <span className="ml-1 text-xs text-[#2dc75c] font-normal">（あなた）</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400">{user.wateredCount ?? 0} 回</p>
                  </div>
                  <p className="text-amber-500 font-bold text-base shrink-0">
                    {(user.totalPoints ?? 0).toLocaleString()} pt
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default RankingPage;
