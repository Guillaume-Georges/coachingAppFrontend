import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useLogSession, useSession } from '../../api/queries';
import { useSessionStore } from './useSessionStore';
import toast from 'react-hot-toast';
import { CloudVideo } from '../../components/CloudinaryVideo';
import { ApiError } from '../../api/client';

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2,'0')}`;
}

export default function WorkoutPage() {
  const params = useParams();
  const workoutId = Number(params.workoutId);
  const { data, isLoading, error } = useSession(workoutId);
  const log = useLogSession(workoutId);
  const { status, elapsedSec, start, pause, resume, complete, tick, rpe, setRpe, notes, setNotes, reset } = useSessionStore();
  const [activeVideoKey, setActiveVideoKey] = useState<'how_to'|'cues'|'faults'|'scaling'>('how_to');
  const autosaveKey = `session:${workoutId}`;

  useEffect(() => {
    if (status !== 'inProgress') return;
    const id = setInterval(() => tick(1), 1000);
    return () => clearInterval(id);
  }, [status, tick]);

  // Autosave RPE/notes every 3s
  useEffect(() => {
    const id = setInterval(() => {
      const payload = { rpe, notes, elapsedSec };
      localStorage.setItem(autosaveKey, JSON.stringify(payload));
    }, 3000);
    return () => clearInterval(id);
  }, [rpe, notes, elapsedSec]);

  // Restore on mount
  useEffect(() => {
    const raw = localStorage.getItem(autosaveKey);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed?.rpe) setRpe(parsed.rpe);
        if (parsed?.notes) setNotes(parsed.notes);
      } catch {}
    }
    localStorage.setItem('lastWorkoutId', String(workoutId));
  }, [workoutId, setRpe, setNotes]);

  async function onSubmit() {
    if (elapsedSec < 20 * 60) {
      toast.error('Minimum 20 minutes required.');
      return;
    }
    try {
      await log.mutateAsync({ sets: [], rpe, durationMin: Math.floor(elapsedSec / 60), notes });
      toast.success('Session logged');
      reset();
    } catch (e) {
      const err = e as ApiError;
      if (err.status === 409) toast('Session already finalized.');
      else if (err.status === 422) toast.error('Duration too short or invalid.');
      else toast.error('Could not submit session');
    }
  }

  if (isLoading) return <div className="space-y-4"><div className="h-6 w-48 bg-gray-200 animate-pulse rounded" /><div className="h-48 bg-gray-200 animate-pulse rounded" /></div>;
  if (error) return <div className="text-sm text-red-600">Failed to load session. Please refresh.</div>;
  if (!data) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div className="card"><div className="card-body space-y-1">
          <div className="text-sm text-gray-500">Planned: {new Date(data.plannedFor).toDateString()}</div>
          <h1 className="text-xl font-semibold">{data.title}</h1>
          <p className="text-gray-600">{data.objective}</p>
        </div></div>

        <div className="card"><div className="card-body space-y-4">
          <h2 className="font-semibold">Blocks</h2>
          {data.blocks.map((b, i) => (
            <div key={i} className="rounded-lg border p-3 space-y-2">
              <div className="text-sm font-medium">{b.type.toUpperCase()}</div>
              <div className="text-sm text-gray-600">{b.items.map((it) => it.name || `Exercise ${it.exerciseId}`).join(' • ')}</div>
              {(b.type === 'straight' || b.type === 'superset') && (
                <SetEditor workoutId={workoutId} items={b.items} />
              )}
            </div>
          ))}
        </div></div>
      </div>

      <div className="space-y-4">
        <div className="card"><div className="card-body space-y-3">
          <div className="text-sm text-gray-500">Timer</div>
          <div className="text-3xl font-mono">{fmt(elapsedSec)}</div>
          {status === 'idle' && <button onClick={start} className="btn-primary w-full py-2">Start</button>}
          {status === 'inProgress' && (
            <div className="flex gap-2">
              <button onClick={pause} className="btn-ghost flex-1 py-2">Pause</button>
              <button onClick={complete} className="btn-primary flex-1 py-2">Complete</button>
            </div>
          )}
          {status === 'paused' && <button onClick={resume} className="btn-primary w-full py-2">Resume</button>}
          {status === 'review' && <button onClick={onSubmit} className="btn-primary w-full py-2">Submit</button>}

          <div className="space-y-2 pt-2">
            <label className="text-sm font-medium">RPE: {rpe ?? 6}</label>
            <input type="range" min={6} max={10} value={rpe ?? 6} onChange={(e) => setRpe(Number(e.target.value))} className="w-full" />
            <textarea value={notes ?? ''} onChange={(e) => setNotes(e.target.value)} placeholder="Notes" className="w-full rounded-lg border p-2 text-sm" />
          </div>
        </div></div>

        <div className="card"><div className="card-body space-y-2">
          <h3 className="font-semibold">Video</h3>
          {(() => {
            const packs = Object.values(data.videos);
            const any = (packs.find(Boolean) as any) || {};
            const variants = ['how_to','cues','faults','scaling'] as const;
            const asset = any?.[activeVideoKey] || variants.map(v=>any?.[v]).find(Boolean);
            return (
              <div className="space-y-2">
                <div className="flex gap-2">
                  {variants.map(v => (
                    <button key={v} className={`px-2 py-1 rounded text-xs ${activeVideoKey===v?'bg-gray-200':'bg-gray-100'}`} onClick={() => setActiveVideoKey(v)}>{v}</button>
                  ))}
                </div>
                {asset ? <VideoWithTelemetry publicId={asset.publicId} poster={asset.poster} label={`${activeVideoKey}`} exerciseKey={`ex-${Object.keys(data.videos)[0]}:${activeVideoKey}`} /> : <div className="text-sm text-gray-500">No video</div>}
              </div>
            );
          })()}
        </div></div>
      </div>
    </div>
  );
}

function VideoWithTelemetry({ publicId, poster, label, exerciseKey }: { publicId: string; poster?: string; label: string; exerciseKey: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const watchedRef = useRef(0);
  const lastSentRef = useRef(0);

  useEffect(() => {
    const el = ref.current; if (!el) return;
    const onTime = () => {
      watchedRef.current += 1; // approx per second via interval below
      if (watchedRef.current - lastSentRef.current >= 10) {
        sendEvent(false);
      }
    };
    const tick = setInterval(onTime, 1000);
    const unload = () => sendEvent(true);
    window.addEventListener('beforeunload', unload);
    return () => { clearInterval(tick); window.removeEventListener('beforeunload', unload); };
  }, []);

  function sendEvent(isUnload: boolean) {
    const delta = watchedRef.current - lastSentRef.current;
    if (delta <= 0) return;
    lastSentRef.current = watchedRef.current;
    const payload = { exerciseKey, variant: label, watchedSec: delta, t: Date.now() };
    const url = (import.meta.env.VITE_API_BASE_URL || '') + '/video-events';
    try {
      if (navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        navigator.sendBeacon(url, blob);
      } else {
        fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload), keepalive: isUnload });
      }
    } catch {}
  }

  return (
    <div className="w-full">
      <video ref={ref} controls playsInline poster={poster} style={{ width: '100%' }}>
        <source src={`https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/video/upload/${publicId}.m3u8`} type="application/vnd.apple.mpegurl" />
      </video>
    </div>
  );
}

function SetEditor({ workoutId, items }: { workoutId: number; items: Array<{ exerciseId?: number; name?: string; sets?: number; reps?: number }> }) {
  const key = `sets:${workoutId}`;
  const [state, setState] = useState<Record<string, { setNum: number; reps?: number; weightKg?: number }[]>>(() => {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  });
  useEffect(() => { localStorage.setItem(key, JSON.stringify(state)); }, [state]);

  useEffect(() => {
    setState((s) => {
      const next = { ...s };
      items.forEach((it, idx) => {
        const eid = String(it.exerciseId ?? it.name ?? idx);
        if (!next[eid]) {
          const count = it.sets ?? 3;
          next[eid] = Array.from({ length: count }).map((_, i) => ({ setNum: i + 1 }));
        }
      });
      return next;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onChange(exerciseKey: string, idx: number, patch: Partial<{ reps?: number; weightKg?: number }>) {
    setState(s => {
      const arr = s[exerciseKey] ? [...s[exerciseKey]] : [];
      arr[idx] = { ...arr[idx], ...patch };
      return { ...s, [exerciseKey]: arr };
    });
  }

  function handleKeyNav(e: React.KeyboardEvent<HTMLInputElement>) {
    const target = e.target as HTMLInputElement;
    const cell = target.dataset.cell;
    if (!cell) return;
    const [eid, idxStr, field] = cell.split(':');
    const idx = Number(idxStr);
    const selectorBase = `[data-cell^="${eid}:"]`;
    const cells = Array.from(document.querySelectorAll<HTMLInputElement>(selectorBase));
    const stride = 2; // reps, weight
    const currentIndex = cells.findIndex(c => c === target);
    if (e.key === 'Enter') {
      e.preventDefault();
      const next = cells[currentIndex + 1];
      next?.focus();
    } else if (e.key === 'Tab') {
      // default
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = cells[currentIndex + stride];
      next?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = cells[currentIndex - stride];
      prev?.focus();
    } else if (e.key === 'ArrowLeft') {
      const prev = cells[currentIndex - 1];
      prev?.focus();
    } else if (e.key === 'ArrowRight') {
      const next = cells[currentIndex + 1];
      next?.focus();
    }
  }

  return (
    <div className="space-y-3">
      {items.map((it, idx) => {
        const eid = String(it.exerciseId ?? it.name ?? idx);
        const rows = state[eid] ?? [];
        return (
          <div key={eid} className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-gray-600"><tr><th className="py-1 pr-2">Set</th><th className="py-1 pr-2">Reps</th><th className="py-1 pr-2">Weight (kg)</th></tr></thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-t">
                    <td className="py-1 pr-2">{r.setNum}</td>
                    <td className="py-1 pr-2"><input data-cell={`${eid}:${i}:reps`} onKeyDown={handleKeyNav} value={r.reps ?? ''} onChange={(e)=>onChange(eid, i, { reps: Number(e.target.value) })} className="w-24 rounded border p-1" /></td>
                    <td className="py-1 pr-2"><input data-cell={`${eid}:${i}:weightKg`} onKeyDown={handleKeyNav} value={r.weightKg ?? ''} onChange={(e)=>onChange(eid, i, { weightKg: Number(e.target.value) })} className="w-24 rounded border p-1" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
