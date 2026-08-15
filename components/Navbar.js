import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/LogoutButton";
import Image from "next/image";

export default async function Navbar() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <nav className="flex items-center justify-between gap-6 border-b border-slate-200 bg-gray-800 px-7 py-3">
      <Link href="/">
        <Image
            src="/hoc.png"
            alt="Puckbook"
            width={100}
            height={50}
        />
        </Link>

      <div className="flex items-center gap-6 text-xl font-medium">
        <Link href="/" className="text-white hover:text-red-500 transition-colors">Home</Link>
        <Link href="/calendar" className="text-white hover:text-red-500 transition-colors">Calendar</Link>

        {user ? (
        <>
            <Link href="/profile" className="text-white hover:text-red-500 transition-colors">Profile</Link>
            <LogoutButton />
        </>
        ) : (
        <Link href="/login" className="text-white hover:text-red-500 transition-colors">Log in</Link>
        )}
      </div>
    </nav>
  );
}