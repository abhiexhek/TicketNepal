import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function toSafeDate(str?: string | null): Date | null {
  if (!str) return null;
  // If already has seconds, return as is
  if (str.length === 19) {
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  }
  // If missing seconds, add ':00'
  if (str.length === 16) {
    const d = new Date(str + ':00');
    return isNaN(d.getTime()) ? null : d;
  }
  // If missing 'T', try to fix
  if (str.length === 10) {
    const d = new Date(str + 'T00:00:00');
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}
