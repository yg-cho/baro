"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

const KEY = ["todos"] as const;

export function useTodos() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const res = await api.api.todos.$get();
      if (!res.ok) throw new Error("Failed to load todos");
      return (await res.json()).todos;
    },
  });
}

export function useCreateTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (title: string) => {
      const res = await api.api.todos.$post({ json: { title } });
      if (!res.ok) throw new Error("Failed to create todo");
      return (await res.json()).todo;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useToggleTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; completed: boolean }) => {
      const res = await api.api.todos[":id"].$patch({
        param: { id: input.id },
        json: { completed: input.completed },
      });
      if (!res.ok) throw new Error("Failed to update todo");
      return (await res.json()).todo;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.api.todos[":id"].$delete({ param: { id } });
      if (!res.ok) throw new Error("Failed to delete todo");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
