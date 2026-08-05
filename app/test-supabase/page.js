import { createClient } from "@/lib/supabase/server";

export default async function TestSupabasePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main>
      <h1>Supabase connection test</h1>
      <p>Connected successfully.</p>

      <p>
        {user
          ? `Signed in as ${user.email}`
          : "No user signed in yet."}
      </p>
    </main>
  );
}