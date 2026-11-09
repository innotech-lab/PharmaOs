export type Role = 'OWNER' | 'MANAGER' | 'CASHIER';
export interface AuthUser { id: string; tenantId: string; pharmacyId: string | null; firstName: string; lastName: string; email: string; role: Role; }
export interface RegisterInput { firstName: string; lastName: string; pharmacy: string; country: string; city: string; email: string; password: string; }
export interface LoginInput { email: string; password: string; }
export interface UserSummary extends AuthUser { active: boolean; createdAt: string; }
export interface CreateUserInput { firstName: string; lastName: string; email: string; password: string; role: Exclude<Role, 'OWNER'>; }
export interface UpdateUserInput { firstName?: string; lastName?: string; email?: string; role?: Exclude<Role, 'OWNER'>; active?: boolean; }
