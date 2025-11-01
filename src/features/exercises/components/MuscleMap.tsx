import { useEffect, useMemo, useRef, useState } from 'react';
import { useMuscleMapMeta } from '../api';

type Props = { primary: string[]; secondary: string[] };

export function MuscleMap({ primary, secondary }: Props) {
  const { data: meta } = useMuscleMapMeta();
  const [svgText, setSvgText] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const maps = useMemo(() => {
    const byNameFront = new Map<string, string>();
    const byNameBack = new Map<string, string>();
    const byCodeFront = new Map<string, string>();
    const byCodeBack = new Map<string, string>();
    meta?.regions?.forEach((r) => {
      if (r.svgIdFront) {
        byNameFront.set(r.name, r.svgIdFront);
        byCodeFront.set(r.code, r.svgIdFront);
      }
      if (r.svgIdBack) {
        byNameBack.set(r.name, r.svgIdBack);
        byCodeBack.set(r.code, r.svgIdBack);
      }
    });
    // convenience merged maps: allow either names or codes
    const byAnyFront = new Map<string, string>([...byNameFront, ...byCodeFront]);
    const byAnyBack = new Map<string, string>([...byNameBack, ...byCodeBack]);
    return { byNameFront, byNameBack, byCodeFront, byCodeBack, byAnyFront, byAnyBack };
  }, [meta]);

  useEffect(() => {
    (async () => {
      if (!meta?.svgAssets?.front) return;
      try {
        const res = await fetch(meta.svgAssets.front, { cache: 'no-cache' });
        const txt = await res.text();
        // remove hard width/height on root svg to make responsive
        const cleaned = txt.replace(/<svg([^>]*)(width="[^"]+"|height="[^"]+"|\s)*([^>]*)>/i, '<svg$1$3>');
        setSvgText(cleaned);
      } catch {}
    })();
  }, [meta?.svgAssets?.front]);

  // highlight when svg or selections change
  useEffect(() => {
    const svg = containerRef.current?.querySelector('svg');
    if (!svg) return;
    // Clear previous
    svg.querySelectorAll('.m-primary,.m-secondary').forEach((n) => n.classList.remove('m-primary', 'm-secondary'));
    const nameToId = maps.byAnyFront; // front for now; supports names or codes
    // Broad fallbacks for aggregate names
    const FALLBACK: Record<string, string[]> = {
      rectus_abdominis: ['abs_upper','abs_lower'],
      quadriceps: ['quads_outer','quads_inner'],
      trapezius: ['traps'],
    };
    // Alias map for codes that may differ between API and SVG ids
    const ALIASES: Record<string, string[]> = {
      quads_medial: ['vastus_medialis','vm','quads_medialis','vastusmedialis'],
      quads_outer: ['vastus_lateralis','vl','vastuslateralis'],
      quads_inner: ['vastus_intermedius','vi','vastusintermedius'],
      gluteus_maximus: ['glute_max','gluteusmaximus','gluteus-maximus'],
    };
    const add = (arr: string[], cls: string) => {
      arr.forEach((name) => {
        const key = (name || '').toString();
        const id = nameToId.get(key);
        if (id) {
          const el = (svg as any).getElementById ? (svg as any).getElementById(id) : svg.querySelector(`#${CSS.escape(id)}`);
          (el as any)?.classList?.add(cls);
          return;
        }
        const code = key.toLowerCase();
        const alts = FALLBACK[code as keyof typeof FALLBACK];
        if (alts) {
          alts.forEach((alt) => {
            const el = (svg as any).getElementById ? (svg as any).getElementById(alt) : svg.querySelector(`#${CSS.escape(alt)}`);
            (el as any)?.classList?.add(cls);
          });
          return;
        }
        // Try common alias variations and id patterns
        const variants = [
          key,
          key.replace(/_/g, '-'),
          key.replace(/_/g, ''),
          ...(ALIASES[code] || []),
        ];
        for (const v of variants) {
          const byId = (svg as any).getElementById ? (svg as any).getElementById(v) : svg.querySelector(`#${CSS.escape(v)}`);
          if (byId) { (byId as any).classList?.add(cls); return; }
        }
      });
    };
    add(primary || [], 'm-primary');
    add(secondary || [], 'm-secondary');
  }, [svgText, maps, primary, secondary]);

  return (
    <div className="flex flex-col items-center">
      <style>{`
        #muscleMap [id] { fill: #c7c7c7; stroke: #555; transition: fill .15s ease; }
        #muscleMap .m-primary, #muscleMap .m-primary * { fill: #10b981 !important; }
        #muscleMap .m-secondary, #muscleMap .m-secondary * { fill: #10b98199 !important; }
        #muscleMap svg { width: 100%; height: auto; }
      `}</style>
      <div id="muscleMap" ref={containerRef} className="w-full max-w-md drop-shadow-sm" dangerouslySetInnerHTML={{ __html: svgText || '' }} />
    </div>
  );
}
