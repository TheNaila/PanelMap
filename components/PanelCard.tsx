"use client";

import Link from "next/link";
import { ChevronRight, Zap, Edit2, Trash2, MoreVertical } from "lucide-react";
import { useState } from "react";
import { deletePanel } from "@/lib/firestore";
import { useAuth } from "@/context/AuthContext";
import type { Panel } from "@/types";

interface PanelCardProps {
  panel: Panel;
  propertyId: string;
  unitId: string;
  onEdit: (panel: Panel) => void;
}

export function PanelCard({ panel, propertyId, unitId, onEdit }: PanelCardProps) {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleDelete = async () => {
    if (!user) return;
    if (!confirm(`Delete panel "${panel.name}"?`)) return;
    await deletePanel(panel.id, user.uid, panel.propertyId);
    setMenuOpen(false);
  };

  return (
    <div className="relative bg-white rounded-xl border border-gray-200 shadow-sm overflow-visible">
      <Link
        href={`/properties/${propertyId}/units/${unitId}/panels/${panel.id}`}
        className="flex items-center gap-4 p-4"
        onClick={() => setMenuOpen(false)}
      >
        <div className="bg-yellow-100 rounded-xl p-3 flex-shrink-0">
          <Zap className="w-6 h-6 text-yellow-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{panel.name}</h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
              {panel.amperage}A
            </span>
            <span className="text-xs text-gray-500">{panel.voltage}</span>
            {panel.location && (
              <span className="text-xs text-gray-400 truncate">{panel.location}</span>
            )}
          </div>
          {panel.brand && (
            <p className="text-xs text-gray-400 mt-1">{panel.brand} {panel.modelNumber && `· ${panel.modelNumber}`}</p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
            {panel.totalSlots} slots
          </span>
          <ChevronRight className="w-5 h-5 text-gray-400 ml-1" />
        </div>
      </Link>

      <div className="absolute top-3 right-3">
        <button
          onClick={(e) => {
            e.preventDefault();
            setMenuOpen(!menuOpen);
          }}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-8 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-10 min-w-[140px]">
            <button
              onClick={() => { onEdit(panel); setMenuOpen(false); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Edit2 className="w-3.5 h-3.5" /> Edit
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
