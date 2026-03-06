import { z } from 'zod';

export const createRequestSchema = z.object({
    type: z.enum(['PERMISO_ADMINISTRATIVO', 'FERIADO_LEGAL', 'COMPENSATORIO', 'LICENCIA_MEDICA'], { required_error: 'Request type is required' }),
    startDate: z.object({
        seconds: z.number(),
        nanoseconds: z.number()
    }, { required_error: 'Start date is required' }),
    endDate: z.object({
        seconds: z.number(),
        nanoseconds: z.number()
    }, { required_error: 'End date is required' }),
    returnDate: z.object({
        seconds: z.number(),
        nanoseconds: z.number()
    }, { required_error: 'Return date is required' }),
    timeFormat: z.enum(['DIA_COMPLETO', 'MEDIO_DIA_AM', 'MEDIO_DIA_PM'], { required_error: 'Time format is required' }),
    reason: z.string().optional()
});

export const updateRequestStatusSchema = z.object({
    status: z.enum(['APPROVED', 'REJECTED', 'PENDING', 'VISADO'], {
        required_error: 'Status is required',
    }),
    response: z.string().optional(),
});
