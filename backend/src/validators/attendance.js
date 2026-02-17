import { z } from 'zod';

export const punchSchema = z.object({
    type: z.enum(['IN', 'OUT'], { required_error: 'Type must be IN or OUT' }),
    lat: z.number().optional(),
    lng: z.number().optional(),
    accuracy: z.number().optional(),
});

export const manualAttendanceSchema = z.object({
    userId: z.number({ required_error: 'userId is required' }).int().positive(),
    type: z.enum(['IN', 'OUT'], { required_error: 'Type must be IN or OUT' }),
    timestamp: z.string({ required_error: 'Timestamp is required' }),
});

export const updateAttendanceSchema = z.object({
    type: z.enum(['IN', 'OUT'], { required_error: 'Type must be IN or OUT' }),
    timestamp: z.string({ required_error: 'Timestamp is required' }),
});
