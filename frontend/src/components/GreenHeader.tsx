import { ChevronLeft, Leaf, MapPin } from "lucide-react";
import { WeatherIcon } from "./WeatherIcon";
import { WeatherInfo } from "../types/spot";

interface Props {
  title: string;
  onBack: () => void;
  weather?: WeatherInfo;
  showLeaf?: boolean;
  imageUrl?: string;
  locationName?: string;
}

export function GreenHeader({ title, onBack, weather, showLeaf = false, imageUrl, locationName }: Props) {
  let containerStyle: { [key: string]: string } = { backgroundColor: "#2dc75c" };
  if (imageUrl) {
    containerStyle = { backgroundImage: `url(${imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" };
  }

  return (
    <div
      className="px-5 pt-5 pb-8 relative overflow-hidden"
      style={containerStyle}
    >
      {imageUrl && <div className="absolute inset-0 bg-black/30" />}
      <div className="relative z-10">
        <button
          className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white mb-4"
          onClick={onBack}
        >
          <ChevronLeft size={22} />
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">{title}</h1>
            <div className="flex items-center gap-3 text-white/90 text-sm">

              {locationName && (
                <span className="flex items-center gap-1">
                  <MapPin size={12} />
                  {locationName}
                </span>
              )}

              {weather && (
                <span className="flex items-center gap-1">
                  <WeatherIcon conditionCode={weather.conditionCode} size={12} />
                  {weather.description} {weather.temp}°C
                </span>
              )}
            </div>
          </div>
          {showLeaf && <Leaf size={48} color="white" opacity={0.5} />}
        </div>
      </div>
    </div>
  );
}
