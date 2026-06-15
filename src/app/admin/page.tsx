import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

// Страница зависит от cookie и БД — не кешируем, не пытаемся пререндерить на сборке.
export const dynamic = "force-dynamic";

// Кто имеет доступ к админке. Список email через запятую задаётся в .env на сервере:
//   ADMIN_EMAILS="you@example.com,partner@example.com"
function isAdmin(email: string): boolean {
  const list = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}

const dateFmt = new Intl.DateTimeFormat("ru-RU", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Moscow",
});

export default async function AdminPage() {
  const session = await getSession();
  if (!session || !isAdmin(session.user.email)) {
    redirect("/");
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      _count: { select: { starters: true, recipes: true, comments: true } },
    },
  });

  return (
    <div className="min-h-screen bg-cream px-4 py-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-extrabold text-brown-dark">Пользователи</h1>
          <a href="/" className="text-sm text-terracotta font-bold hover:underline">
            ← На сайт
          </a>
        </div>
        <p className="text-brown-light mb-5">
          Всего аккаунтов: <span className="font-bold text-brown-dark">{users.length}</span>
        </p>

        {users.length === 0 ? (
          <p className="text-brown-light">Пока нет ни одного аккаунта.</p>
        ) : (
          <div className="space-y-2">
            {users.map((u) => (
              <div
                key={u.id}
                className="bg-card rounded-2xl p-4 card-shadow border border-warm-beige/60"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-bold text-brown-dark truncate">{u.name}</span>
                  <span className="text-xs text-brown-light whitespace-nowrap">
                    {dateFmt.format(u.createdAt)}
                  </span>
                </div>
                <div className="text-sm text-brown-light truncate">{u.email}</div>
                <div className="flex gap-4 mt-2 text-xs text-brown-light">
                  <span>🫙 заквасок: <b className="text-brown-dark">{u._count.starters}</b></span>
                  <span>📖 рецептов: <b className="text-brown-dark">{u._count.recipes}</b></span>
                  <span>💬 коммент.: <b className="text-brown-dark">{u._count.comments}</b></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
