import { Role } from '@prisma/client';
export type AuthUser = { sub: string; tenantId: string; pharmacyId?: string | null; role: Role; email: string };
