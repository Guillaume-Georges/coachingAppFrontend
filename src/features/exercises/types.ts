import { z } from 'zod';

const BodyPartFocusEnum = z.enum(['Core','Upper','Lower','Full Body']);
// Accept common backend variants and normalize to our UI values
const BodyPartFocus = z.preprocess((v) => {
  if (typeof v === 'string') {
    const s = v.replace(/\s|_/g, '').toLowerCase();
    if (s === 'fullbody') return 'Full Body';
    if (s === 'upper') return 'Upper';
    if (s === 'lower') return 'Lower';
    if (s === 'core') return 'Core';
  }
  return v;
}, BodyPartFocusEnum);

export const Exercise = z.object({
  id: z.string(),
  name: z.string(),
  modality: z.enum(['Gymnastics','Weightlifting','Monostructural']),
  category: z.string(),
  equipment: z.array(z.string()),
  bodyPartFocus: BodyPartFocus,
  musclesPrimary: z.array(z.string()).optional().default([]),
  musclesSecondary: z.array(z.string()).optional().default([]),
  musclesPrimaryCodes: z.array(z.string()).optional().default([]),
  musclesSecondaryCodes: z.array(z.string()).optional().default([]),
  difficulty: z.enum(['Beginner','Intermediate','Advanced']),
  instructions: z.array(z.string()),
  videoUrl: z.string().url().optional(),
  videoUrlHls: z.string().url().optional(),
  thumbnailUrl: z.string().url().optional(),
  poster: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
  aliases: z.array(z.string()).optional(),
  coachingCues: z.array(z.string()).optional(),
  commonFaults: z.array(z.string()).optional(),
  demoStartSec: z.number().optional(),
  durationSec: z.number().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type TExercise = z.infer<typeof Exercise>;

export const ExerciseListResponse = z.object({
  items: z.array(Exercise),
  page: z.number(),
  limit: z.number(),
  total: z.number(),
});

// Lean list item used when backend returns only requested fields
export const LeanExercise = z.object({
  id: z.string(),
  name: z.string().optional(),
  thumbnailUrl: z.string().url().optional(),
  modality: z.string().optional(),
  bodyPartFocus: z.string().optional(),
  tags: z.array(z.string()).optional(),
});
export type TLeanExercise = z.infer<typeof LeanExercise>;
export const LeanExerciseListResponse = z.object({
  items: z.array(LeanExercise),
  page: z.number().optional().default(1),
  limit: z.number().optional().default(24),
  total: z.number().optional().default(0),
});

export const FiltersResponse = z.object({
  modalities: z.array(z.string()),
  categories: z.array(z.string()),
  equipment: z.array(z.string()),
  bodyPartFocus: z.array(z.string()),
  muscles: z.array(z.string()),
});

export type TFilters = z.infer<typeof FiltersResponse>;

// Muscle map metadata
export const MuscleRegion = z.object({
  code: z.string(),
  name: z.string(),
  svgIdFront: z.string().nullable().optional(),
  svgIdBack: z.string().nullable().optional(),
});

export const MuscleMapMeta = z.object({
  regions: z.array(MuscleRegion),
  svgAssets: z.object({ front: z.string(), back: z.string() }).partial().optional(),
});
export type TMuscleMapMeta = z.infer<typeof MuscleMapMeta>;

