import { api } from "@/lib/api";

async function getHealthStatus(): Promise<string> {
  try {
    const res = await api.health.$get();
    const body = await res.json();
    return body.status;
  } catch {
    return "unreachable";
  }
}

export default async function Home() {
  const status = await getHealthStatus();
  return (
    <main className="flex min-h-screen items-center justify-center">
      <p className="font-mono text-lg">
        baro — api status: <span className="font-bold">{status}</span>
      </p>
    </main>
  );
}
