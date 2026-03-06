import { z } from 'zod';

const createKarinReportSchema = z.object({
    isAnonymous: z.boolean().default(false),
    accused_name: z.string().min(3, 'El nombre del denunciado debe tener al menos 3 caracteres'),
    description: z.string().min(20, 'La descripción debe tener al menos 20 caracteres para ser válida.'),
    incident_date: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: 'Fecha de incidente inválida',
    }),
});

export {
    createKarinReportSchema
};
