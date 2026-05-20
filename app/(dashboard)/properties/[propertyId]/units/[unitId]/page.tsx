"use client";

import { use } from "react";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { usePanels } from "@/hooks/usePanels";
import { PanelCard } from "@/components/PanelCard";
import { EmptyState } from "@/components/EmptyState";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Modal } from "@/components/Modal";
import { createPanel, updatePanel } from "@/lib/firestore";
import { Zap, Plus } from "lucide-react";
import type { Property, Unit, Panel, PanelVoltage } from "@/types";

interface PanelFormData {
  name: string;
  location: string;
  amperage: number;
  voltage: PanelVoltage;
  phases: 1 | 3;
  totalSlots: number;
  brand: string;
  modelNumber: string;
  installYear: string;
  notes: string;
}

const defaultPanelForm: PanelFormData = {
  name: "Main Panel",
  location: "Basement",
  amperage: 200,
  voltage: "120/240V",
  phases: 1,
  totalSlots: 40,
  brand: "",
  modelNumber: "",
  installYear: "",
  notes: "",
};

export default function UnitPage({ params }: { params: Promise<{ propertyId: string; unitId: string }> }) {
  const { propertyId, unitId } = use(params);
  const { user } = useAuth();
  const { panels, loading } = usePanels(unitId);
  const [property, setProperty] = useState<Property | null>(null);
  const [unit, setUnit] = useState<Unit | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingPanel, setEditingPanel] = useState<Panel | null>(null);
  const [form, setForm] = useState<PanelFormData>(defaultPanelForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getDoc(doc(db, "properties", propertyId)).then((snap) => {
      if (snap.exists()) setProperty({ id: snap.id, ...snap.data() } as Property);
    });
    getDoc(doc(db, "units", unitId)).then((snap) => {
      if (snap.exists()) setUnit({ id: snap.id, ...snap.data() } as Unit);
    });
  }, [propertyId, unitId]);

  const openCreate = () => {
    setEditingPanel(null);
    setForm(defaultPanelForm);
    setShowModal(true);
  };

  const handleEdit = (panel: Panel) => {
    setEditingPanel(panel);
    setForm({
      name: panel.name,
      location: panel.location,
      amperage: panel.amperage,
      voltage: panel.voltage,
      phases: panel.phases,
      totalSlots: panel.totalSlots,
      brand: panel.brand,
      modelNumber: panel.modelNumber,
      installYear: panel.installYear,
      notes: panel.notes,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      if (editingPanel) {
        await updatePanel(editingPanel.id, user.uid, propertyId, {
          ...form,
          photoIds: editingPanel.photoIds,
        });
      } else {
        await createPanel(user.uid, unitId, propertyId, {
          ...form,
          photoIds: [],
        });
      }
      setShowModal(false);
    } finally {
      setSaving(false);
    }
  };

  const breadcrumbs = [
    { label: "Dashboard", href: "/dashboard" },
    { label: property?.name || "Property", href: `/properties/${propertyId}` },
    { label: unit?.name || "Unit" },
  ];

  return (
    <div className="px-4 py-4 max-w-2xl mx-auto">
      <Breadcrumb items={breadcrumbs} />
      <div className="flex items-center justify-between mt-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{unit?.name || "Unit"}</h1>
          <p className="text-gray-500 text-sm mt-1">Electrical panels</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Panel
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1].map((i) => (
            <div key={i} className="bg-white rounded-xl border p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : panels.length === 0 ? (
        <EmptyState
          icon={Zap}
          title="No panels yet"
          description="Add your first electrical panel to start mapping breakers."
          action={
            <button
              onClick={openCreate}
              className="flex items-center gap-1.5 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg"
            >
              <Plus className="w-4 h-4" /> Add Panel
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {panels.map((panel) => (
            <PanelCard
              key={panel.id}
              panel={panel}
              propertyId={propertyId}
              unitId={unitId}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}

      {/* Panel Form Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingPanel ? "Edit Panel" : "Add Panel"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Panel Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              placeholder="e.g. Main Panel, Sub Panel A"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="e.g. Basement, Garage, Utility Room"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amperage</label>
              <select
                value={form.amperage}
                onChange={(e) => setForm({ ...form, amperage: parseInt(e.target.value) })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm bg-white"
              >
                {[60, 100, 125, 150, 200, 300, 400].map((a) => (
                  <option key={a} value={a}>{a}A</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Voltage</label>
              <select
                value={form.voltage}
                onChange={(e) => setForm({ ...form, voltage: e.target.value as PanelVoltage })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm bg-white"
              >
                <option value="120/240V">120/240V</option>
                <option value="120/208V">120/208V</option>
                <option value="277/480V">277/480V</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Slots</label>
              <input
                type="number"
                value={form.totalSlots}
                onChange={(e) => setForm({ ...form, totalSlots: parseInt(e.target.value) || 20 })}
                min={2}
                max={200}
                step={2}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phases</label>
              <select
                value={form.phases}
                onChange={(e) => setForm({ ...form, phases: parseInt(e.target.value) as 1 | 3 })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm bg-white"
              >
                <option value={1}>Single Phase</option>
                <option value={3}>Three Phase</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
              <input
                type="text"
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                placeholder="Square D, Siemens..."
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Install Year</label>
              <input
                type="text"
                value={form.installYear}
                onChange={(e) => setForm({ ...form, installYear: e.target.value })}
                placeholder="2005"
                maxLength={4}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2.5 rounded-lg text-sm font-medium"
            >
              {saving ? "Saving..." : editingPanel ? "Save Changes" : "Add Panel"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
