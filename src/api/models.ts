import { z } from 'zod';

export const CoachLite = z.object({
  id: z.number(),
  name: z.string(),
  avatarUrl: z.string().url().optional(),
  league: z.object({ name: z.string(), color: z.string() }).optional(),
});

export const ProgramCard = z.object({
  id: z.number(),
  title: z.string(),
  coach: CoachLite,
  level: z.enum(['beginner','intermediate','advanced']),
  goal: z.enum(['muscle','fat_loss','performance']),
  durationWeeks: z.number(),
  equipment: z.array(z.string()),
  metrics: z.object({
    avgAdherence: z.number().nullable(),
    avgProgressDelta: z.number().nullable(),
  }),
});

export const CurriculumDay = z.object({
  dow: z.number().int().min(1).max(7),
  title: z.string(),
  objective: z.string(),
});

export const ProgramDetail = ProgramCard.extend({
  description: z.string(),
  curriculum: z.array(z.object({ week: z.number(), days: z.array(CurriculumDay) })),
  nutrition: z.array(z.object({
    phase: z.number(),
    weeks: z.number(),
    kcalDeltaPct: z.number(),
    protein_g_per_kg: z.number(),
    fat_g_per_kg: z.number(),
  })),
});

export const BlockItem = z.object({
  exerciseId: z.number().optional(),
  name: z.string().optional(),
  reps: z.number().optional(),
  sets: z.number().optional(),
  weightPct1RM: z.number().optional(),
  timeSec: z.number().optional(),
  restSec: z.number().optional(),
  notes: z.string().optional(),
});

export const Block = z.object({
  type: z.enum(['warmup','straight','superset','emom','amrap']),
  durationMin: z.number().optional(),
  items: z.array(BlockItem),
});

export const VideoAsset = z.object({
  publicId: z.string(),
  poster: z.string().url().optional(),
  captionsVtt: z.string().url().optional(),
  cuepoints: z.array(z.object({ label: z.string(), t: z.number() })).optional(),
});

export const ExerciseVideoPack = z.object({
  how_to: VideoAsset.optional(),
  cues: VideoAsset.optional(),
  faults: VideoAsset.optional(),
  scaling: VideoAsset.optional(),
});

export const SessionPayload = z.object({
  workoutId: z.number(),
  title: z.string(),
  objective: z.string(),
  plannedFor: z.string(),
  blocks: z.array(Block),
  videos: z.record(z.string(), ExerciseVideoPack),
});
export type TSessionPayload = z.infer<typeof SessionPayload>;

