import { ReactNode } from "react";

interface SuccessScreenProps {
  icon: ReactNode;
  iconBgColor: string;
  title: string;
  spotName: string;
  points: number;
  subLabel: string;
  buttonLabel: string;
  onButton: () => void;
}

export function SuccessScreen({
  icon, iconBgColor, title, spotName, points, subLabel, buttonLabel, onButton,
}: SuccessScreenProps) {
  return (
    <div className="min-h-screen bg-[#d4f5e2] flex flex-col items-center justify-center p-6 font-sans">
      <div className={`w-20 h-20 rounded-full ${iconBgColor} flex items-center justify-center mb-6 shadow-lg`}>
        {icon}
      </div>
      <h1 className="text-3xl font-bold text-[#1a7a40] mb-1">{title}</h1>
      <p className="text-[#2dc75c] mb-8 text-base">{spotName}</p>

      <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow mb-6">
        <p className="text-center text-gray-500 text-sm mb-2">獲得ポイント</p>
        <p className="text-center text-4xl font-bold text-amber-500">+{points} pt</p>
        <hr className="my-3" />
        <p className="text-center text-sm text-gray-400">{subLabel}</p>
      </div>

      <div className="w-full max-w-sm">
        <button
          className="btn btn-success w-full rounded-full text-white font-bold text-base"
          onClick={onButton}
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}
