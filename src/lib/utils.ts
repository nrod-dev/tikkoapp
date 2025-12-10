import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getMerchantStyle = (name: string) => {
  if (name.includes('YPF')) return 'bg-blue-600';
  if (name.includes('DiDi')) return 'bg-orange-500';
  return 'bg-slate-400';
};
