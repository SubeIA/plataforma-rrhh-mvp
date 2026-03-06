import { z } from 'zod';

// Simulating Firebase Timestamp type structure for validation purposes
const TimestampSchema = z.object({
    _seconds: z.number(),
    _nanoseconds: z.number()
}).or(z.object({
    seconds: z.number(),
    nanoseconds: z.number()
}));

const StatusEnum = z.enum(["RECEPCIONADA", "TRAMITADA"]);

const createMedicalLicenseSchema = z.object({
    folio: z.string().min(1, "Folio es requerido"),
    userId: z.string().min(1, "User ID es requerido"),
    startDate: z.string().or(TimestampSchema), // ISO string from frontend, or Timestamp from db
    durationDays: z.number().int().positive("La duración debe ser positiva")
});

const updateMedicalLicenseStatusSchema = z.object({
    status: StatusEnum
});

export {
    createMedicalLicenseSchema,
    updateMedicalLicenseStatusSchema
};
