import { z } from 'zod';

export const createShiftSchema = z.object({
    name: z.string({ required_error: 'Shift name is required' }).min(1),
    startTime: z.string({ required_error: 'Start time is required' }),
    endTime: z.string({ required_error: 'End time is required' }),
    toleranceMinutes: z.number().int().min(0).default(0),
});

export const assignShiftSchema = z.object({
    userId: z.string({ required_error: 'userId is required' }).min(1),
    shiftId: z.string({ required_error: 'shiftId is required' }).min(1),
    startDate: z.string({ required_error: 'Start date is required' }),
    endDate: z.string().optional(),
});
