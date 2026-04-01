import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function generateEmployeeId(): string {
  const num = Math.floor(Math.random() * 9000) + 1000;
  return `EMP${num}`;
}

export function getTodayDate(): string {
  const d = new Date();
  return d.toISOString().split("T")[0];
}

export function formatTime(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
}

export function formatDate(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

export function formatDateTime(isoString: string): string {
  return `${formatDate(isoString)} ${formatTime(isoString)}`;
}

export function formatHours(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export function minutesToHoursDecimal(minutes: number): number {
  return Math.round((minutes / 60) * 100) / 100;
}
