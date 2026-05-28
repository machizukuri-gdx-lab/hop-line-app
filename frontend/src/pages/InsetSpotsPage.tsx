import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot } from "firebase/firestore";
import { MapPin } from "lucide-react";
import { db } from "../firebase";
import { Spot } from "../types/spot";
import { GreenHeader } from "../components/GreenHeader";
import { StatusBadge } from "../components/StatusBadge";
import { WeatherIcon } from "../components/WeatherIcon";

function InsetSpotsPage() {
  const navigate = useNavigate();
  const [spots, setSpots] = useState<Spot[]>([]);

  useEffect(() => {
    return onSnapshot(collection(db, "spots"), (snapshot) => {
      const all = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Spot, "id">),
      }));
      setSpots(all.filter((s) => s.location.lat === 0 && s.location.lng === 0));
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <GreenHeader title="スポット一覧" onBack={() => navigate("/")} />

      <div className="p-4 space-y-3">
        {spots.map((spot) => (
          <button
            key={spot.id}
            className="w-full bg-white rounded-2xl shadow-sm p-4 text-left"
            onClick={() => navigate(`/spot/${spot.id}?from=map`)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800 text-base truncate">{spot.name}</p>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                  {spot.area && (
                    <span className="flex items-center gap-1">
                      <MapPin size={12} />
                      {spot.area}
                    </span>
                  )}
                  {spot.weather && (
                    <span className="flex items-center gap-1">
                      <WeatherIcon conditionCode={spot.weather.conditionCode} size={12} />
                      {spot.weather.description} {spot.weather.temp}°C
                    </span>
                  )}
                </div>
              </div>
              <StatusBadge wateredToday={spot.wateredToday} isRainy={spot.weather?.isRainy ?? false} />
            </div>
          </button>
        ))}

        {spots.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-12">スポットがありません</p>
        )}
      </div>
    </div>
  );
}

export default InsetSpotsPage;
