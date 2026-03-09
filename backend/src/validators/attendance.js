import { z } from 'zod';

export const punchSchema = z.object({
    type: z.enum(['IN', 'OUT'], { required_error: 'Type must be IN or OUT' }),
    lat: z.number().optional(),
    lng: z.number().optional(),
    accuracy: z.number().optional(),
});

export const manualAttendanceSchema = z.object({
    userId: z.string({ required_error: 'userId is required' }).min(1),
    date: z.string({ required_error: 'date is required' }),
    entry_time: z.string().optional(),
    exit_time: z.string().optional(),
});

export const updateAttendanceSchema = z.object({
    type: z.enum(['IN', 'OUT'], { required_error: 'Type must be IN or OUT' }),
    timestamp: z.string({ required_error: 'Timestamp is required' }),
});
