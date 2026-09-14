import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { UserRole } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Roles that bypass per-rep client isolation — mirrors the backend's set. */
export const MANAGER_ROLES: UserRole[] = ['SALES_MANAGER', 'ADMIN', 'SUPER_ADMIN'];

export function isManagerRole(role: UserRole) {
  return MANAGER_ROLES.includes(role);
}
