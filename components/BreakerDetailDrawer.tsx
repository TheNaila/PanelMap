"use client";

import { useState } from "react";
import {
  X, ChevronDown, ChevronUp, Save, Trash2, CheckCircle, Shield, Tag,
  Zap, StickyNote, Home, Cpu, AlertTriangle,
} from "lucide-react";
import { createBreaker, updateBreaker, deleteBreaker } from "@/lib/firestore";
import { useAuth } from "@/context/AuthContext";
import { CircuitEndpointList } from "./CircuitEndpointList";
import { PhotoUploader } from "./PhotoUploader";
import type { Breaker, BreakerType, BreakerStatus, Panel } from "@/types";
import { Timestamp } from "firebase/firestore";

const BREAKER_TYPES: BreakerType[] = ["single", "double", "tandem", "GFCI", "AFCI", "GFCI/AFCI", "main"];
const BREAKER_AMPERAGES = [15, 20, 25, 30, 40, 50, 60, 70, 80, 100, 150, 200];
const STATUS_COLORS: Record<BreakerStatus, string> = {
  on: "bg-green-100 text-green-700 border-green-200",
  off: "bg-gray-100 text-gray-600 border-gray-200",
  tripped: "bg-red-100 text-red-700 border-red-200",
  unknown: "bg-yellow-100 text-yellow-700 border-yellow-200",
};

interface BreakerDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  panel: Panel;
  breaker: Breaker | null;
  slot: number;
}

interface BreakerFormData {
  label: string;
  amperage: number;
  type: BreakerType;
  status: BreakerStatus;
  notes: string;
  roomsServed: string;
  devicesServed: string;
  isVerified: boolean;
  isCritical: boolean;
  criticalKeywords: string;
  slotsUsed: number;
}

function makeFormFromBreaker(b: Breaker): BreakerFormData {
  return {
    label: b.label,
    amperage: b.amperage,
    type: b.type,
    status: b.status,
    notes: b.notes,
    roomsServed: b.roomsServed.join(", "),
    devicesServed: b.devicesServed.join(", "),
    isVerified: b.isVerified,
    isCritical: b.isCritical,
    criticalKeywords: b.criticalKeywords.join(", "),
    slotsUsed: b.slotsUsed,
  };
}

const defaultForm: BreakerFormData = {
  label: "",
  amperage: 20,
  type: "single",
  status: "unknown",
  notes: "",
  roomsServed: "",
  devicesServed: "",
  isVerified: false,
  isCritical: false,
  criticalKeywords: "",
  slotsUsed: 1,
};

export function BreakerDetailDrawer({ isOpen, onClose, panel, breaker, slot }: BreakerDetailDrawerProps) {
  const { user } = useAuth();
  const [form, setForm] = useState<BreakerFormData>(
    breaker ? makeFormFromBreaker(breaker) : { ...defaultForm }
  );
  const [saving, setSaving] = useState(false);
  const [showEndpoints, setShowEndpoints] = useState(true);
  const [showPhotos, setShowPhotos] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "endpoints" | "photos">("details");

  // Sync form when breaker prop changes
  const [lastBreakerId, setLastBreakerId] = useState<string | null>(null);
  if (breaker && breaker.id !== lastBreakerId) {
    setLastBreakerId(breaker.id);
    setForm(makeFormFromBreaker(breaker));
  } else if (!breaker && lastBreakerId !== null) {
    setLastBreakerId(null);
    setForm({ ...defaultForm });
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    const data = {
      slot,
      label: form.label,
      amperage: form.amperage,
      type: form.type,
      status: form.status,
      notes: form.notes,
      roomsServed: form.roomsServed
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      devicesServed: form.devicesServed
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      isVerified: form.isVerified,
      verifiedAt: form.isVerified ? Timestamp.now() : null,
      isCritical: form.isCritical,
      criticalKeywords: form.criticalKeywords
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean),
      slotsUsed: form.type === "double" ? 2 : 1,
      photoIds: breaker?.photoIds || [],
      endpointIds: breaker?.endpointIds || [],
    };

    try {
      if (breaker) {
        await updateBreaker(breaker.id, user.uid, panel.propertyId, data);
      } else {
        await createBreaker(user.uid, panel.id, panel.unitId, panel.propertyId, data);
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !breaker) return;
    if (!confirm(`Delete breaker "${breaker.label || `#${slot}`}"?`)) return;
    await deleteBreaker(breaker.id, user.uid, breaker.propertyId);
    onClose();
  };

  const handleStatusChange = (status: BreakerStatus) => {
    setForm({ ...form, status });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl max-h-[92vh] flex flex-col">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {breaker ? `Breaker #${slot}` : `Add Breaker to Slot ${slot}`}
            </h2>
            {breaker && (
              <p className="text-sm text-gray-500">{breaker.label || "Unlabeled"}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        {breaker && (
          <div className="flex border-b border-gray-100 px-4">
            {(["details", "endpoints", "photos"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 px-4 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                  activeTab === tab
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {(!breaker || activeTab === "details") && (
            <form onSubmit={handleSave} className="p-4 space-y-4">
              {/* Status quick-select */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Status
                </label>
                <div className="flex gap-2">
                  {(["on", "off", "tripped", "unknown"] as BreakerStatus[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleStatusChange(s)}
                      className={`flex-1 py-2 px-1 rounded-lg border text-xs font-semibold uppercase transition-all ${
                        form.status === s
                          ? STATUS_COLORS[s] + " ring-2 ring-offset-1 ring-blue-400"
                          : "border-gray-200 text-gray-500 hover:border-gray-300"
                      }`}
                    >
                      {s === "tripped" ? "⚠ Trip" : s.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Label */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  <Tag className="inline w-3 h-3 mr-1" />Label
                </label>
                <input
                  type="text"
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  placeholder="e.g. Kitchen Outlets, Washer, HVAC Unit 1"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                />
              </div>

              {/* Amperage & Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    <Zap className="inline w-3 h-3 mr-1" />Amperage
                  </label>
                  <select
                    value={form.amperage}
                    onChange={(e) => setForm({ ...form, amperage: parseInt(e.target.value) })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm bg-white"
                  >
                    {BREAKER_AMPERAGES.map((a) => (
                      <option key={a} value={a}>{a}A</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Type
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as BreakerType })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm bg-white"
                  >
                    {BREAKER_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Rooms & Devices */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  <Home className="inline w-3 h-3 mr-1" />Rooms Served (comma-separated)
                </label>
                <input
                  type="text"
                  value={form.roomsServed}
                  onChange={(e) => setForm({ ...form, roomsServed: e.target.value })}
                  placeholder="Kitchen, Dining Room"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  <Cpu className="inline w-3 h-3 mr-1" />Devices Served (comma-separated)
                </label>
                <input
                  type="text"
                  value={form.devicesServed}
                  onChange={(e) => setForm({ ...form, devicesServed: e.target.value })}
                  placeholder="Refrigerator, Microwave"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  <StickyNote className="inline w-3 h-3 mr-1" />Notes
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm resize-none"
                  placeholder="Add notes about this breaker..."
                />
              </div>

              {/* Toggles */}
              <div className="space-y-3">
                {/* Verified toggle */}
                <label className="flex items-center justify-between cursor-pointer bg-green-50 rounded-xl px-4 py-3 border border-green-100">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">Verified</p>
                      <p className="text-xs text-gray-500">Breaker mapping confirmed</p>
                    </div>
                  </div>
                  <div
                    onClick={() => setForm({ ...form, isVerified: !form.isVerified })}
                    className={`relative w-10 h-6 rounded-full transition-colors cursor-pointer ${
                      form.isVerified ? "bg-green-500" : "bg-gray-200"
                    }`}
                  >
                    <div
                      className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                        form.isVerified ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </div>
                </label>

                {/* Critical toggle */}
                <label className="flex items-center justify-between cursor-pointer bg-red-50 rounded-xl px-4 py-3 border border-red-100">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-red-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">Critical Circuit</p>
                      <p className="text-xs text-gray-500">Shows in Emergency view</p>
                    </div>
                  </div>
                  <div
                    onClick={() => setForm({ ...form, isCritical: !form.isCritical })}
                    className={`relative w-10 h-6 rounded-full transition-colors cursor-pointer ${
                      form.isCritical ? "bg-red-500" : "bg-gray-200"
                    }`}
                  >
                    <div
                      className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                        form.isCritical ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </div>
                </label>
              </div>

              {/* Critical keywords */}
              {form.isCritical && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    <AlertTriangle className="inline w-3 h-3 mr-1" />Critical Keywords (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={form.criticalKeywords}
                    onChange={(e) => setForm({ ...form, criticalKeywords: e.target.value })}
                    placeholder="refrigerator, sump pump, boiler"
                    className="w-full px-3 py-2.5 border border-red-200 rounded-xl focus:ring-2 focus:ring-red-400 focus:border-transparent outline-none text-sm"
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2 pb-4">
                {breaker && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="flex items-center gap-1.5 border border-red-200 text-red-600 hover:bg-red-50 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                )}
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Saving..." : breaker ? "Save Changes" : "Add Breaker"}
                </button>
              </div>
            </form>
          )}

          {breaker && activeTab === "endpoints" && (
            <div className="p-4">
              <CircuitEndpointList breaker={breaker} />
            </div>
          )}

          {breaker && activeTab === "photos" && (
            <div className="p-4">
              <PhotoUploader
                entityType="breaker"
                entityId={breaker.id}
                onUploaded={() => {}}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
