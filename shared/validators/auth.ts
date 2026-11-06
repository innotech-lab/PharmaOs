import { z } from 'zod';
export const roleSchema = z.enum(['OWNER', 'MANAGER', 'CASHIER']);
export const registerSchema = z.object({ firstName: z.string().min(1), lastName: z.string().min(1), pharmacy: z.string().min(1), country: z.string().min(1), city: z.string().min(1), email: z.string().email(), password: z.string().min(8) });
export const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });
