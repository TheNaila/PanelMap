"use client";

import { useState } from "react";
import { Plug, Lightbulb, Cpu, Grid, Flame, HelpCircle, Plus, Trash2, CheckCircle, Circle, Edit2 } from "lucide-react";
import { createCircuitEndpoint, updateCircuitEndpoint, deleteCircuitEndpoint } from "@/lib/firestore";
import { useAuth } from "@/context/AuthContext";
import { useEndpoints } from "@/hooks/useEndpoints";
import type { Breaker, CircuitEndpoint, EndpointType } from "@/types";

const ENDPOINT_TYPE_CONFIG: Record<EndpointType, { icon: React.ElementType; label: string; color: string }> = {
  outlet: { icon: Plug, label: "Outlet", color: "text-blue-600 bg-blue-50" },
  light: { icon: Lightbulb, label: "Light", color: "text-yellow-600 bg-yellow-50" },
  appliance: { icon: Cpu, label: "Appliance", color: "text-purple-600 bg-purple-50" },
  hvac: { icon: Flame, label: "HVAC", color: "text-orange-600 bg-orange-50" },
  fixture: { icon: Grid, label: "Fixture", color: "text-teal-600 bg-teal-50" },
  room: { icon: Grid, label: "Room", color: "text-green-600 bg-green-50" },
  other: { icon: HelpCircle, label: "Other", color: "text-gray-600 bg-gray-50" },
};

interface EndpointFormData {
  type: EndpointType;
  name: string;
  room: string;
  location: string;
  notes: string;
}

const defaultEndpointForm: EndpointFormData = {
  type: "outlet",
  name: "",
  room: "",
  location: "",
  notes: "",
};

interface CircuitEndpointListProps {
  breaker: Breaker;
}

export function CircuitEndpointList({ breaker }: CircuitEndpointListProps) {
  const { user } = useAuth();
  const { endpoints, loading } = useEndpoints(breaker.id);
  const [showForm, setShowForm] = useState(false);
  const [editingEndpoint, setEditingEndpoint] = useState<CircuitEndpoint | null>(null);
  const [form, setForm] = useState<EndpointFormData>(defaultEndpointForm);
  const [saving, setSaving] = useState(false);

  const handleAddClick = () => {
    setEditingEndpoint(null);
    setForm(defaultEndpointForm);
    setShowForm(true);
  };

  const handleEditClick = (ep: CircuitEndpoint) => {
    setEditingEndpoint(ep);
    setForm({ type: ep.type, name: ep.name, room: ep.room, location: ep.location, notes: ep.notes });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      if (editingEndpoint) {
        await updateCircuitEndpoint(editingEndpoint.id, user.uid, breaker.propertyId, {
          ...form,
          isVerified: editingEndpoint.isVerified,
          verifiedAt: editingEndpoint.verifiedAt,
          photoIds: editingEndpoint.photoIds,
        });
      } else {
        await createCircuitEndpoint(user.uid, breaker.id, breaker.panelId, breaker.unitId, breaker.propertyId, {
          ...form,
          isVerified: false,
          verifiedAt: null,
          photoIds: [],
        });
      }
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  };

  const handleVerify = async (ep: CircuitEndpoint) => {
    if (!user) return;
    const { Timestamp } = await import("firebase/firestore");
    await updateCircuitEndpoint(ep.id, user.uid, breaker.propertyId, {
      isVerified: !ep.isVerified,
      verifiedAt: !ep.isVerified ? Timestamp.now() : null,
    });
  };

  const handleDelete = async (ep: CircuitEndpoint) => {
    if (!user) return;
    if (!confirm(`Remove "${ep.name}"?`)) return;
    await deleteCircuitEndpoint(ep.id, breaker.id, user.uid, breaker.propertyId);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-700">
          Circuit Endpoints
          {endpoints.length > 0 && (
            <span className="ml-1.5 text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">
              {endpoints.length}
            </span>
          )}
        </h4>
        <button
          onClick={handleAddClick}
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
        >
          <Plus className="w-3.5 h-3.5" /> Add
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {endpoints.map((ep) => {
            const config = ENDPOINT_TYPE_CONFIG[ep.type];
            const Icon = config.icon;
            return (
              <div
                key={ep.id}
                className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2.5 group"
              >
                <div className={`p-1.5 rounded-lg ${config.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{ep.name}</p>
                  {(ep.room || ep.location) && (
                    <p className="text-xs text-gray-500 truncate">
                      {[ep.room, ep.location].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleVerify(ep)}
                    className="p-1 rounded hover:bg-gray-200 transition-colors"
                    title={ep.isVerified ? "Mark unverified" : "Mark verified"}
                  >
                    {ep.isVerified ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <Circle className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  <button
                    onClick={() => handleEditClick(ep)}
                    className="p-1 rounded hover:bg-gray-200 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-gray-500" />
                  </button>
                  <button
                    onClick={() => handleDelete(ep)}
                    className="p-1 rounded hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
                {ep.isVerified && (
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 group-hover:hidden" />
                )}
              </div>
            );
          })}

          {endpoints.length === 0 && !showForm && (
            <p className="text-xs text-gray-400 text-center py-3">
              No endpoints mapped yet.
            </p>
          )}
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mt-3 bg-blue-50 rounded-xl p-3 space-y-3 border border-blue-100">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
            <div className="grid grid-cols-4 gap-1">
              {(Object.entries(ENDPOINT_TYPE_CONFIG) as [EndpointType, typeof ENDPOINT_TYPE_CONFIG[EndpointType]][]).map(
                ([type, cfg]) => {
                  const Icon = cfg.icon;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setForm({ ...form, type })}
                      className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition-all ${
                        form.type === type
                          ? "border-blue-400 bg-blue-100 text-blue-700"
                          : "border-gray-200 bg-white text-gray-600 hover:border-blue-200"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-[9px]">{cfg.label}</span>
                    </button>
                  );
                }
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              placeholder="e.g. Kitchen counter outlet, Overhead light"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Room</label>
              <input
                type="text"
                value={form.room}
                onChange={(e) => setForm({ ...form, room: e.target.value })}
                placeholder="Kitchen"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="NW wall"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
            <input
              type="text"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none text-sm"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-xs font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2 rounded-lg text-xs font-medium"
            >
              {saving ? "Saving..." : editingEndpoint ? "Update" : "Add Endpoint"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
