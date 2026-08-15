"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();

    await supabase.auth.signOut();

    router.push("/");
    router.refresh();
  }

  return (
    <button className="cursor-pointer text-white hover:text-red-500 transition-colors" type="button" onClick={handleLogout}>
      Log out
    </button>
  );
}