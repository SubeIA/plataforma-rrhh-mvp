import { z } from 'zod';

const DocumentTypes = ["Contrato", "Liquidacion", "Comprobante", "Anexo"];

export const createDocumentSchema = z.object({
    user_id: z.string().min(1, 'El ID de usuario es requerido'),
    type: z.enum(DocumentTypes, {
        errorMap: () => ({ message: `El tipo de documento debe ser uno de: ${DocumentTypes.join(', ')}` })
    }),
    title: z.string().min(1, 'El título es requerido')
});
