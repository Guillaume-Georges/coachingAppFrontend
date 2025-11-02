import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useApi } from '../../api';
import { useQuery } from '@tanstack/react-query';
import { useUserProfile } from '../user/useUserProfile';
import { UploadImageButton } from '../../components/UploadImageButton';
import { useAuth } from '../../auth/AuthProvider';

type Slide = {
  title: string;
  copy: string;
  cta: string;
  to: string;
  image: string;
};

export default function HomePage() {
  const api = useApi();
  const { data: profile } = useUserProfile();
  const { isAuthenticated, ready } = useAuth();
  const isAdmin = !!ready && !!isAuthenticated && (profile?.role === 'admin' || profile?.role === 'superadmin');
  const [slides, setSlides] = useState<Slide[]>([]);
  const [index, setIndex] = useState(0);
  const [editing, setEditing] = useState<Slide | null>(null);
  const [showRoutes, setShowRoutes] = useState(false);

  // Cache home hero slides for 10 minutes. We also rely on the HTTP client
  // ETag cache so repeat navigations avoid unnecessary network if server sends ETag.
  const { data: slidesData } = useQuery<Slide[]>({
    queryKey: ['home:slides', { admin: isAdmin }],
    queryFn: async () => {
      const path = isAdmin ? '/api/home/slides' : '/api/home/slides/public';
      const res = await api.get<any>(path);
      const list: Slide[] = (res?.slides ?? res ?? []);
      return Array.isArray(list) && list.length > 0
        ? list
        : [{ title: 'Exercise Library', copy: 'Want to understand exercises better or discover new ones? Browse through our library including videos.', cta: 'Discover', to: '/exercises', image: 'https://images.unsplash.com/photo-1517963628607-235ccdd5476b?q=80&w=1974&auto=format&fit=crop' }];
    },
    staleTime: 1000 * 60 * 10,
  });

  useEffect(() => {
    if (slidesData && slidesData.length > 0) setSlides(slidesData);
  }, [slidesData]);

  async function saveSlide(next: Slide) {
    const updated = [next, ...slides.slice(1)];
    setSlides(updated);
    try { await api.put('/api/home/slides', { slides: updated }); } catch {}
  }

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="sr-only">Home</h1>
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white shadow-xl">
        {isAdmin && (
          <div className="absolute top-3 right-3 z-10">
            <button className="px-3 py-1.5 rounded-lg text-sm bg-white/90 text-gray-800 hover:bg-white" onClick={() => setEditing(slides[0])}>Edit card</button>
          </div>
        )}
        <div
          className="flex transition-transform duration-300"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {slides.map((s, i) => (
            <article key={i} className="relative shrink-0 w-full h-[440px] sm:h-[520px]">
              <img
                src={s.image}
                alt=""
                loading={i === 0 ? 'eager' : 'lazy'}
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover opacity-70"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />
              <div className="relative h-full p-6 sm:p-10 flex flex-col justify-end">
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight drop-shadow">{s.title}</h2>
                <p className="mt-3 text-sm sm:text-base text-white/90 max-w-lg drop-shadow">
                  {s.copy}
                </p>
                <div className="mt-5">
                  <Link to={s.to} className="inline-flex items-center px-5 py-2.5 rounded-xl bg-emerald-500 text-white font-semibold shadow">
                    {s.cta}
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
        {/* Dots */}
        <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              aria-label={`Go to slide ${i+1}`}
              onClick={() => setIndex(i)}
              className={`h-2.5 w-2.5 rounded-full ${i===index ? 'bg-white' : 'bg-white/50'}`}
            />
          ))}
        </div>
      </div>

      {editing && (
        <div
          className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setEditing(null)}
          aria-modal
          role="dialog"
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              aria-label="Close"
              className="absolute top-3 right-3 btn-ghost px-2 py-1 rounded-md"
              onClick={() => setEditing(null)}
            >
              ✕
            </button>
            <h2 className="text-lg font-semibold mb-4">Edit Home Card</h2>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium">Title</label>
                <input className="mt-1 w-full rounded-lg border border-gray-300 bg-white dark:bg-slate-900 px-3 py-2 text-gray-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium">Description</label>
                <textarea className="mt-1 w-full rounded-lg border border-gray-300 bg-white dark:bg-slate-900 px-3 py-2 text-gray-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400" rows={3} value={editing.copy} onChange={(e) => setEditing({ ...editing, copy: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">CTA Label</label>
                  <input className="mt-1 w-full rounded-lg border border-gray-300 bg-white dark:bg-slate-900 px-3 py-2 text-gray-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400" value={editing.cta} onChange={(e) => setEditing({ ...editing, cta: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium">CTA Link</label>
                  <div className="mt-1 relative">
                    <input className="w-full rounded-lg border border-gray-300 pr-28 bg-white dark:bg-slate-900 px-3 py-2 text-gray-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400" value={editing.to} onChange={(e) => setEditing({ ...editing, to: e.target.value })} />
                    <button type="button" className="absolute right-1 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-md bg-gray-100 dark:bg-slate-800 text-sm" onClick={() => setShowRoutes((s) => !s)}>Choose</button>
                    {showRoutes && (
                      <div className="absolute z-10 mt-2 right-0 w-56 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg overflow-hidden">
                        {[{label:'Home',to:'/home'}, {label:'Library',to:'/exercises'}, {label:'Profile',to:'/profile'}, {label:'Members (admin)',to:'/admin/members'}].map((opt) => (
                          <button key={opt.to} type="button" className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-800" onClick={() => { setEditing({ ...editing, to: opt.to }); setShowRoutes(false); }}>
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium">Background Image</label>
                <div className="mt-2 flex items-center gap-3">
                  <img src={editing.image} alt="" className="h-16 w-28 object-cover rounded" />
                  <UploadImageButton variant="button" label="Upload image" onUploaded={(url) => setEditing({ ...editing, image: url })} />
                </div>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-2">
              <button className="btn-ghost px-3 py-2" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn-primary px-4 py-2 rounded-xl" onClick={() => { if (editing) saveSlide(editing); setEditing(null); }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
