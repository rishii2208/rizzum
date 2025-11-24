type Props = {
  coverage?: number;
};

const getTone = (coverage = 0) => {
  if (coverage >= 80) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/40";
  if (coverage >= 50) return "text-amber-300 bg-amber-400/10 border-amber-400/40";
  return "text-rose-300 bg-rose-400/10 border-rose-400/40";
};

export const ScoreBadge = ({ coverage = 0 }: Props) => (
  <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-1 text-sm font-medium ${getTone(coverage)}`}>
    <span>ATS Score</span>
    <span className="text-lg font-semibold">{coverage}%</span>
  </div>
);
