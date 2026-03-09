import { z } from 'zod';

export const createUserSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one digit')
        .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    role: z.enum(['user', 'admin', 'hr', 'jefatura']).default('user'),
    fullName: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    department: z.string().optional(),
    position: z.string().optional(),
    startDate: z.string().optional(),
});

export const updateUserSchema = z.object({
    email: z.string().email('Invalid email format'),
    role: z.enum(['user', 'admin', 'hr', 'jefatura']),
    fullName: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    department: z.string().optional(),
    position: z.string().optional(),
    startDate: z.string().optional(),
});
