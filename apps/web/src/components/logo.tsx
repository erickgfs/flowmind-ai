// Marca do FlowMind: três barras que lembram as colunas de um quadro.
export function Logo({ withName = true }: { withName?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 font-semibold tracking-tight text-foreground">
      <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" className="text-accent">
        <rect x="1" y="2" width="5" height="16" rx="1.5" fill="currentColor" />
        <rect x="7.5" y="2" width="5" height="11" rx="1.5" fill="currentColor" opacity="0.7" />
        <rect x="14" y="2" width="5" height="7" rx="1.5" fill="currentColor" opacity="0.45" />
      </svg>
      {withName && <span>FlowMind</span>}
    </span>
  );
}
