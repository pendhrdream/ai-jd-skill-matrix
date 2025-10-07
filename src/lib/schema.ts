import { z } from 'zod';

export const SkillMatrixSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  seniority: z.enum(['junior', 'mid', 'senior', 'lead', 'unknown']),
  skills: z.object({
    frontend: z.array(z.string()),
    backend: z.array(z.string()),
    devops: z.array(z.string()),
    web3: z.array(z.string()),
    other: z.array(z.string()),
  }),
  mustHave: z.array(z.string()),
  niceToHave: z.array(z.string()),
  salary: z.object({
    currency: z.enum(['USD', 'EUR', 'PLN', 'GBP']),
    min: z.number().optional(),
    max: z.number().optional(),
  }).optional(),
  summary: z.string().max(60, 'Summary must be 60 words or less'),
});

export type SkillMatrix = z.infer<typeof SkillMatrixSchema>;

export const validateSkillMatrix = (data: unknown): SkillMatrix => {
  try {
    return SkillMatrixSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map(err => 
        `${err.path.join('.')}: ${err.message}`
      ).join(', ');
      throw new Error(`Validation failed: ${errorMessages}`);
    }
    throw error;
  }
};
