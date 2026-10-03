import type { Role } from '@/api';

export const homeFor = (role: Role) => (role === 'MANAGER' ? '/manager' : '/observer');
