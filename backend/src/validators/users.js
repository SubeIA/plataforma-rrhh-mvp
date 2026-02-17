import { z } from 'zod';

export const createUserSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['user', 'admin', 'hr']).default('user'),
    fullName: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    department: z.string().optional(),
    position: z.string().optional(),
    startDate: z.string().optional(),
});

export const updateUserSchema = z.object({
    email: z.string().email('Invalid email format'),
    role: z.enum(['user', 'admin', 'hr']),
    fullName: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    department: z.string().optional(),
    position: z.string().optional(),
    startDate: z.string().optional(),
});
