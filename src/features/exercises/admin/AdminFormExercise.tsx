import { useEffect, useRef, useState } from 'react';
import { z } from 'zod';
import { useFilters, useAdminExerciseMutations, useMuscleMapMeta, useExerciseDetail } from '../api';
import type { TExercise } from '../types';
import { UploadVideoDropzone } from '../../../components/UploadVideoDropzone';
import { UploadImageButton } from '../../../components/UploadImageButton';
import { ChipsSelect } from '../../../components/ChipsSelect';
import { Spinner } from '../../../components/ui/Spinner';
import { MultiSelect } from '../../../components/ui/MultiSelect';

const ExerciseSchema = z.object({
  name: z.string().min(1),
  modality: z.enum(['Gymnastics','Weightlifting','Monostructural']),
  category: z.string().min(1),
  equipment: z.array(z.string()),
  bodyPartFocus: z.enum(['Core','Upper','Lower','Full Body']),
  musclesPrimaryCodes: z.array(z.string()).optional().default([]),
  musclesSecondaryCodes: z.array(z.string()).optional().default([]),
  musclesPrimary: z.array(z.string()).optional().default([]),
  musclesSecondary: z.array(z.string()).optional().default([]),
  difficulty: z.enum(['Beginner','Intermediate','Advanced']).optional(),
  instructions: z.array(z.string()).min(1),
  videoUrl: z.string().url().optional(),
  videoUrlHls: z.string().url().optional(),
  thumbnailUrl: z.string().url().optional(),
  tags: z.array(z.string()).optional().default([]),
  coachingCues: z.array(z.string()).optional().default([]),
  commonFaults: z.array(z.string()).optional().default([]),
  demoStartSec: z.number().optional(),
});

type FormValue = z.infer<typeof ExerciseSchema>;

export function AdminFormExercise({ onClose, initial }: { onClose?: () => void; initial?: Partial<TExercise> & { id?: string } }) {
  const { data: filters } = useFilters();
  const { data: muscleMeta } = useMuscleMapMeta();
  const { create, update: updateExercise, del } = useAdminExerciseMutations();
  const exerciseId = initial?.id as string | undefined;
  const { data: fullDetail } = useExerciseDetail(exerciseId || '');
  const [value, setValue] = useState<FormValue>({
    name: '', modality: 'Gymnastics', category: '', equipment: [], bodyPartFocus: 'Core', musclesPrimaryCodes: [], musclesSecondaryCodes: [], musclesPrimary: [], musclesSecondary: [], difficulty: 'Beginner', instructions: [''], videoUrl: undefined, videoUrlHls: undefined, thumbnailUrl: undefined, tags: [], coachingCues: [], commonFaults: [], demoStartSec: undefined,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const autoThumbRef = useRef<string | undefined>(initial?.thumbnailUrl);

  function setField<K extends keyof FormValue>(k: K, v: FormValue[K]) { setValue((s) => ({ ...s, [k]: v })); }

  function toggleCode(list: 'musclesPrimaryCodes'|'musclesSecondaryCodes', code: string) {
    setValue((s) => {
      const cur = new Set((s as any)[list] as string[]);
      if (cur.has(code)) cur.delete(code); else cur.add(code);
      return { ...s, [list]: Array.from(cur) } as any;
    });
  }

  useEffect(() => {
    if (!initial) return;
    setValue((s) => ({
      ...s,
      name: initial.name ?? s.name,
      modality: (initial.modality as any) ?? s.modality,
      category: initial.category ?? s.category,
      equipment: initial.equipment ?? s.equipment,
      bodyPartFocus: (initial.bodyPartFocus as any) ?? s.bodyPartFocus,
      musclesPrimaryCodes: initial.musclesPrimaryCodes ?? s.musclesPrimaryCodes,
      musclesSecondaryCodes: initial.musclesSecondaryCodes ?? s.musclesSecondaryCodes,
      musclesPrimary: initial.musclesPrimary ?? s.musclesPrimary,
      musclesSecondary: initial.musclesSecondary ?? s.musclesSecondary,
      difficulty: (initial.difficulty as any) ?? s.difficulty,
      instructions: initial.instructions ?? s.instructions,
      videoUrl: initial.videoUrl ?? s.videoUrl,
      videoUrlHls: initial.videoUrlHls ?? s.videoUrlHls,
      thumbnailUrl: initial.thumbnailUrl ?? s.thumbnailUrl,
      tags: initial.tags ?? s.tags,
      coachingCues: initial.coachingCues ?? s.coachingCues,
      commonFaults: initial.commonFaults ?? s.commonFaults,
      demoStartSec: initial.demoStartSec ?? s.demoStartSec,
    }));
    autoThumbRef.current = initial.thumbnailUrl;
  }, [initial]);

  // Enrich from full detail when editing from a lean list item
  useEffect(() => {
    if (!fullDetail) return;
    setValue((s) => ({
      ...s,
      name: fullDetail.name ?? s.name,
      modality: (fullDetail.modality as any) ?? s.modality,
      category: fullDetail.category ?? s.category,
      equipment: fullDetail.equipment ?? s.equipment,
      bodyPartFocus: (fullDetail.bodyPartFocus as any) ?? s.bodyPartFocus,
      musclesPrimaryCodes: fullDetail.musclesPrimaryCodes ?? s.musclesPrimaryCodes,
      musclesSecondaryCodes: fullDetail.musclesSecondaryCodes ?? s.musclesSecondaryCodes,
      musclesPrimary: fullDetail.musclesPrimary ?? s.musclesPrimary,
      musclesSecondary: fullDetail.musclesSecondary ?? s.musclesSecondary,
      difficulty: (fullDetail.difficulty as any) ?? s.difficulty,
      instructions: fullDetail.instructions ?? s.instructions,
      videoUrl: fullDetail.videoUrl ?? s.videoUrl,
      videoUrlHls: fullDetail.videoUrlHls ?? s.videoUrlHls,
      thumbnailUrl: fullDetail.thumbnailUrl ?? s.thumbnailUrl,
      tags: fullDetail.tags ?? s.tags,
      coachingCues: fullDetail.coachingCues ?? s.coachingCues,
      commonFaults: fullDetail.commonFaults ?? s.commonFaults,
      demoStartSec: fullDetail.demoStartSec ?? s.demoStartSec,
    }));
    if (fullDetail.thumbnailUrl) autoThumbRef.current = fullDetail.thumbnailUrl;
  }, [fullDetail]);

  // When meta arrives, backfill codes from names (preferred for save)
  useEffect(() => {
    if (!muscleMeta) return;
    const nameToCode = new Map<string, string>();
    muscleMeta.regions.forEach(r => nameToCode.set(r.name, r.code));
    setValue((s) => {
      const next: FormValue = { ...s };
      if ((next.musclesPrimaryCodes?.length || 0) === 0 && (next.musclesPrimary?.length || 0) > 0) {
        next.musclesPrimaryCodes = (next.musclesPrimary || []).map(n => nameToCode.get(n) || n);
      }
      if ((next.musclesSecondaryCodes?.length || 0) === 0 && (next.musclesSecondary?.length || 0) > 0) {
        next.musclesSecondaryCodes = (next.musclesSecondary || []).map(n => nameToCode.get(n) || n);
      }
      return next;
    });
  }, [muscleMeta]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = {
      ...value,
      name: (value.name || '').trim(),
      category: (value.category || '').trim(),
      instructions: (value.instructions || []).map((s) => (s ?? '').toString().trim()).filter(Boolean),
      coachingCues: (value.coachingCues || []).map((s) => (s ?? '').toString().replace(/\s+/g, ' ').trim()).filter(Boolean),
      commonFaults: (value.commonFaults || []).map((s) => (s ?? '').toString().replace(/\s+/g, ' ').trim()).filter(Boolean),
    } as FormValue;
    // Sanitize muscles against meta: remove unknown codes, limit primaries to 3, and avoid duplicates across primary/secondary
    try {
      const known = new Set((muscleMeta?.regions || []).map(r => r.code));
      const prim = (cleaned.musclesPrimaryCodes || []).filter(c => known.has(c));
      const sec0 = (cleaned.musclesSecondaryCodes || []).filter(c => known.has(c));
      const primLimited = prim.slice(0, 3);
      const sec = sec0.filter(c => !primLimited.includes(c));
      cleaned.musclesPrimaryCodes = primLimited as any;
      cleaned.musclesSecondaryCodes = sec as any;
    } catch {}
    const parsed = ExerciseSchema.safeParse(cleaned);
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors as Record<string, string[]>;
      const next: Record<string, string> = {};
      for (const k in flat) { if (flat[k]?.[0]) next[k] = flat[k][0] as string; }
      setErrors(next);
      const firstKey = Object.keys(next)[0];
      const map: Record<string,string> = { name: 'form-name', category: 'form-category', modality: 'form-modality', difficulty: 'form-difficulty', bodyPartFocus: 'form-bpf', instructions: 'form-instruction-0' };
      const el = document.getElementById(map[firstKey] || 'form-name');
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      (el as HTMLInputElement | HTMLTextAreaElement | null)?.focus?.();
      return;
    }
    const payload = { ...parsed.data } as any;
    // Keep bodyPartFocus as-is (e.g., "Full Body"). Backend expects the human label, not a compact code.
    // Send canonical codes only; let backend normalize names
    delete payload.musclesPrimary;
    delete payload.musclesSecondary;
    setErrors({});
    if (initial?.id) {
      updateExercise.mutate({ id: initial.id, patch: payload }, { onSuccess: () => { onClose?.(); } });
    } else {
      create.mutate(payload, { onSuccess: () => { onClose?.(); } });
    }
  }

  function errClass(base: string, key: keyof FormValue) {
    return base + (errors[key as string] ? ' border-red-500 focus:border-red-500 focus:ring-red-500' : '');
  }
  function addStepAt(i: number) { const arr = [...value.instructions]; arr.splice(i+1, 0, ''); setField('instructions', arr); setTimeout(() => document.getElementById(`form-instruction-${i+1}`)?.focus(), 0); }
  function removeStep(i: number) { const arr = value.instructions.filter((_, idx) => idx !== i); setField('instructions', arr); setTimeout(() => document.getElementById(`form-instruction-${Math.max(0,i-1)}`)?.focus(), 0); }

  return (
    <form className="space-y-8 pb-28" onSubmit={onSubmit}>
      {(create.isPending || updateExercise.isPending) && (
        <div className="sticky top-0 z-20 py-2 bg-white/70 dark:bg-slate-900/70 backdrop-blur">
          <div className="flex items-center justify-end">
            <div className="inline-flex items-center gap-2 rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200 px-3 py-1.5 shadow-sm">
              <Spinner size={16} className="text-amber-600 dark:text-amber-200" />
              <span className="text-sm font-medium">Saving…</span>
            </div>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label htmlFor="form-name" className="block text-sm font-medium select-text">Name</label>
          <input id="form-name" className={errClass("mt-1 w-full rounded-xl border border-gray-300 bg-white dark:bg-slate-900 px-3 py-2 pr-10 text-gray-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400","name")} value={value.name} onChange={(e) => setField('name', e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-medium">Modality</label>
          <ChipsSelect facet="modalities" mode="single" value={value.modality} onChange={(v) => setField('modality', v as string)} createEnabled={false} />
        </div>
        <div>
          <label className="block text-sm font-medium">Difficulty</label>
          <select id="form-difficulty" className={errClass("mt-1 w-full rounded-xl border border-gray-300 bg-white dark:bg-slate-900 px-3 py-2 pr-10 text-gray-900 dark:text-slate-100","difficulty")} value={value.difficulty || ''} onChange={(e) => setField('difficulty', (e.target.value || undefined) as any)}>
            <option value="">Unspecified</option>
            {(['Beginner','Intermediate','Advanced'] as const).map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Category</label>
          <ChipsSelect facet="categories" mode="single" value={value.category} onChange={(v) => setField('category', v as string)} createEnabled />
        </div>
        <div>
          <label className="block text-sm font-medium">Body Part Focus</label>
          <select id="form-bpf" className={errClass("mt-1 w-full rounded-xl border border-gray-300 bg-white dark:bg-slate-900 px-3 py-2 pr-10 text-gray-900 dark:text-slate-100","bodyPartFocus")} value={value.bodyPartFocus} onChange={(e) => setField('bodyPartFocus', e.target.value as any)}>
            {filters?.bodyPartFocus?.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        {/* Muscles selection with modern dropdown UI */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium select-text">Muscles (primary)</label>
          <div className="mt-1">
            <MultiSelect
              value={value.musclesPrimaryCodes || []}
              options={(muscleMeta?.regions || []).map(r => ({ value: r.code, label: r.name }))}
              onChange={(next) => {
                setField('musclesPrimaryCodes', next as any);
                if (muscleMeta) {
                  const codeToName = new Map(muscleMeta.regions.map(r => [r.code, r.name] as const));
                  const names = (next as string[]).map(c => codeToName.get(c)).filter(Boolean) as string[];
                  setField('musclesPrimary', names as any);
                }
              }}
              placeholder="Select primary muscles"
            />
          </div>
          <p className="mt-1 text-xs text-slate-500">Tip: pick 1–3 primary targets.</p>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium select-text">Muscles (secondary)</label>
          <div className="mt-1">
            <MultiSelect
              value={value.musclesSecondaryCodes || []}
              options={(muscleMeta?.regions || []).map(r => ({ value: r.code, label: r.name }))}
              onChange={(next) => {
                setField('musclesSecondaryCodes', next as any);
                if (muscleMeta) {
                  const codeToName = new Map(muscleMeta.regions.map(r => [r.code, r.name] as const));
                  const names = (next as string[]).map(c => codeToName.get(c)).filter(Boolean) as string[];
                  setField('musclesSecondary', names as any);
                }
              }}
              placeholder="Select secondary muscles"
            />
          </div>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium">Equipment</label>
          <div className="mt-1">
            <ChipsSelect
              facet="equipment"
              mode="multi"
              value={value.equipment}
              onChange={(v) => setField('equipment', v as string[])}
              placeholder="Add equipment"
              createEnabled
            />
          </div>
          <p className="mt-1 text-xs text-slate-500">Type to search or create missing equipment.</p>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium">Instructions (steps)</label>
          <div className="mt-2 space-y-2">
            {value.instructions.map((s, i) => (
              <div key={i} className="flex items-center gap-2 rounded-xl border border-gray-300 dark:border-slate-700 px-2 py-1.5 bg-white dark:bg-slate-900">
                <span className="h-6 w-6 shrink-0 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 flex items-center justify-center text-xs">{i+1}</span>
                <input id={`form-instruction-${i}`} className="flex-1 bg-transparent outline-none text-gray-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400" value={s}
                  onChange={(e) => setField('instructions', value.instructions.map((x, idx) => idx===i ? e.target.value : x))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addStepAt(i); }
                    if (e.key === 'Backspace' && (e.currentTarget.value === '')) { e.preventDefault(); if (value.instructions.length>1) removeStep(i); }
                    if (e.key === 'ArrowUp') { document.getElementById(`form-instruction-${Math.max(0,i-1)}`)?.focus(); }
                    if (e.key === 'ArrowDown') { document.getElementById(`form-instruction-${Math.min(value.instructions.length-1,i+1)}`)?.focus(); }
                  }} />
                <button type="button" className="btn-ghost px-2" onClick={() => removeStep(i)} aria-label="Remove step">×</button>
              </div>
            ))}
            <button type="button" className="btn-ghost px-3 py-1.5" onClick={() => setField('instructions', [...value.instructions, ''])}>Add step</button>
            {errors.instructions && <p className="text-xs text-red-600">{errors.instructions}</p>}
          </div>
        </div>

        <div className="md:col-span-2">
          {/* Video section */}
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium select-text">Video</label>
            {(value.videoUrl || value.videoUrlHls) && (
              <button type="button" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-200" onClick={() => { setField('videoUrl', undefined as any); setField('videoUrlHls', undefined as any); }}>
                Remove video
              </button>
            )}
          </div>
          <div className="mt-2 rounded-xl ring-1 ring-gray-200 dark:ring-slate-800 overflow-hidden bg-black/5">
            {(value.videoUrl || value.videoUrlHls) ? (
              <video
                controls
                className="w-full h-44 bg-black object-cover"
                src={value.videoUrl || undefined}
              />
            ) : (
              <div className="rounded-xl border border-dashed border-gray-300 dark:border-slate-700 p-4 text-sm text-slate-500">
                No video yet. Upload a video to generate an automatic thumbnail.
              </div>
            )}
          </div>
          {!value.videoUrl && !value.videoUrlHls && (
            <div className="mt-3 space-y-3">
              <UploadVideoDropzone onUploaded={({ publicId, secureUrl, posterUrl, hlsUrl }) => {
                setField('videoUrl', secureUrl);
                setField('thumbnailUrl', posterUrl);
                setField('videoUrlHls', hlsUrl);
                autoThumbRef.current = posterUrl;
              }} />
              <p className="text-xs text-slate-500">After uploading, remove the video to upload a different one.</p>
            </div>
          )}

          {/* Thumbnail section */}
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium select-text">Thumbnail (used in Library)</label>
              <div className="flex items-center gap-3">
                {autoThumbRef.current && (
                  <button type="button" className="text-sm text-gray-600 hover:underline" onClick={() => setField('thumbnailUrl', autoThumbRef.current!)}>Use auto</button>
                )}
                {value.thumbnailUrl && (
                  <button type="button" className="text-sm text-red-600 hover:underline" onClick={() => setField('thumbnailUrl', undefined as any)}>Delete</button>
                )}
              </div>
            </div>
            <div className="mt-2 grid grid-cols-[1fr_auto] items-center gap-4">
              <div className="relative rounded-xl ring-1 ring-gray-200 dark:ring-slate-800 overflow-hidden aspect-square max-w-[180px] bg-gray-50 dark:bg-slate-800">
                {value.thumbnailUrl ? (
                  <img src={value.thumbnailUrl} alt="Thumbnail" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-500">Auto thumbnail from video</div>
                )}
              </div>
              <UploadImageButton
                variant="button"
                label="Upload custom thumbnail"
                onUploaded={(url) => setField('thumbnailUrl', url)}
                className="btn-ghost px-3 py-2"
              />
            </div>
            <p className="mt-2 text-xs text-slate-500">Square format recommended for best visibility.</p>
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium">Tags</label>
          <ChipsSelect facet="tags" mode="multi" value={value.tags ?? []} onChange={(v) => setField('tags', v as string[])} createEnabled />
        </div>

        <div>
          <label className="block text-sm font-medium select-text">Coaching Cues (one per line)</label>
          <textarea
            className="mt-1 w-full rounded-xl border border-gray-300 bg-white dark:bg-slate-900 px-3 py-2 select-text text-gray-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400"
            rows={4}
            placeholder="Short, actionable sentences. e.g., 'Keep ribs down'"
            value={value.coachingCues?.join('\n') || ''}
            onChange={(e) => setField('coachingCues', e.target.value.split(/\n/))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium select-text">Common Faults (one per line)</label>
          <textarea
            className="mt-1 w-full rounded-xl border border-gray-300 bg-white dark:bg-slate-900 px-3 py-2 select-text text-gray-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400"
            rows={4}
            placeholder="Short, helpful warnings. e.g., 'Overarching lower back'"
            value={value.commonFaults?.join('\n') || ''}
            onChange={(e) => setField('commonFaults', e.target.value.split(/\n/))}
          />
        </div>

        <div>
          <label htmlFor="form-demo-start" className="block text-sm font-medium">Demo Start (sec)</label>
          <input id="form-demo-start" type="number" className="mt-1 w-full rounded-xl border border-gray-300 bg-white dark:bg-slate-900 px-3 py-2 pr-10 text-gray-900 dark:text-slate-100" value={value.demoStartSec ?? ''} onChange={(e) => setField('demoStartSec', e.target.value ? Number(e.target.value) : undefined)} />
        </div>
      </div>
      <div className="sticky bottom-0 z-50 -mx-4 sm:mx-0 px-4 sm:px-0 py-4 pb-[env(safe-area-inset-bottom)] bg-white dark:bg-slate-950 border-t border-gray-200 dark:border-slate-800 flex items-center justify-between gap-2 rounded-b-2xl shadow-[0_-8px_16px_-8px_rgba(0,0,0,0.14)]">
        <div>
          {initial?.id && (
            <button type="button" className="px-3 py-2 rounded-lg text-red-700 bg-red-50 dark:bg-red-900/30 dark:text-red-200" onClick={() => {
              if (!initial?.id) return; if (!confirm('Delete this exercise?')) return;
              del.mutate(initial.id, { onSuccess: () => onClose?.() });
            }}>Delete</button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="btn-ghost px-3 py-2" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary px-4 py-2 rounded-xl inline-flex items-center gap-2" disabled={create.isPending || updateExercise.isPending}>{(create.isPending || updateExercise.isPending) && <Spinner size={16} className="text-white" />}<span>Save</span></button>
        </div>
      </div>
    </form>
  );
}










