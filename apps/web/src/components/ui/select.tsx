"use client";

import { Select as BaseSelect } from "@base-ui/react/select";

export function Select({
  value,
  options,
  onValueChange,
  ariaLabel,
}: {
  value: string;
  options: { value: string; label: string }[];
  onValueChange: (value: string) => void;
  ariaLabel: string;
}) {
  return (
    <BaseSelect.Root
      value={value}
      onValueChange={(v) => v !== null && onValueChange(v)}
    >
      <BaseSelect.Trigger
        aria-label={ariaLabel}
        className="inline-flex h-8 items-center gap-1 rounded-md border border-zinc-300 px-2 text-sm dark:border-zinc-700"
      >
        <BaseSelect.Value />
        <BaseSelect.Icon className="text-zinc-500">▾</BaseSelect.Icon>
      </BaseSelect.Trigger>
      <BaseSelect.Portal>
        <BaseSelect.Positioner sideOffset={4}>
          <BaseSelect.Popup className="rounded-md border border-zinc-200 bg-white py-1 shadow-md dark:border-zinc-800 dark:bg-zinc-950">
            {options.map((o) => (
              <BaseSelect.Item
                key={o.value}
                value={o.value}
                className={(state) =>
                  `cursor-default px-3 py-1.5 text-sm ${state.highlighted ? "bg-zinc-100 dark:bg-zinc-800" : ""}`
                }
              >
                <BaseSelect.ItemText>{o.label}</BaseSelect.ItemText>
              </BaseSelect.Item>
            ))}
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  );
}
