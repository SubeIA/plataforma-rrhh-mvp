import { z } from 'zod';

export const createRequestSchema = z.object({
    type: z.string({ required_error: 'Request type is required' }).min(1),
    startDate: z.string({ required_error: 'Start date is required' }),
    endDate: z.string({ required_error: 'End date is required' }),
    reason: z.string().optional(),
});

export const updateRequestStatusSchema = z.object({
    status: z.enum(['APPROVED', 'REJECTED', 'PENDING'], {
        required_error: 'Status is required',
    }),
    response: z.string().optional(),
});
