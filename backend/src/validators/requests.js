import { z } from 'zod';

const firestoreTimestamp = z.object({
    seconds: z.number(),
    nanoseconds: z.number()
});

export const createRequestSchema = z.object({
    type: z.enum(['PERMISO_ADMINISTRATIVO', 'FERIADO_LEGAL', 'COMPENSATORIO', 'LICENCIA_MEDICA'], { required_error: 'Request type is required' }),
    startDate: firestoreTimestamp,
    endDate: firestoreTimestamp,
    returnDate: firestoreTimestamp,
    timeFormat: z.enum(['DIA_COMPLETO', 'MEDIO_DIA_AM', 'MEDIO_DIA_PM'], { required_error: 'Time format is required' }),
    reason: z.string().optional()
}).refine(
    data => data.endDate.seconds >= data.startDate.seconds,
    { message: 'endDate must be after or equal to startDate', path: ['endDate'] }
);

export const updateRequestStatusSchema = z.object({
    status: z.enum(['APPROVED', 'REJECTED', 'PENDING', 'VISADO'], {
        required_error: 'Status is required',
    }),
    response: z.string().optional(),
});
