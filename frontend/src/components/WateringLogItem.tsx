import type { ReactNode } from "react";
import { Timestamp } from "firebase/firestore";
import { Droplet } from "lucide-react";
import { formatTime } from "../utils/formatTime";

interface Props {
  time: Timestamp | null;
  label: string;
  subLabel?: string;
  pointsEarned?: number;
}

export function WateringLogItem({ time, label, subLabel, pointsEarned }: Props) {
  let rightElement: ReactNode;
  if (pointsEarned !== undefined) {
    rightElement = (
      <span className="text-sm font-bold text-white bg-[#2dc75c] rounded-full px-3 py-1 shrink-0">
        +{pointsEarned} pt
      </span>
    );
  } else {
    rightElement = (
      <span className="text-xs text-gray-400 shrink-0">{formatTime(time)}</span>
    );
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="w-9 h-9 rounded-full bg-[#2dc75c] flex items-center justify-center shrink-0">
        <Droplet size={16} color="white" fill="white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{label}</p>
        {subLabel && <p className="text-xs text-gray-400">{subLabel}</p>}
      </div>
      {rightElement}
    </div>
  );
}
