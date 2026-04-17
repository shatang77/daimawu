import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { differenceInDays, parseISO } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getFuzzyDate(dateStr: string) {
  try {
    // 处理可能的多种日期格式，尝试直接 new Date
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "售出很久";
    
    const now = new Date();
    const diff = differenceInDays(now, date);
    
    if (diff < 182) return "半年内购买";
    if (diff < 365) return "半年前购买";
    if (diff < 730) return "一年前购买";
    return "两年前购买";
  } catch (e) {
    return "已售出";
  }
}
