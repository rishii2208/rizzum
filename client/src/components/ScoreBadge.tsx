type Props = {
  coverage?: number;
};

const getTone = (coverage = 0) => {
  if (coverage >= 80) return "bg-emerald-300";
  if (coverage >= 50) return "bg-amber-300";
  return "bg-rose-300";
};

export const ScoreBadge = ({ coverage = 0 }: Props) => (
  <div
    className={`inline-flex items-center gap-3 rounded-full border-4 border-slate-900 px-5 py-2 text-sm font-black tracking-wide text-slate-900 shadow-[4px_4px_0_0_#0f172a] ${getTone(coverage)}`}
  >
    <span>ATS Score</span>
    <span className="text-xl">{coverage}%</span>
  </div>
);
