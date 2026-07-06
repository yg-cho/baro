import { getDb, schema } from "@baro/db";
import {
  createTodoSchema,
  todoItemSchema,
  todoListSchema,
  updateTodoSchema,
} from "@baro/shared/schemas/todo";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { and, desc, eq } from "drizzle-orm";
import { type AuthEnv, requireAuth } from "../auth/middleware";

const idParam = z.object({ id: z.string() });

const listRoute = createRoute({
  method: "get",
  path: "/",
  responses: {
    200: {
      description: "My todos",
      content: { "application/json": { schema: todoListSchema } },
    },
  },
});

const createTodoRoute = createRoute({
  method: "post",
  path: "/",
  request: {
    body: {
      content: { "application/json": { schema: createTodoSchema } },
    },
  },
  responses: {
    201: {
      description: "Created todo",
      content: { "application/json": { schema: todoItemSchema } },
    },
  },
});

const updateRoute = createRoute({
  method: "patch",
  path: "/{id}",
  request: {
    params: idParam,
    body: {
      content: { "application/json": { schema: updateTodoSchema } },
    },
  },
  responses: {
    200: {
      description: "Updated todo",
      content: { "application/json": { schema: todoItemSchema } },
    },
    404: { description: "Not found" },
  },
});

const deleteRoute = createRoute({
  method: "delete",
  path: "/{id}",
  request: { params: idParam },
  responses: {
    204: { description: "Deleted" },
    404: { description: "Not found" },
  },
});

const todosApp = new OpenAPIHono<AuthEnv>();
// Router-level guard — every route in this module requires a session.
// NOTE: .use() must be a separate statement (chaining widens the type).
todosApp.use("/*", requireAuth);

export const todosRoutes = todosApp
  .openapi(listRoute, async (c) => {
    const rows = await getDb()
      .select()
      .from(schema.todo)
      .where(eq(schema.todo.userId, c.get("sessionUser").id))
      .orderBy(desc(schema.todo.createdAt));
    return c.json({ todos: rows.map(serialize) }, 200);
  })
  .openapi(createTodoRoute, async (c) => {
    const { title } = c.req.valid("json");
    const [row] = await getDb()
      .insert(schema.todo)
      .values({
        id: crypto.randomUUID(),
        userId: c.get("sessionUser").id,
        title,
      })
      .returning();
    return c.json({ todo: serialize(row) }, 201);
  })
  .openapi(updateRoute, async (c) => {
    const { id } = c.req.valid("param");
    const patch = c.req.valid("json");
    const [row] = await getDb()
      .update(schema.todo)
      .set({ ...patch, updatedAt: new Date() })
      .where(
        and(
          eq(schema.todo.id, id),
          eq(schema.todo.userId, c.get("sessionUser").id),
        ),
      )
      .returning();
    if (!row) {
      return c.json(
        { error: { code: "NOT_FOUND", message: "Todo not found" } },
        404,
      );
    }
    return c.json({ todo: serialize(row) }, 200);
  })
  .openapi(deleteRoute, async (c) => {
    const { id } = c.req.valid("param");
    const deleted = await getDb()
      .delete(schema.todo)
      .where(
        and(
          eq(schema.todo.id, id),
          eq(schema.todo.userId, c.get("sessionUser").id),
        ),
      )
      .returning();
    if (deleted.length === 0) {
      return c.json(
        { error: { code: "NOT_FOUND", message: "Todo not found" } },
        404,
      );
    }
    return c.body(null, 204);
  });

function serialize(row: typeof schema.todo.$inferSelect) {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
