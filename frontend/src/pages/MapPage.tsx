import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot } from "firebase/firestore";
import { APIProvider, Map, AdvancedMarker } from "@vis.gl/react-google-maps";
import { db } from "../firebase";

interface Spot {
  id: string;
  name: string;
  location: { lat: number; lng: number };
  wateredToday: boolean;
  plantCount: number;
}

// 多摩区の中心座標
const TAMA_CENTER = { lat: 35.6118, lng: 139.5432 };

function MapPage() {
  const [spots, setSpots] = useState<Spot[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "spots"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Spot, "id">),
      }));
      setSpots(data);
    });
    return unsubscribe;
  }, []);

  return (
    <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string}>
      <Map
        style={{ width: "100vw", height: "100vh" }}
        defaultCenter={TAMA_CENTER}
        defaultZoom={15}
        mapId={import.meta.env.VITE_GOOGLE_MAPS_MAP_ID as string}
      >
        {spots.map((spot) => (
          <AdvancedMarker
            key={spot.id}
            position={spot.location}
            onClick={() => navigate(`/spot/${spot.id}`)}
            title={spot.name}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                backgroundColor: spot.wateredToday ? "#2dc75c" : "#ff4444",
                border: "3px solid white",
                boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
              }}
            >
              {spot.wateredToday ? "✅" : "💧"}
            </div>
          </AdvancedMarker>
        ))}
      </Map>
    </APIProvider>
  );
}

export default MapPage;
