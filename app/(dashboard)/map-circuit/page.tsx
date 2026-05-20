"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { MappingWizard } from "@/components/MappingWizard";
import { useProperties } from "@/hooks/useProperties";
import { useUnits } from "@/hooks/useUnits";
import { usePanels } from "@/hooks/usePanels";
import { useBreakers } from "@/hooks/useBreakers";
import { Map, ChevronDown } from "lucide-react";
import type { Property, Unit, Panel } from "@/types";

function MapCircuitContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPanelId = searchParams.get("panelId");
  const initialBreakerId = searchParams.get("breakerId");

  const { properties, loading: propertiesLoading } = useProperties(user?.uid);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");
  const [selectedPanelId, setSelectedPanelId] = useState<string>(initialPanelId || "");

  const { units } = useUnits(selectedPropertyId);
  const { panels } = usePanels(selectedUnitId);
  const { breakers } = useBreakers(selectedPanelId);

  // Auto-select first property/unit/panel when loaded
  useEffect(() => {
    if (properties.length > 0 && !selectedPropertyId) {
      setSelectedPropertyId(properties[0].id);
    }
  }, [properties]);

  useEffect(() => {
    if (units.length > 0 && !selectedUnitId) {
      setSelectedUnitId(units[0].id);
    }
  }, [units]);

  useEffect(() => {
    if (panels.length > 0 && !selectedPanelId) {
      setSelectedPanelId(panels[0].id);
    }
  }, [panels]);

  const selectedPanel = panels.find((p) => p.id === selectedPanelId);

  return (
    <div className="px-4 py-4 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-blue-100 rounded-xl p-2.5">
          <Map className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Map Circuit</h1>
          <p className="text-gray-500 text-sm">Guided breaker mapping mode</p>
        </div>
      </div>

      {/* Panel selector */}
      {!initialPanelId && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">Select Panel</h2>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Property</label>
            <select
              value={selectedPropertyId}
              onChange={(e) => {
                setSelectedPropertyId(e.target.value);
                setSelectedUnitId("");
                setSelectedPanelId("");
              }}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Select property...</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {selectedPropertyId && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">Unit</label>
              <select
                value={selectedUnitId}
                onChange={(e) => {
                  setSelectedUnitId(e.target.value);
                  setSelectedPanelId("");
                }}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Select unit...</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
          )}

          {selectedUnitId && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">Panel</label>
              <select
                value={selectedPanelId}
                onChange={(e) => setSelectedPanelId(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Select panel...</option>
                {panels.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Wizard */}
      {selectedPanelId && breakers.length > 0 ? (
        <MappingWizard
          breakers={breakers}
          initialBreakerId={initialBreakerId || undefined}
          onComplete={() => router.back()}
        />
      ) : selectedPanelId && breakers.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-sm">No breakers found in this panel.</p>
          <p className="text-xs text-gray-400 mt-1">Add breakers to the panel first.</p>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">
          <Map className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Select a panel to start mapping</p>
        </div>
      )}
    </div>
  );
}

export default function MapCircuitPage() {
  return (
    <Suspense>
      <MapCircuitContent />
    </Suspense>
  );
}
