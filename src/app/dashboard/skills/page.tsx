"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import SkillsDashboard from "./SkillsDashboard";

// A Next.js App Router page can't receive a `user` prop directly — it only gets
// params/searchParams. So this thin client wrapper reads the signed-in user from
// the auth context and hands it to <SkillsDashboard/>, matching the other
// dashboard pages (redirect to /login when there's no session).
export default function SkillsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
  }, [isLoading, user, router]);

  if (!user) return null;
  return <SkillsDashboard user={user} />;
}
