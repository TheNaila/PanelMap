"use client";

import { use } from "react";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useBreakers } from "@/hooks/useBreakers";
import { usePanel } from "@/hooks/usePanels";
import { PanelGrid } from "@/components/PanelGrid";
import { BreakerDetailDrawer } from "@/components/BreakerDetailDrawer";
import { Breadcrumb } from "@/components/Breadcrumb";
import { PhotoUploader } from "@/components/PhotoUploader";
import {
  Zap, CheckCircle, AlertTriangle, Map, Camera, ChevronDown, ChevronUp
} from "lucide-react";
import Link from "next/link";
import type { Breaker, Panel, Property, Unit } from "@/types";

export default function PanelPage({ params }: { params: Promise<{ propertyId: string; unitId: string; panelId: string }> }) {
  const { propertyId, unitId, panelId } = use(params);
  const { panel, loading: panelLoading } = usePanel(panelId);
  const { breakers, loading: breakersLoading } = useBreakers(panelId);

  const [property, setProperty] = useState<Property | null>(null);
  const [unit, setUnit] = useState<Unit | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedBreaker, setSelectedBreaker] = useState<Breaker | null>(null);
  const [selectedSlot, setSelectedSlot] = useState(1);
  const [showStats, setShowStats] = useState(true);
  const [showPhotos, setShowPhotos] = useState(false);

  useEffect(() => {
    getDoc(doc(db, "properties", propertyId)).then((s) => {
      if (s.exists()) setProperty({ id: s.id, ...s.data() } as Property);
    });
    getDoc(doc(db, "units", unitId)).then((s) => {
      if (s.exists()) setUnit({ id: s.id, ...s.data() } as Unit);
    });
  }, [propertyId, unitId]);

  const handleBreakerClick = (breaker: Breaker | null, slot: number) => {
    setSelectedBreaker(breaker);
    setSelectedSlot(slot);
    setDrawerOpen(true);
  };

  // Stats
  const verifiedCount = breakers.filter((b) => b.isVerified).length;
  const trippedCount = breakers.filter((b) => b.status === "tripped").length;
  const criticalCount = breakers.filter((b) => b.isCritical).length;
  const occupiedSlots = breakers.reduce((sum, b) => sum + b.slotsUsed, 0);
  const totalSlots = panel?.totalSlots || 40;

  const breadcrumbs = [
    { label: "Dashboard", href: "/dashboard" },
    { label: property?.name || "Property", href: `/properties/${propertyId}` },
    { label: unit?.name || "Unit", href: `/properties/${propertyId}/units/${unitId}` },
    { label: panel?.name || "Panel" },
  ];

  if (panelLoading) {
    return (
      <div className="px-4 py-4">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-64 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!panel) {
    return (
      <div className="px-4 py-4 text-center text-gray-500">
        Panel not found.
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="px-4 py-4">
        <Breadcrumb items={breadcrumbs} />
        <div className="flex items-center justify-between mt-3 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{panel.name}</h1>
            <p className="text-gray-500 text-sm mt-0.5">{panel.location}</p>
          </div>
          <Link
            href={`/map-circuit?panelId=${panelId}`}
            className="flex items-center gap-1.5 bg-blue-600 text-white text-sm font-medium px-3 py-2 rounded-lg"
          >
            <Map className="w-4 h-4" />
            Map Circuit
          </Link>
        </div>

        {/* Stats bar */}
        <button
          onClick={() => setShowStats(!showStats)}
          className="w-full flex items-center justify-between bg-white rounded-xl border border-gray-200 px-4 py-2.5 mb-3 shadow-sm"
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-gray-700">{verifiedCount}/{breakers.length}</span>
              <span className="text-xs text-gray-400">verified</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-700">{occupiedSlots}/{totalSlots}</span>
              <span className="text-xs text-gray-400">slots</span>
            </div>
            {trippedCount > 0 && (
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium text-red-600">{trippedCount} tripped</span>
              </div>
            )}
          </div>
          {showStats ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </button>

        {/* Extended stats */}
        {showStats && (
          <div className="grid grid-cols-4 gap-2 mb-4">
            <div className="bg-white rounded-xl border border-gray-100 p-3 text-center shadow-sm">
              <p className="text-2xl font-bold text-gray-900">{breakers.length}</p>
              <p className="text-xs text-gray-500">Breakers</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-3 text-center shadow-sm">
              <p className="text-2xl font-bold text-green-600">{verifiedCount}</p>
              <p className="text-xs text-gray-500">Verified</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-3 text-center shadow-sm">
              <p className="text-2xl font-bold text-red-600">{trippedCount}</p>
              <p className="text-xs text-gray-500">Tripped</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-3 text-center shadow-sm">
              <p className="text-2xl font-bold text-orange-600">{criticalCount}</p>
              <p className="text-xs text-gray-500">Critical</p>
            </div>
          </div>
        )}
      </div>

      {/* Panel Grid */}
      <div className="px-4 pb-4">
        {breakersLoading ? (
          <div className="bg-gray-800 rounded-xl p-6 animate-pulse">
            <div className="h-4 bg-gray-700 rounded w-1/2 mx-auto mb-4" />
            <div className="grid grid-cols-2 gap-2">
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className="h-10 bg-gray-700 rounded-lg" />
              ))}
            </div>
          </div>
        ) : (
          <PanelGrid
            panel={panel}
            breakers={breakers}
            onBreakerClick={handleBreakerClick}
          />
        )}
      </div>

      {/* Legend */}
      <div className="px-4 pb-4">
        <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Legend</p>
          <div className="flex flex-wrap gap-3">
            {[
              { color: "bg-green-500", label: "ON" },
              { color: "bg-gray-400", label: "OFF" },
              { color: "bg-red-500", label: "Tripped" },
              { color: "bg-yellow-400", label: "Unknown" },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
                <span className="text-xs text-gray-600">{label}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 flex items-center justify-center">
                <div className="w-1 h-1 bg-white rounded-full" />
              </div>
              <span className="text-xs text-gray-600">Critical</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">Tap any slot to add or edit a breaker</p>
        </div>
      </div>

      {/* Breaker Detail Drawer */}
      <BreakerDetailDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        panel={panel}
        breaker={selectedBreaker}
        slot={selectedSlot}
      />
    </div>
  );
}
