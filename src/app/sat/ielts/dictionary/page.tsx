"use client";

export const dynamic = "force-dynamic";

import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import IeltsDictionary from "@/components/ielts/IeltsDictionary";

export default function IeltsDictionaryPage() {
  const { user, isLoading } = useAuth();

  if (isLoading || !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-black mb-5">IELTS Dictionary</h1>
      <IeltsDictionary userId={user.id} />
    </div>
  );
}
