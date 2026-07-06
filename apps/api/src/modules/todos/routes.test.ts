import { describe, expect, it } from "vitest";
import { app } from "../../app";

async function makeUser(email: string): Promise<string> {
  const res = await app.request("/api/auth/sign-up/email", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "T", email, password: "password1234" }),
  });
  return res.headers.get("set-cookie") ?? "";
}

describe("todos module", () => {
  it("401 without a session", async () => {
    const res = await app.request("/api/todos");
    expect(res.status).toBe(401);
    expect((await res.json()).error.code).toBe("UNAUTHORIZED");
  });

  it("creates, lists, updates and deletes own todos", async () => {
    const cookie = await makeUser("todo-owner@example.com");

    const created = await app.request("/api/todos", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ title: "first" }),
    });
    expect(created.status).toBe(201);
    const { todo } = await created.json();
    expect(todo.title).toBe("first");
    expect(todo.completed).toBe(false);

    const list = await app.request("/api/todos", { headers: { cookie } });
    expect((await list.json()).todos).toHaveLength(1);

    const patched = await app.request(`/api/todos/${todo.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ completed: true }),
    });
    expect(patched.status).toBe(200);
    expect((await patched.json()).todo.completed).toBe(true);

    const del = await app.request(`/api/todos/${todo.id}`, {
      method: "DELETE",
      headers: { cookie },
    });
    expect(del.status).toBe(204);

    const after = await app.request("/api/todos", { headers: { cookie } });
    expect((await after.json()).todos).toHaveLength(0);
  });

  it("404 when touching another user's todo", async () => {
    const ownerCookie = await makeUser("todo-a@example.com");
    const thiefCookie = await makeUser("todo-b@example.com");

    const created = await app.request("/api/todos", {
      method: "POST",
      headers: { "content-type": "application/json", cookie: ownerCookie },
      body: JSON.stringify({ title: "mine" }),
    });
    const { todo } = await created.json();

    const patch = await app.request(`/api/todos/${todo.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json", cookie: thiefCookie },
      body: JSON.stringify({ completed: true }),
    });
    expect(patch.status).toBe(404);

    const del = await app.request(`/api/todos/${todo.id}`, {
      method: "DELETE",
      headers: { cookie: thiefCookie },
    });
    expect(del.status).toBe(404);
  });

  it("400 on invalid payload", async () => {
    const cookie = await makeUser("todo-val@example.com");
    const res = await app.request("/api/todos", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ title: "" }),
    });
    expect(res.status).toBe(400);
  });
});
