"use client";

import { useAuth } from "@/context/AuthContext";
import { useUserBreakers } from "@/hooks/useBreakers";
import { EmergencyCircuitsView } from "@/components/EmergencyCircuitsView";

export default function EmergencyPage() {
  const { user } = useAuth();
  const { breakers, loading } = useUserBreakers(user?.uid);

  return (
    <div className="px-4 py-4 max-w-2xl mx-auto">
      {loading ? (
        <div className="space-y-3">
          <div className="h-28 bg-red-100 rounded-2xl animate-pulse" />
          <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <EmergencyCircuitsView breakers={breakers} />
      )}
    </div>
  );
}
