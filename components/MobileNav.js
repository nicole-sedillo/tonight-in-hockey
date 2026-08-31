"use client";

import { useState } from "react";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";

export default function MobileNav({ isLoggedIn }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer text-3xl text-white"
        aria-label="Toggle navigation menu"
      >
        ☰
      </button>

      {isOpen && (
        <div className="absolute left-0 top-[74px] z-50 flex w-full flex-col gap-4 bg-gray-800 px-6 py-5 text-lg font-medium">
          <Link href="/" className="text-white hover:text-red-500">
            Home
          </Link>

          <Link href="/calendar" className="text-white hover:text-red-500">
            Calendar
          </Link>

          {isLoggedIn ? (
            <>
              <Link href="/profile" className="text-white hover:text-red-500">
                Profile
              </Link>

              <LogoutButton />
            </>
          ) : (
            <Link href="/login" className="text-white hover:text-red-500">
              Log in
            </Link>
          )}
        </div>
      )}
    </div>
  );
}