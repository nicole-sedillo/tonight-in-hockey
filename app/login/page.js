"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSignUp() {
    setIsLoading(true);
    setMessage("");

    const supabase = createClient();

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      },
    });

    setIsLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Check your email to confirm your account.");
  }

  async function handleLogin() {
    setIsLoading(true);
    setMessage("");

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setIsLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
  <main className="mx-auto max-w-md p-6">
    <h1 className="mb-6 text-2xl font-bold">
      Log in to Puckbook
    </h1>

    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-2">
        Email
        <input
          className="border p-2"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </label>

      <label className="flex flex-col gap-2">
        Password
        <input
          className="border p-2"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          minLength={6}
        />
      </label>

      <div className="flex flex-col gap-4">
        <button
          className="cursor-pointer"
          type="button"
          onClick={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? "Loading..." : "Log in"}
        </button>

        <button
          className="cursor-pointer"
          type="button"
          onClick={handleSignUp}
          disabled={isLoading}
        >
          {isLoading ? "Loading..." : "Create account"}
        </button>
      </div>

      {message && <p>{message}</p>}
    </div>
  </main>
);
}