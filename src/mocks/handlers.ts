import { http, HttpResponse } from 'msw';

const coach = { id: 1, name: 'Alex Strong', avatarUrl: undefined, league: { name: 'Diamond', color: '#4f46e5' } };

export const handlers = [
  

  // Home slides (editable)
  http.get('/api/home/slides', () => {
    // Keep a module-level mutable list in dev
    // @ts-ignore
    if (!(globalThis as any).__homeSlides) {
      (globalThis as any).__homeSlides = [
        { title: 'Exercise Library', copy: 'Want to understand exercises better or discover new ones? Browse through our library including videos.', cta: 'Discover', to: '/exercises', image: 'https://images.unsplash.com/photo-1517963628607-235ccdd5476b?q=80&w=1974&auto=format&fit=crop' },
      ];
    }
    return HttpResponse.json({ data: { slides: (globalThis as any).__homeSlides } });
  }),
  http.put('/api/home/slides', async ({ request }) => {
    try {
      const body = await request.json();
      const slides = (body as any)?.slides ?? [];
      (globalThis as any).__homeSlides = slides;
      return HttpResponse.json({ data: { ok: true } });
    } catch {
      return HttpResponse.json({ error: { message: 'Bad request' } }, { status: 400 });
    }
  }),

  http.get('/programs/:id', ({ params }) => {
    const id = Number(params.id);
    const base = { id, title: 'Hypertrophy Foundations', coach, level: 'beginner', goal: 'muscle', durationWeeks: 8, equipment: ['dumbbells','bench'], metrics: { avgAdherence: 0.82, avgProgressDelta: 12 } };
    const detail = {
      ...base,
      description: 'Build solid muscle with progressive overload and intelligent accessories.',
      curriculum: [
        { week: 1, days: [{ dow: 1, title: 'Upper A', objective: 'Pressing focus' }, { dow: 3, title: 'Lower A', objective: 'Squat focus' }]},
        { week: 2, days: [{ dow: 1, title: 'Upper B', objective: 'Pull focus' }, { dow: 3, title: 'Lower B', objective: 'Hinge focus' }]}],
      nutrition: [
        { phase: 1, weeks: 4, kcalDeltaPct: 10, protein_g_per_kg: 2.2, fat_g_per_kg: 0.8 },
        { phase: 2, weeks: 4, kcalDeltaPct: 15, protein_g_per_kg: 2.2, fat_g_per_kg: 0.9 },
      ],
    };
    return HttpResponse.json({ data: detail });
  }),

  http.post('/enrollments', async () => {
    return HttpResponse.json({ data: { ok: true } });
  }),

  http.get('/workouts', ({ request }) => {
    const url = new URL(request.url);
    const from = url.searchParams.get('from')!;
    // Return 6 fake workouts
    const list = Array.from({ length: 6 }).map((_, i) => ({
      id: i + 101,
      plannedFor: new Date(Date.parse(from) + i * 86400000).toISOString(),
      title: i % 2 === 0 ? 'Upper Body' : 'Lower Body',
      objective: i % 2 === 0 ? 'Press / Pull' : 'Squat / Hinge',
      status: i % 3 === 0 ? 'done' : (i % 5 === 0 ? 'skipped' : 'planned'),
    }));
    return HttpResponse.json({ data: list });
  }),

  http.get('/sessions/:id', ({ params }) => {
    const workoutId = Number(params.id);
    const payload = {
      workoutId,
      title: 'Upper Body Strength',
      objective: 'Pressing focus and pulling accessories',
      plannedFor: new Date().toISOString(),
      blocks: [
        { type: 'warmup', items: [{ name: 'Band Pull-Aparts', reps: 15 }, { name: 'Push-ups', reps: 10 }] },
        { type: 'straight', items: [{ exerciseId: 201, sets: 5, reps: 5, weightPct1RM: 75, restSec: 150 }] },
        { type: 'superset', items: [{ exerciseId: 202, sets: 3, reps: 10, restSec: 60 }, { exerciseId: 203, sets: 3, reps: 12, restSec: 60 }] },
      ],
      videos: {
        '201': { how_to: { publicId: 'docs/demo', poster: undefined } },
      },
    } as any;
    return HttpResponse.json({ data: payload });
  }),

  http.post('/sessions/:id/log', async () => {
    return HttpResponse.json({ data: { ok: true } });
  }),

  // User profile (requires Authorization)
  http.get('/api/me', ({ request }) => {
    const auth = request.headers.get('authorization');
    if (!auth) return HttpResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
    // decode mock token to role hint
    const role = auth.includes('admin') ? 'admin' : 'member';
    return HttpResponse.json({ data: { id: 'user_1', role } });
  }),

  // Video events collector
  http.post('/video-events', async () => HttpResponse.json({ data: { ok: true } })),

  // --- Local Auth ---
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json() as any;
    const email: string = body?.email || '';
    const role = email.startsWith('admin') ? 'admin' : 'member';
    const accessToken = `mock-${role}-token`;
    const user = { id: 'user_1', email, role } as any;
    return HttpResponse.json({ accessToken, user, expiresIn: 3600 } as any);
  }),
  http.post('/api/auth/refresh', async () => {
    // Generate a new access token (mock)
    return HttpResponse.json({ accessToken: 'mock-member-token', user: { id: 'user_1', email: 'member@example.com', role: 'member' }, expiresIn: 3600 } as any);
  }),
  http.post('/api/auth/logout', async () => HttpResponse.json({ ok: true } as any)),
  http.post('/api/auth/register', async ({ request }) => {
    const body = await request.json();
    const id = String(Math.floor(Math.random()*100000));
    return HttpResponse.json({ id } as any, { status: 201 });
  }),

  // Programs pagination
  http.get('/programs', ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || '1');
    const limit = Number(url.searchParams.get('limit') || '9');
    const total = 12;
    const items = Array.from({ length: Math.min(limit, total - (page - 1) * limit) }).map((_, i) => ({
      id: (page - 1) * limit + i + 1,
      title: 'Program #' + ((page - 1) * limit + i + 1),
      coach,
      level: ['beginner','intermediate','advanced'][((page - 1) * limit + i) % 3],
      goal: ['muscle','fat_loss','performance'][((page - 1) * limit + i) % 3],
      durationWeeks: 8,
      equipment: ['dumbbells','bench'],
      metrics: { avgAdherence: 0.8, avgProgressDelta: 12 },
    }));
    return HttpResponse.json({ data: { items, meta: { page, limit, total } } });
  }),

  // Leaderboards
  http.get('/leaderboard/members', ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || '1');
    const limit = Number(url.searchParams.get('limit') || '10');
    const leagueId = url.searchParams.get('leagueId') || 'all';
    const total = 42;
    const items = Array.from({ length: limit }).map((_, i) => ({
      id: (page - 1) * limit + i + 1,
      name: `Member ${(page - 1) * limit + i + 1}`,
      weeklyPoints: Math.floor(Math.random() * 500),
      streak: Math.floor(Math.random() * 15),
      rank: ['Bronze','Silver','Gold','Platinum','Diamond'][i % 5],
      leagueId,
    }));
    return HttpResponse.json({ data: { items, meta: { page, limit, total } } });
  }),
  http.get('/leaderboard/coaches', ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || '1');
    const limit = Number(url.searchParams.get('limit') || '10');
    const total = 30;
    const items = Array.from({ length: limit }).map((_, i) => ({
      id: (page - 1) * limit + i + 1,
      name: `Coach ${(page - 1) * limit + i + 1}`,
      weeklyScore: Math.floor(Math.random() * 1000),
      activeMembers: Math.floor(Math.random() * 200),
      trend: ['up','down','flat'][i % 3],
    }));
    return HttpResponse.json({ data: { items, meta: { page, limit, total } } });
  }),

  // Progress
  http.get('/progress', ({ request }) => {
    const url = new URL(request.url);
    const metric = url.searchParams.get('metric') || 'weight';
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');
    const days = 7;
    const data = Array.from({ length: days }).map((_, i) => ({ date: new Date(Date.now() - (days - i) * 86400000).toISOString(), value: 70 + i * 0.2 }));
    return HttpResponse.json({ data: { metric, series: data } });
  }),
  http.post('/progress', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ data: { ok: true, entry: body } });
  }),

  // Nutrition
  http.get('/nutrition/targets', () => HttpResponse.json({ data: { kcal: 2500, protein_g: 160, fat_g: 70, carbs_g: 300 } })),
  http.get('/nutrition/log', ({ request }) => {
    const url = new URL(request.url);
    const date = url.searchParams.get('date') || new Date().toISOString().slice(0,10);
    const items = [ { food: 'Chicken', grams: 200 }, { food: 'Rice', grams: 180 } ];
    return HttpResponse.json({ data: { date, items } });
  }),
  http.post('/nutrition/log', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ data: body });
  }),

  // Coach
  http.get('/coach/me/programs', () => HttpResponse.json({ data: [ { id: 1, title: 'Hypertrophy Foundations' }, { id: 2, title: 'Shred Phase' } ] })),
  http.post('/coach/programs', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ data: { id: Math.floor(Math.random()*1000), ...(body as any) } });
  }),
  http.post('/coach/programs/:id/sessions', async ({ params, request }) => {
    const body = await request.json();
    return HttpResponse.json({ data: { ok: true, id: params.id, session: body } });
  }),
  http.post('/coach/exercises/:id/videos', async ({ params, request }) => {
    const body = await request.json();
    return HttpResponse.json({ data: { ok: true, exerciseId: params.id, ...(body as any) } });
  }),

  // Admin
  http.get('/admin/leagues/members', () => HttpResponse.json({ data: [ { id: 1, name: 'Bronze', min_points: 0, max_points: 1000 }, { id: 2, name: 'Silver', min_points: 1000, max_points: 3000 } ] })),
  http.get('/admin/leagues/coaches', () => HttpResponse.json({ data: [ { id: 1, name: 'Challenger', min_points: 0, max_points: 5000 } ] })),
  http.get('/admin/users', ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('query') || '';
    const items = Array.from({ length: 10 }).map((_, i) => ({ id: i+1, email: `user${i+1}@example.com`, role: ['member','coach','superadmin'][i%3] }));
    return HttpResponse.json({ data: { items, meta: { page: 1, limit: 10, total: 10 } } });
  }),

  // --- Exercises Library ---
  http.get('/api/meta/filters', () => HttpResponse.json({ data: {
    modalities: ['Gymnastics','Weightlifting','Monostructural'],
    categories: ['Jump','Squat','Press','Clean','Overhead'],
    equipment: ['No Equipment','Kettlebell','Dumbbells','Jump Rope','Barbell','Rower','Abmat'],
    bodyPartFocus: ['Core','Full Body','Lower','Upper'],
    muscles: ['Rectus Abdominis','Hip Flexors','Quadriceps','Hamstrings','Pectorals','Deltoids','Latissimus Dorsi','Glutes'],
  } })),

  http.get('/api/meta/muscle-map', () => HttpResponse.json({
    regions: [
      { code: 'rectus_abdominis', name: 'Rectus Abdominis', svgIdFront: 'abs', svgIdBack: null },
      { code: 'external_obliques', name: 'External Obliques', svgIdFront: 'obliques', svgIdBack: null },
      { code: 'latissimus_dorsi', name: 'Latissimus Dorsi', svgIdFront: null, svgIdBack: 'lats' },
      { code: 'gluteus_maximus', name: 'Glutes', svgIdFront: null, svgIdBack: 'glutes' },
      { code: 'quadriceps', name: 'Quadriceps', svgIdFront: 'quads', svgIdBack: null },
      { code: 'hamstrings', name: 'Hamstrings', svgIdFront: null, svgIdBack: 'hams' },
      { code: 'deltoids', name: 'Deltoids', svgIdFront: 'delts', svgIdBack: 'delts' },
      { code: 'pectoralis_major', name: 'Pectorals', svgIdFront: 'pecs', svgIdBack: null },
      { code: 'hip_flexors', name: 'Hip Flexors', svgIdFront: 'hipflex', svgIdBack: null },
    ],
    svgAssets: { front: '/static/muscles/front.svg', back: '/static/muscles/back.svg' },
  } as any)),

  http.get('/api/exercises', ({ request }) => {
    const url = new URL(request.url);
    const search = (url.searchParams.get('search') || '').toLowerCase();
    const page = Number(url.searchParams.get('page') || '1');
    const limit = Number(url.searchParams.get('limit') || '24');
    const total = 50;
    const all = Array.from({ length: total }).map((_, i) => ({
      id: String(i+1),
      name: ['AbMat Sit-up','Air Bike','Air Squat','Alternating V-Up','Run','Row'][i % 6] + ' ' + (i+1),
      modality: ['Gymnastics','Weightlifting','Monostructural'][i % 3],
      category: ['Jump','Squat','Press','Clean','Overhead'][i % 5],
      equipment: [['No Equipment'],['Dumbbells'],['Barbell']][i % 3],
      bodyPartFocus: ['Core','Upper','Lower','Full Body'][i % 4],
      musclesPrimary: [['Rectus Abdominis'],['Quadriceps'],['Pectorals']][i % 3],
      musclesSecondary: [['Hip Flexors'],['Hamstrings'],['Deltoids']][i % 3],
      difficulty: ['Beginner','Intermediate','Advanced'][i % 3],
      instructions: [
        'Start in position.', 'Perform controlled movement.', 'Return to start.', 'Repeat as prescribed.'
      ],
      videoUrl: 'https://res.cloudinary.com/demo/video/upload/sea_turtle.mp4',
      thumbnailUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      tags: ['Core','Gymnastics'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    const filtered = all.filter(x => x.name.toLowerCase().includes(search));
    const items = filtered.slice((page-1)*limit, (page-1)*limit + limit);
    return HttpResponse.json({ data: { items, page, limit, total: filtered.length } });
  }),

  http.get('/api/exercises/:id', ({ params }) => {
    const id = String(params.id);
    const item = {
      id, name: 'AbMat Sit-up', modality: 'Gymnastics', category: 'Squat', equipment: ['Abmat'], bodyPartFocus: 'Core', musclesPrimary: ['Rectus Abdominis'], musclesSecondary: ['Hip Flexors'], difficulty: 'Beginner',
      instructions: [
        'Lay back so lower back is on the AbMat.',
        'Reach back with your arms, extend overhead then swing forward.',
        'Bring chest toward legs or hands to feet.',
        'Return in a controlled manner.',
      ],
      videoUrl: 'https://res.cloudinary.com/demo/video/upload/sea_turtle.mp4',
      thumbnailUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      tags: ['Core','Gymnastics'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any;
    return HttpResponse.json({ data: item });
  }),

  http.post('/api/exercises', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ data: { id: String(Math.floor(Math.random()*10000)), ...(body as any) } }, { status: 201 });
  }),
  http.put('/api/exercises/:id', async () => HttpResponse.json({ data: { updated: true } })),
  http.delete('/api/exercises/:id', async () => HttpResponse.json({ data: { deleted: true } })),
];
