import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { useApi } from '../../api';

export default function ProgressPage() {
  const api = useApi();
  const [entries, setEntries] = useState<{ date: string; value: number }[]>([]);
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const from = dayjs().subtract(14, 'day').format('YYYY-MM-DD');
    const to = dayjs().format('YYYY-MM-DD');
    api.get<any>(`/progress?metric=weight&from=${from}&to=${to}`).then((res) => setEntries(res.series || [])).finally(() => setLoading(false));
  }, []);

  async function addEntry() {
    const v = Number(value);
    if (!v) return;
    await api.post(`/progress`, { metric: 'weight', date: new Date().toISOString(), value: v });
    setEntries((s) => [...s, { date: new Date().toISOString(), value: v }]);
    setValue('');
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Progress</h1>
      <div className="card"><div className="card-body space-y-3">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="block text-sm font-medium">Weight (kg)</label>
            <input value={value} onChange={(e)=>setValue(e.target.value)} className="w-full rounded-lg border p-2 text-sm" placeholder="e.g. 72.3" />
          </div>
          <button className="btn-primary px-3 py-2" onClick={addEntry}>Add</button>
        </div>
        <div className="text-sm text-gray-600">Recent entries</div>
        <ul className="text-sm">
          {loading && <li className="text-gray-500">Loading…</li>}
          {entries.map((e, i) => (
            <li key={i} className="flex justify-between border-t py-2"><span>{dayjs(e.date).format('MMM D')}</span><span>{e.value.toFixed(1)} kg</span></li>
          ))}
        </ul>
        <div className="h-32 rounded-md bg-gray-100 flex items-center justify-center text-xs text-gray-500">Chart placeholder</div>
      </div></div>
    </div>
  );
}
