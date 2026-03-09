import { z } from 'zod';
import { ALL_ROLES } from '../constants/roles.js';

// Roles que un admin puede asignar (no puede crear super_admin)
const assignableRoles = ALL_ROLES.filter(r => r !== 'super_admin');

export const createUserSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one digit')
        .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    role: z.enum(assignableRoles).default('user'),
    fullName: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    department: z.string().optional(),
    position: z.string().optional(),
    startDate: z.string().optional(),
});

export const updateUserSchema = z.object({
    email: z.string().email('Invalid email format'),
    role: z.enum(assignableRoles),
    fullName: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    department: z.string().optional(),
    position: z.string().optional(),
    startDate: z.string().optional(),
});
