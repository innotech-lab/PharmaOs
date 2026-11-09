import { z } from 'zod';
export const roleSchema = z.enum(['OWNER', 'MANAGER', 'CASHIER']);
export const registerSchema = z.object({ firstName: z.string().min(1), lastName: z.string().min(1), pharmacy: z.string().min(1), country: z.string().min(1), city: z.string().min(1), email: z.string().email(), password: z.string().min(8) });
export const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });
export const createUserSchema = z.object({ firstName: z.string().trim().min(1), lastName: z.string().trim().min(1), email: z.string().email(), password: z.string().min(8), role: z.enum(['MANAGER', 'CASHIER']) });
export const updateUserSchema = z.object({ firstName: z.string().trim().min(1).optional(), lastName: z.string().trim().min(1).optional(), email: z.string().email().optional(), role: z.enum(['MANAGER', 'CASHIER']).optional(), active: z.boolean().optional() }).refine(value => Object.keys(value).length > 0, 'Au moins un champ est requis');
