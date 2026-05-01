import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot } from "firebase/firestore";
import { APIProvider, Map, AdvancedMarker } from "@vis.gl/react-google-maps";
import { Filter, Droplet, X, QrCode, User, Trophy } from "lucide-react";
import { db } from "../firebase";
import { Spot } from "../types/spot";
import { WeatherIcon } from "../components/WeatherIcon";
import { StatusBadge } from "../components/StatusBadge";

const TAMA_CENTER = { lat: 35.6118, lng: 139.5432 };

function SpotPopup({ spot, onClose }: { spot: Spot; onClose: () => void }) {
  const navigate = useNavigate();
  const isRainy = spot.weather?.isRainy ?? false;

  return (
    <div 
      className="absolute bg-white rounded-2xl shadow-xl p-4 z-10 w-[calc(100%-2rem)] md:w-80"
      style={{
        bottom: "max(7.5rem, env(safe-area-inset-bottom) + 6rem)",
        left: "max(1rem, env(safe-area-inset-left))",
        right: "max(1rem, env(safe-area-inset-right))",
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-lg">{spot.name}</span>
            <StatusBadge wateredToday={spot.wateredToday} isRainy={isRainy} />
          </div>
          {spot.weather && (
            <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
              <WeatherIcon conditionCode={spot.weather.conditionCode} size={12} />
              {spot.weather.description} {spot.weather.temp}°C
            </div>
          )}
        </div>
        <button
          className="btn btn-ghost btn-sm btn-circle text-gray-400"
          onClick={onClose}
        >
          <X size={16} />
        </button>
      </div>
      <button
        className="btn btn-neutral w-full rounded-xl"
        onClick={() => navigate(`/spot/${spot.id}?from=map`)}
      >
        詳細
      </button>
    </div>
  );
}

function MapMarker({ spot }: { spot: Spot }) {
  const isRainy = spot.weather?.isRainy ?? false;
  const color = isRainy ? "#6b7280" : spot.wateredToday ? "#2dc75c" : "#ef4444";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer" }}>
      <div
        style={{
          width: 36,
          height: 36,
          backgroundColor: color,
          borderRadius: "50% 50% 50% 0",
          transform: "rotate(-45deg)",
          border: "3px solid white",
          boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ transform: "rotate(45deg)", color: "white" }}>
          {spot.wateredToday ? (
            <Droplet size={14} fill="white" />
          ) : (
            <X size={14} strokeWidth={3} />
          )}
        </div>
      </div>
      <div
        style={{
          marginTop: 4,
          backgroundColor: "white",
          borderRadius: 20,
          padding: "2px 8px",
          fontSize: 11,
          fontWeight: 600,
          color: "#374151",
          boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
          whiteSpace: "nowrap",
          maxWidth: 120,
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {spot.name}
      </div>
    </div>
  );
}

function MapPage() {
  const [spots, setSpots] = useState<Spot[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [filterUnwatered, setFilterUnwatered] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    return onSnapshot(collection(db, "spots"), (snapshot) => {
      setSpots(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Spot, "id">),
        }))
      );
    });
  }, []);

  const displayedSpots = filterUnwatered
    ? spots.filter((s) => !s.wateredToday)
    : spots;

  return (
    <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string}>
      <div className="relative w-full h-dvh overflow-hidden">
        <Map
          style={{ width: "100%", height: "100%" }}
          defaultCenter={TAMA_CENTER}
          defaultZoom={15}
          mapId={import.meta.env.VITE_GOOGLE_MAPS_MAP_ID as string}
          onClick={() => setSelectedSpot(null)}
        >
          {displayedSpots.map((spot) => (
            <AdvancedMarker
              key={spot.id}
              position={spot.location}
              onClick={() => setSelectedSpot(spot)}
              title={spot.name}
            >
              <MapMarker spot={spot} />
            </AdvancedMarker>
          ))}
        </Map>

        <div 
          className="absolute z-10 flex gap-2 w-[calc(100%-2rem)] md:w-96"
          style={{ 
            top: "max(1rem, env(safe-area-inset-top))", 
            left: "max(1rem, env(safe-area-inset-left))" 
          }}
        >
          <button
            className={`flex-1 bg-white rounded-full shadow-md px-4 py-3 flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
              filterUnwatered ? "text-red-500" : "text-gray-600"
            }`}
            onClick={() => setFilterUnwatered((v) => !v)}
          >
            <Filter size={15} />
            {filterUnwatered ? "未実施のみ表示中" : "水やり未実施のみ表示"}
          </button>
          <button
            className="bg-white rounded-full shadow-md w-12 h-12 flex items-center justify-center shrink-0"
            onClick={() => navigate("/ranking")}
          >
            <Trophy size={18} className="text-gray-600" />
          </button>
          <button
            className="bg-white rounded-full shadow-md w-12 h-12 flex items-center justify-center shrink-0"
            onClick={() => navigate("/mypage")}
          >
            <User size={18} className="text-gray-600" />
          </button>
        </div>

        <div 
          className="absolute bg-white/90 rounded-2xl shadow px-3 py-2 z-10 text-sm"
          style={{ 
            bottom: "max(7rem, env(safe-area-inset-bottom) + 6rem)", 
            left: "max(1rem, env(safe-area-inset-left))" 
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="w-5 h-5 rounded-full bg-[#2dc75c] flex items-center justify-center">
              <Droplet size={10} color="white" fill="white" />
            </div>
            <span className="text-gray-700">水やり済</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-[#ef4444] flex items-center justify-center">
              <X size={10} color="white" strokeWidth={3} />
            </div>
            <span className="text-gray-700">未実施</span>
          </div>
        </div>

        {selectedSpot && (
          <SpotPopup
            spot={selectedSpot}
            onClose={() => setSelectedSpot(null)}
          />
        )}

        <div 
          className="absolute z-10 w-[calc(100%-2rem)] md:w-80"
          style={{ 
            bottom: "max(1.5rem, env(safe-area-inset-bottom))",
            right: "max(1rem, env(safe-area-inset-right))",
            left: "max(1rem, env(safe-area-inset-left))"
          }}
        >
          <button
            className="w-full bg-amber-400 hover:bg-amber-500 text-white font-bold rounded-full py-4 shadow-lg flex items-center justify-center gap-3 text-base transition-colors md:ml-auto"
            onClick={() => navigate("/scan")}
          >
            <QrCode size={20} />
            QR読込で水やり記録
          </button>
        </div>
      </div>
    </APIProvider>
  );
}

export default MapPage;
