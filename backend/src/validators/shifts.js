import { z } from 'zod';

const timeFormat = z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format');

export const createShiftSchema = z.object({
    name: z.string({ required_error: 'Shift name is required' }).min(1),
    startTime: timeFormat,
    endTime: timeFormat,
    toleranceMinutes: z.number().int().min(0).default(0),
}).refine(
    data => data.endTime > data.startTime,
    { message: 'endTime must be after startTime', path: ['endTime'] }
);

export const assignShiftSchema = z.object({
    userId: z.string({ required_error: 'userId is required' }).min(1),
    shiftId: z.string({ required_error: 'shiftId is required' }).min(1),
    startDate: z.string({ required_error: 'Start date is required' }).regex(/^\d{4}-\d{2}-\d{2}$/, 'startDate must be YYYY-MM-DD format'),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'endDate must be YYYY-MM-DD format').optional(),
}).refine(
    data => !data.endDate || data.endDate >= data.startDate,
    { message: 'endDate must be after or equal to startDate', path: ['endDate'] }
);
