import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { useApi } from '../../api';

export default function NutritionPage() {
  const api = useApi();
  const [targets, setTargets] = useState<{ kcal: number; protein_g: number; fat_g: number; carbs_g: number } | null>(null);
  const [items, setItems] = useState<{ food: string; grams: number }[]>([]);
  const [food, setFood] = useState('');
  const [grams, setGrams] = useState('');
  const [date] = useState(dayjs().format('YYYY-MM-DD'));

  useEffect(() => {
    api.get<any>('/nutrition/targets').then(setTargets);
    api.get<any>(`/nutrition/log?date=${date}`).then(res => setItems(res.items || []));
  }, [date]);

  async function addItem() {
    const entry = { food, grams: Number(grams) };
    if (!entry.food || !entry.grams) return;
    await api.post(`/nutrition/log`, { date, item: entry });
    setItems((s) => [...s, entry]);
    setFood(''); setGrams('');
  }

  const total = items.reduce((acc, it) => acc + it.grams, 0);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Nutrition</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card"><div className="card-body space-y-2">
          <h2 className="font-semibold">Current Targets</h2>
          {targets ? (
            <ul className="text-sm text-gray-700">
              <li>Kcal: {targets.kcal}</li>
              <li>Protein: {targets.protein_g} g</li>
              <li>Fat: {targets.fat_g} g</li>
              <li>Carbs: {targets.carbs_g} g</li>
            </ul>
          ) : <div className="text-sm text-gray-500">Loading…</div>}
        </div></div>
        <div className="card"><div className="card-body space-y-3">
          <h2 className="font-semibold">Daily Log</h2>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="block text-sm font-medium">Food</label>
              <input value={food} onChange={(e)=>setFood(e.target.value)} className="w-full rounded-lg border p-2 text-sm" />
            </div>
            <div className="w-32">
              <label className="block text-sm font-medium">Grams</label>
              <input value={grams} onChange={(e)=>setGrams(e.target.value)} className="w-full rounded-lg border p-2 text-sm" />
            </div>
            <button className="btn-primary px-3 py-2" onClick={addItem}>Add</button>
          </div>
          <ul className="text-sm">
            {items.map((it, i) => <li key={i} className="flex justify-between border-t py-2"><span>{it.food}</span><span>{it.grams} g</span></li>)}
          </ul>
          <div className="text-sm text-gray-600">Total grams: {total}</div>
        </div></div>
      </div>
    </div>
  );
}
