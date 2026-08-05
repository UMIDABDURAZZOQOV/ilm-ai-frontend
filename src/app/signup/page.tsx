"use client";

export const dynamic = "force-dynamic";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Sign-up is now Google-only and lives on /login (one button does both sign-up
// and login). Any old "Get started / Sign up" link lands here and is forwarded.
export default function SignupRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/login");
  }, [router]);
  return null;
}
