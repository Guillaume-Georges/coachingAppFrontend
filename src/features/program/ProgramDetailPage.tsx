import { useParams, useNavigate } from 'react-router-dom';
import { useProgramDetail, useEnroll } from '../../api/queries';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { ApiError } from '../../api/client';

export default function ProgramDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const { data, isLoading } = useProgramDetail(id);
  const enroll = useEnroll();
  const nav = useNavigate();

  if (isLoading || !data) return <div className="space-y-4"><div className="h-8 w-40 bg-gray-200 animate-pulse rounded" /><div className="h-24 bg-gray-200 animate-pulse rounded" /></div>;

  async function onEnroll() {
    try {
      await enroll.mutateAsync(data.id);
      toast.success('Enrolled!');
      nav('/app/plan');
    } catch (e) {
      const err = e as ApiError;
      if (err.status === 409) {
        toast('Already enrolled — continue plan');
        nav('/app/plan');
      } else {
        toast.error('Could not enroll');
      }
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <Tabs data={data} />
      </div>
      <div className="space-y-4">
        <div className="card"><div className="card-body space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gray-200" />
            <div>
              <div className="font-medium">{data.coach.name}</div>
              {data.coach.league && <div className="text-xs" style={{color: data.coach.league.color}}>{data.coach.league.name}</div>}
            </div>
          </div>
          <button onClick={onEnroll} className="btn-primary w-full py-2">Enroll</button>
        </div></div>
      </div>
    </div>
  );
}

function Tabs({ data }: { data: ReturnType<typeof useProgramDetail> extends infer R ? any : any }) {
  const [tab, setTab] = useState<'overview'|'curriculum'|'nutrition'>('overview');
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(['overview','curriculum','nutrition'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 rounded-md text-sm ${tab===t?'bg-gray-200 text-gray-900':'bg-gray-100 text-gray-600 hover:text-gray-900'}`}>{t[0].toUpperCase()+t.slice(1)}</button>
        ))}
      </div>
      {tab === 'overview' && (
        <div className="card"><div className="card-body">
          <h1 className="text-2xl font-semibold">{data.title}</h1>
          <p className="text-gray-600">{data.description}</p>
        </div></div>
      )}
      {tab === 'curriculum' && (
        <div className="card"><div className="card-body space-y-2">
          <h2 className="font-semibold">Curriculum</h2>
          {data.curriculum.map((w: any) => (
            <div key={w.week} className="text-sm text-gray-700">Week {w.week}: {w.days.map((d: any) => d.title).join(', ')}</div>
          ))}
        </div></div>
      )}
      {tab === 'nutrition' && (
        <div className="card"><div className="card-body">
          <h2 className="font-semibold mb-2">Nutrition Phases</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-gray-600">
                <tr><th className="py-1 pr-4">Phase</th><th className="py-1 pr-4">Weeks</th><th className="py-1 pr-4">kcal Δ %</th><th className="py-1 pr-4">Protein g/kg</th><th className="py-1 pr-4">Fat g/kg</th></tr>
              </thead>
              <tbody>
                {data.nutrition.map((n: any) => (
                  <tr key={n.phase} className="border-t">
                    <td className="py-1 pr-4">{n.phase}</td>
                    <td className="py-1 pr-4">{n.weeks}</td>
                    <td className="py-1 pr-4">{n.kcalDeltaPct}</td>
                    <td className="py-1 pr-4">{n.protein_g_per_kg}</td>
                    <td className="py-1 pr-4">{n.fat_g_per_kg}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div></div>
      )}
    </div>
  );
}
