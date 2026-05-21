"use client";

import { useState } from "react";
import Link from "next/link";
import { Building, ChevronRight, Plus, Edit2, Trash2, MoreVertical, Layers } from "lucide-react";
import { createUnit, updateUnit, deleteUnit } from "@/lib/firestore";
import { useAuth } from "@/context/AuthContext";
import { Modal } from "./Modal";
import type { Unit, UnitType } from "@/types";

const UNIT_TYPE_LABELS: Record<UnitType, string> = {
  apartment: "Apartment",
  condo: "Condo",
  house: "House",
  basement: "Basement / Lower Level",
  commercial_suite: "Commercial Suite",
  other: "Other",
};

interface UnitFormData {
  name: string;
  floor: string;
  type: UnitType;
  notes: string;
}

const defaultForm: UnitFormData = {
  name: "",
  floor: "",
  type: "house",
  notes: "",
};

interface UnitSelectorProps {
  units: Unit[];
  propertyId: string;
}

export function UnitSelector({ units, propertyId }: UnitSelectorProps) {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [form, setForm] = useState<UnitFormData>(defaultForm);
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const openCreate = () => {
    setEditingUnit(null);
    setForm(defaultForm);
    setShowModal(true);
  };

  const openEdit = (u: Unit) => {
    setEditingUnit(u);
    setForm({ name: u.name, floor: u.floor, type: u.type, notes: u.notes });
    setShowModal(true);
    setMenuOpen(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      if (editingUnit) {
        await updateUnit(editingUnit.id, user.uid, propertyId, form);
      } else {
        await createUnit(user.uid, propertyId, form);
      }
      setShowModal(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (unit: Unit) => {
    if (!user) return;
    if (!confirm(`Delete unit "${unit.name}"?`)) return;
    await deleteUnit(unit.id, user.uid, propertyId);
    setMenuOpen(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Units</h2>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Unit
        </button>
      </div>

      <div className="grid gap-3">
        {units.map((unit) => (
          <div key={unit.id} className="relative bg-white rounded-xl border border-gray-200 shadow-sm overflow-visible">
            <Link
              href={`/properties/${propertyId}/units/${unit.id}`}
              className="flex items-center gap-4 p-4"
              onClick={() => setMenuOpen(null)}
            >
              <div className="bg-indigo-100 rounded-xl p-3 flex-shrink-0">
                <Building className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">{unit.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                    {UNIT_TYPE_LABELS[unit.type]}
                  </span>
                  {unit.floor && (
                    <span className="text-xs text-gray-500">Floor {unit.floor}</span>
                  )}
                </div>
                {unit.notes && (
                  <p className="text-xs text-gray-500 mt-1 truncate">{unit.notes}</p>
                )}
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
            </Link>

            <div className="absolute top-3 right-3">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setMenuOpen(menuOpen === unit.id ? null : unit.id);
                }}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              {menuOpen === unit.id && (
                <div className="absolute right-0 top-8 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-10 min-w-[140px]">
                  <button
                    onClick={() => openEdit(unit)}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(unit)}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingUnit ? "Edit Unit" : "Add Unit"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              placeholder="e.g. Main Floor, Unit 1A, Basement"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Floor</label>
              <input
                type="text"
                value={form.floor}
                onChange={(e) => setForm({ ...form, floor: e.target.value })}
                placeholder="1, 2, B..."
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as UnitType })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm bg-white"
              >
                {Object.entries(UNIT_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
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
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2.5 rounded-lg text-sm font-medium"
            >
              {loading ? "Saving..." : editingUnit ? "Save Changes" : "Add Unit"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
