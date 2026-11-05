"use client";

import { Input, type InputProps } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** 6-digit one-time code field (numeric keyboard, autofill from SMS/email). */
export function CodeInput({ className, onChange, ...props }: Omit<InputProps, "type">) {
  return (
    <Input
      inputMode="numeric"
      autoComplete="one-time-code"
      pattern="\d{6}"
      maxLength={6}
      className={cn("h-11 text-center font-mono text-lg tracking-[0.5em]", className)}
      onChange={(e) => {
        e.target.value = e.target.value.replace(/\D/g, "").slice(0, 6);
        onChange?.(e);
      }}
      {...props}
    />
  );
}
