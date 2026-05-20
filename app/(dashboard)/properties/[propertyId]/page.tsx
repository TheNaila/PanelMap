"use client";

import { use } from "react";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useUnits } from "@/hooks/useUnits";
import { UnitSelector } from "@/components/UnitSelector";
import { EmptyState } from "@/components/EmptyState";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Building } from "lucide-react";
import type { Property } from "@/types";

export default function PropertyPage({ params }: { params: Promise<{ propertyId: string }> }) {
  const { propertyId } = use(params);
  const { user } = useAuth();
  const { units, loading } = useUnits(propertyId);
  const [property, setProperty] = useState<Property | null>(null);

  useEffect(() => {
    getDoc(doc(db, "properties", propertyId)).then((snap) => {
      if (snap.exists()) setProperty({ id: snap.id, ...snap.data() } as Property);
    });
  }, [propertyId]);

  const breadcrumbs = [
    { label: "Dashboard", href: "/dashboard" },
    { label: property?.name || "Property" },
  ];

  return (
    <div className="px-4 py-4 max-w-2xl mx-auto">
      <Breadcrumb items={breadcrumbs} />
      <div className="mt-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{property?.name || "Property"}</h1>
        {property && (
          <p className="text-gray-500 text-sm mt-1">
            {property.address}, {property.city}, {property.state}
          </p>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : units.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <EmptyState
            icon={Building}
            title="No units yet"
            description="Add your first unit to this property."
            action={<UnitSelector units={[]} propertyId={propertyId} />}
          />
        </div>
      ) : (
        <UnitSelector units={units} propertyId={propertyId} />
      )}
    </div>
  );
}
