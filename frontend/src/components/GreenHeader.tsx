import { ChevronLeft, Leaf, MapPin } from "lucide-react";
import { WeatherIcon } from "./WeatherIcon";
import { WeatherInfo } from "../types/spot";

interface Props {
  title: string;
  onBack: () => void;
  weather?: WeatherInfo;
  showLeaf?: boolean;
}

export function GreenHeader({ title, onBack, weather, showLeaf = false }: Props) {
  return (
    <div className="bg-[#2dc75c] px-5 pt-5 pb-8 relative overflow-hidden">
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
            <span className="flex items-center gap-1">
              <MapPin size={12} />
              多摩区
            </span>
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
  );
}
