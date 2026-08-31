import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold text-slate-900">
          Profile
        </h1>

        <div className="mt-6 rounded-lg bg-white p-6 shadow">
          <p className="text-sm text-slate-500">Email</p>

          <p className="mt-1 text-lg text-slate-900">
            {user.email}
          </p>
        </div>
      </div>
    </main>
  );
}