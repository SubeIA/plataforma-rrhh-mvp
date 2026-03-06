const { z } = require('zod');

const itamAssetSchema = z.object({
    user_id: z.string().min(1, 'Se requiere el ID del colaborador'),
    asset_type: z.enum(['Laptop', 'Phone', 'Monitor', 'Software License', 'Other'], {
        errorMap: () => ({ message: 'Tipo de activo no válido' })
    }),
    serial_id: z.string().min(1, 'El número de serie / identificador es obligatorio'),
    model: z.string().min(1, 'El modelo / descripción es obligatorio'),
    status: z.enum(['Asignado', 'Devuelto']).default('Asignado')
});

module.exports = {
    itamAssetSchema
};
