import { type PropsWithChildren, type ReactNode } from "react";

type PanelProps = PropsWithChildren<{ title: string; actions?: ReactNode }>;

export const Panel = ({ title, children, actions }: PanelProps) => (
  <section className="space-y-4 rounded-[32px] border-4 border-slate-900 bg-white/90 p-5 shadow-[8px_8px_0_0_#0f172a]">
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-lg font-black tracking-wide text-slate-900">{title}</h2>
      {actions}
    </div>
    {children}
  </section>
);
