interface QualityScoreProps {
  score: number;
}

export default function QualityScore({ score }: QualityScoreProps) {
  const level = score >= 80 ? "high" : score >= 60 ? "mid" : "low";
  const colors = {
    high: "text-green-700 bg-green-50 border-green-200",
    mid: "text-yellow-700 bg-yellow-50 border-yellow-200",
    low: "text-red-700 bg-red-50 border-red-200",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${colors[level]}`}
    >
      精度 {score}
    </span>
  );
}
