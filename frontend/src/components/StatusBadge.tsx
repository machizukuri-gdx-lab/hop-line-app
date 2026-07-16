interface Props {
  wateredToday: boolean;
  isRainy: boolean;
}

export function StatusBadge({ wateredToday, isRainy }: Props) {
  if (wateredToday) {
    return (
      <span className="badge badge-success text-white font-bold px-3 py-2 rounded-full text-sm">
        水やり済
      </span>
    );
  }
  if (isRainy) {
    return (
      <span className="badge badge-success text-white font-bold px-3 py-2 rounded-full text-sm">
        雨天お休み
      </span>
    );
  }
  return (
    <span className="badge badge-error text-white font-bold px-3 py-2 rounded-full text-sm">
      未実施
    </span>
  );
}
