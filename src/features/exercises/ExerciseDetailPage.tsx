import { useNavigate, useParams } from 'react-router-dom';
import { useExerciseDetail } from './api';
import { VideoPlayer } from './components/VideoPlayer';
import { Tabs } from './components/Tabs';
import { MuscleMap } from './components/MuscleMap';
import { useMuscleMapMeta } from './api';
import { Tag } from './components/Tag';
import { ArrowLeftIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function ExerciseDetailPage() {
  const { id = '' } = useParams();
  const { data } = useExerciseDetail(id);
  const navigate = useNavigate();

  if (!data) return <div className="text-sm text-gray-500">Loading…</div>;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <button
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-slate-800 text-sm hover:bg-gray-200 dark:hover:bg-slate-700"
          onClick={() => navigate('/exercises')}
          aria-label="Back to library"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          <span>Library</span>
        </button>
        <h1 className="text-2xl sm:text-3xl font-bold">{data.name}</h1>
      </div>
      <div className="rounded-2xl overflow-hidden shadow-sm ring-1 ring-slate-800 dark:ring-slate-800">
        <VideoPlayer url={data.videoUrl} poster={data.thumbnailUrl} />
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <Tag>Modality: {data.modality}</Tag>
          {data.equipment.map((e) => <Tag key={e}>{e}</Tag>)}
        </div>
      </div>

      <div className="mt-6">
        <Tabs
          tabs={[
            { id: 'instructions', label: 'Instructions', content: <InstructionList steps={data.instructions} cues={data.coachingCues} faults={data.commonFaults} /> },
            { id: 'stimulus', label: 'Stimulus', content: <Stimulus primary={data.musclesPrimaryCodes || data.musclesPrimary} secondary={data.musclesSecondaryCodes || data.musclesSecondary} /> },
          ]}
        />
      </div>
    </div>
  );
}

function InstructionList({ steps, cues, faults }: { steps: string[]; cues?: string[]; faults?: string[] }) {
  return (
    <div>
      <p className="text-gray-700 dark:text-slate-300 mb-4">Follow these steps:</p>
      <ol className="list-decimal pl-6 space-y-3">
        {steps.map((s, i) => (
          <li key={i} className="text-gray-800 dark:text-slate-100 leading-relaxed select-text">{s}</li>
        ))}
      </ol>

      {(cues && cues.length > 0) && (
        <div className="mt-6 rounded-2xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/60 dark:bg-emerald-900/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircleIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
            <h4 className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Coaching Cues</h4>
          </div>
          <div className="flex flex-wrap gap-2 select-text">
            {cues.map((c, i) => <Tag key={i} tone="success">{c}</Tag>)}
          </div>
        </div>
      )}

      {(faults && faults.length > 0) && (
        <div className="mt-4 rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-900/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 dark:text-amber-300" />
            <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-300">Common Faults</h4>
          </div>
          <div className="flex flex-wrap gap-2 select-text">
            {faults.map((f, i) => <Tag key={i} tone="warning">{f}</Tag>)}
          </div>
        </div>
      )}
    </div>
  );
}

function Stimulus({ primary, secondary }: { primary: string[]; secondary: string[] }) {
  const { data: meta } = useMuscleMapMeta();
  // Normalize: if codes appear, map to display names using meta
  const codeToName = new Map<string, string>();
  meta?.regions?.forEach(r => codeToName.set(r.code, r.name));
  const normalize = (arr: string[]) => arr.map(v => codeToName.get(v) || v);
  const namesPrimary = normalize(primary || []);
  const namesSecondary = normalize(secondary || []);
  return (
    <div>
      <MuscleMap primary={namesPrimary} secondary={namesSecondary} />
      <div className="mt-6 text-sm">
        <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-emerald-500" /> Primary muscle groups: {namesPrimary.join(', ') || '—'}</div>
        <div className="flex items-center gap-2 mt-2"><span className="h-3 w-3 rounded-full bg-gray-400" /> Secondary muscle groups: {namesSecondary.join(', ') || '—'}</div>
      </div>
      <p className="mt-4 text-xs text-gray-500 dark:text-slate-400">Note: The primary and secondary muscle groups listed are intended for guidance and may vary with technique, load and individual anatomy.</p>
    </div>
  );
}
