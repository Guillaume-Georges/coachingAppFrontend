type Props = { primary: string[]; secondary: string[] };

// Simplified muscle map: only a few groups mapped to paths
const MUSCLE_TO_ID: Record<string, string> = {
  'Rectus Abdominis': 'abs',
  'Hip Flexors': 'hipflex',
  'Quadriceps': 'quads',
  'Hamstrings': 'hams',
  'Glutes': 'glutes',
  'Pectorals': 'pecs',
  'Deltoids': 'delts',
  'Latissimus Dorsi': 'lats',
};

export function MuscleMap({ primary, secondary }: Props) {
  const isPrimary = (k: string) => primary.some(m => m.toLowerCase() === k.toLowerCase());
  const isSecondary = (k: string) => secondary.some(m => m.toLowerCase() === k.toLowerCase());
  function color(id: string) {
    if (isPrimary(getKey(id))) return '#10b981'; // emerald for primary
    if (isSecondary(getKey(id))) return '#9ca3af'; // muted gray for secondary
    return '#cbd5e1'; // slate-300 base regions
  }
  function getKey(id: string) {
    return Object.entries(MUSCLE_TO_ID).find(([, v]) => v === id)?.[0] || id;
  }
  return (
    <div className="flex flex-col sm:flex-row gap-8 justify-center">
      {/* Front figure */}
      <svg viewBox="0 0 200 500" width="260" role="img" aria-label="Front muscle map" className="drop-shadow-sm">
        {/* Base silhouette */}
        <rect x="40" y="60" width="120" height="360" rx="60" fill="#e5e7eb" opacity="0.25" />
        {/* Regions */}
        <path id="delts" d="M50,90 h20 v20 h-20 z M130,90 h20 v20 h-20 z" fill={color('delts')} />
        <path id="pecs" d="M60,120 h80 v40 h-80 z" fill={color('pecs')} />
        <path id="abs" d="M85,170 h30 v120 h-30 z" fill={color('abs')} />
        <path id="hipflex" d="M80,300 h40 v24 h-40 z" fill={color('hipflex')} />
        <path id="quads" d="M70,326 h60 v72 h-60 z" fill={color('quads')} />
      </svg>

      {/* Back figure */}
      <svg viewBox="0 0 200 500" width="260" role="img" aria-label="Back muscle map" className="drop-shadow-sm">
        <rect x="40" y="60" width="120" height="360" rx="60" fill="#e5e7eb" opacity="0.25" />
        <path id="lats" d="M60,140 h80 v60 h-80 z" fill={color('lats')} />
        <path id="glutes" d="M80,260 h40 v40 h-40 z" fill={color('glutes')} />
        <path id="hams" d="M70,304 h60 v72 h-60 z" fill={color('hams')} />
      </svg>

      <div className="text-sm">
        <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ background: '#10b981' }} /> Primary: {primary.join(', ') || '—'}</div>
        <div className="flex items-center gap-2 mt-2"><span className="h-3 w-3 rounded-full" style={{ background: '#9ca3af' }} /> Secondary: {secondary.join(', ') || '—'}</div>
      </div>
    </div>
  );
}
