import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/LogoutButton";

export default async function Navbar() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <nav>
      <Link href="/">Puckbook</Link>

      <div className="flex items-center gap-6">
        <Link href="/">Home</Link>
        <Link href="/calendar">Calendar</Link>

        {user ? (
          <>
            <Link href="/profile">Profile</Link>
            <LogoutButton />
          </>
        ) : (
          <Link href="/login">Log in</Link>
        )}
      </div>
    </nav>
  );
}