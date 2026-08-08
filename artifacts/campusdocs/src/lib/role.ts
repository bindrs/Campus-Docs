import type { UserRole } from '@/lib/insforge';

const PENDING_ROLE_KEY = 'campusdocs_pending_role';

export function setPendingRole(role: 'student' | 'professor') {
  localStorage.setItem(PENDING_ROLE_KEY, role);
}

export function getPendingRole(): 'student' | 'professor' | null {
  const value = localStorage.getItem(PENDING_ROLE_KEY);
  if (value === 'student' || value === 'professor') return value;
  return null;
}

export function clearPendingRole() {
  localStorage.removeItem(PENDING_ROLE_KEY);
}

export function isProfessor(role?: UserRole | null) {
  return role === 'professor' || role === 'admin';
}

export function isStudent(role?: UserRole | null) {
  return role === 'student';
}
