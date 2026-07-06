"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  useCreateTodo,
  useDeleteTodo,
  useTodos,
  useToggleTodo,
} from "./use-todos";

export function TodoList() {
  const { data: todos, isPending, error } = useTodos();
  const create = useCreateTodo();
  const toggle = useToggleTodo();
  const remove = useDeleteTodo();
  const [title, setTitle] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    create.mutate(trimmed, { onSuccess: () => setTitle("") });
  }

  if (isPending) return <p className="text-sm text-zinc-500">Loading…</p>;
  if (error) return <p className="text-sm text-red-600">{error.message}</p>;

  return (
    <Card className="w-full max-w-md">
      <form onSubmit={onSubmit} className="flex gap-2">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs doing?"
          aria-label="New todo title"
        />
        <Button type="submit" disabled={create.isPending}>
          Add
        </Button>
      </form>
      <ul className="mt-4 flex flex-col gap-2">
        {todos.map((t) => (
          <li key={t.id} className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={t.completed}
              onChange={() =>
                toggle.mutate({ id: t.id, completed: !t.completed })
              }
              aria-label={`Toggle ${t.title}`}
            />
            <span
              className={`flex-1 text-sm ${t.completed ? "text-zinc-400 line-through" : ""}`}
            >
              {t.title}
            </span>
            <Button variant="ghost" onClick={() => remove.mutate(t.id)}>
              ✕
            </Button>
          </li>
        ))}
        {todos.length === 0 && (
          <li className="text-sm text-zinc-500">Nothing yet.</li>
        )}
      </ul>
    </Card>
  );
}
