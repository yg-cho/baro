"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { TodoList } from "@/features/todos/todo-list";
import { useSession } from "@/lib/auth-client";

export default function TodosPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending && !session) router.replace("/login");
  }, [isPending, session, router]);

  if (isPending || !session) return null;

  return (
    <main className="flex min-h-screen flex-col items-center gap-6 p-6">
      <h1 className="text-xl font-semibold">Todos</h1>
      <TodoList />
    </main>
  );
}
