"use client";

import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import type { ReactNode } from "react";

export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel,
  onConfirm,
}: {
  trigger: ReactNode;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
}) {
  return (
    <BaseDialog.Root>
      <BaseDialog.Trigger render={<span>{trigger}</span>} />
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className="fixed inset-0 bg-black/40" />
        <BaseDialog.Popup className="fixed left-1/2 top-1/2 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
          <BaseDialog.Title className="text-lg font-semibold">
            {title}
          </BaseDialog.Title>
          <BaseDialog.Description className="mt-2 text-sm text-zinc-500">
            {description}
          </BaseDialog.Description>
          <div className="mt-4 flex justify-end gap-2">
            <BaseDialog.Close className="inline-flex h-9 items-center rounded-md border border-zinc-300 px-4 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">
              Cancel
            </BaseDialog.Close>
            <BaseDialog.Close
              className="inline-flex h-9 items-center rounded-md bg-red-600 px-4 text-sm font-medium text-white hover:bg-red-700"
              onClick={onConfirm}
            >
              {confirmLabel}
            </BaseDialog.Close>
          </div>
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}
