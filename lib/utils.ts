import { type ClassValue, clsx } from "clsx";
import React from "react";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function delayImport<P>(importFunction: () => React.ComponentType<P>, delay: number): Promise<React.ComponentType<P>> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(importFunction()), delay);
  });
};
