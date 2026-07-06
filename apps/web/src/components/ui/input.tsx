import { forwardRef, type InputHTMLAttributes } from "react";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className = "", ...props }, ref) => (
  <input
    ref={ref}
    className={`h-9 w-full rounded-md border border-zinc-300 bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 ${className}`}
    {...props}
  />
));
Input.displayName = "Input";
