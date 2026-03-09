import { z } from 'zod';

export const punchSchema = z.object({
    type: z.enum(['IN', 'OUT'], { required_error: 'Type must be IN or OUT' }),
    lat: z.number().min(-90).max(90).optional(),
    lng: z.number().min(-180).max(180).optional(),
    accuracy: z.number().min(0).max(5000).optional(),
});

export const manualAttendanceSchema = z.object({
    userId: z.string({ required_error: 'userId is required' }).min(1),
    date: z.string({ required_error: 'date is required' }).regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD format'),
    entry_time: z.string().optional(),
    exit_time: z.string().optional(),
});

export const updateAttendanceSchema = z.object({
    type: z.enum(['IN', 'OUT'], { required_error: 'Type must be IN or OUT' }),
    timestamp: z.string({ required_error: 'Timestamp is required' }),
});
