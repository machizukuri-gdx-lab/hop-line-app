import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning, Wind } from "lucide-react";

interface Props {
  conditionCode: number;
  size?: number;
  className?: string;
}

export function WeatherIcon({ conditionCode, size = 14, className }: Props) {
  const props = { size, className };
  if (conditionCode >= 200 && conditionCode < 300) return <CloudLightning {...props} />;
  if (conditionCode >= 300 && conditionCode < 600) return <CloudRain {...props} />;
  if (conditionCode >= 600 && conditionCode < 700) return <CloudSnow {...props} />;
  if (conditionCode >= 700 && conditionCode < 800) return <Wind {...props} />;
  if (conditionCode === 800) return <Sun {...props} />;
  return <Cloud {...props} />;
}
