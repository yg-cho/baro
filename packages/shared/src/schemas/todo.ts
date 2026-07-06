import { z } from "zod";

export const todoSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  completed: z.boolean(),
  createdAt: z.coerce.string(),
  updatedAt: z.coerce.string(),
});

export const createTodoSchema = z.object({
  title: z.string().min(1).max(500),
});

export const updateTodoSchema = z
  .object({
    title: z.string().min(1).max(500).optional(),
    completed: z.boolean().optional(),
  })
  .refine((v) => v.title !== undefined || v.completed !== undefined, {
    message: "at least one field required",
  });

export const todoListSchema = z.object({ todos: z.array(todoSchema) });
export const todoItemSchema = z.object({ todo: todoSchema });

export type Todo = z.infer<typeof todoSchema>;
