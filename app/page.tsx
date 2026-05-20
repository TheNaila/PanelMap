"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Zap } from "lucide-react";

export default function RootPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      router.replace(user ? "/dashboard" : "/login");
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-blue-700">
      <div className="text-center text-white">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Zap className="w-12 h-12 text-yellow-400" />
          <h1 className="text-4xl font-bold">PanelMap</h1>
        </div>
        <p className="text-blue-200 text-lg">Loading...</p>
      </div>
    </div>
  );
}
