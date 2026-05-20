"use client";

import { useState } from "react";
import Link from "next/link";
import { Home, Building2, MapPin, Plus, Edit2, Trash2, MoreVertical, ChevronRight } from "lucide-react";
import { createProperty, updateProperty, deleteProperty } from "@/lib/firestore";
import { useAuth } from "@/context/AuthContext";
import { Modal } from "./Modal";
import type { Property, PropertyType } from "@/types";

const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  single_family: "Single Family",
  multi_family: "Multi-Family",
  condo: "Condo",
  commercial: "Commercial",
  other: "Other",
};

interface PropertyFormData {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  type: PropertyType;
  unitCount: number;
}

const defaultForm: PropertyFormData = {
  name: "",
  address: "",
  city: "",
  state: "",
  zip: "",
  type: "single_family",
  unitCount: 1,
};

interface PropertySelectorProps {
  properties: Property[];
}

export function PropertySelector({ properties }: PropertySelectorProps) {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [form, setForm] = useState<PropertyFormData>(defaultForm);
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const openCreate = () => {
    setEditingProperty(null);
    setForm(defaultForm);
    setShowModal(true);
  };

  const openEdit = (p: Property) => {
    setEditingProperty(p);
    setForm({
      name: p.name,
      address: p.address,
      city: p.city,
      state: p.state,
      zip: p.zip,
      type: p.type,
      unitCount: p.unitCount,
    });
    setShowModal(true);
    setMenuOpen(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      if (editingProperty) {
        await updateProperty(editingProperty.id, user.uid, form);
      } else {
        await createProperty(user.uid, form);
      }
      setShowModal(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (property: Property) => {
    if (!user) return;
    if (!confirm(`Delete "${property.name}"? This cannot be undone.`)) return;
    await deleteProperty(property.id, user.uid);
    setMenuOpen(null);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Your Properties</h2>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Property
        </button>
      </div>

      {/* Property List */}
      <div className="grid gap-3">
        {properties.map((property) => (
          <div key={property.id} className="relative bg-white rounded-xl border border-gray-200 shadow-sm overflow-visible">
            <Link
              href={`/properties/${property.id}`}
              className="flex items-center gap-4 p-4"
              onClick={() => setMenuOpen(null)}
            >
              <div className="bg-blue-100 rounded-xl p-3 flex-shrink-0">
                {property.type === "multi_family" ? (
                  <Building2 className="w-6 h-6 text-blue-600" />
                ) : (
                  <Home className="w-6 h-6 text-blue-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">{property.name}</h3>
                <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">
                    {property.address}, {property.city}, {property.state}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                    {PROPERTY_TYPE_LABELS[property.type]}
                  </span>
                  <span className="text-xs text-gray-500">
                    {property.unitCount} unit{property.unitCount !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
            </Link>

            {/* Actions menu */}
            <div className="absolute top-3 right-3">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setMenuOpen(menuOpen === property.id ? null : property.id);
                }}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              {menuOpen === property.id && (
                <div className="absolute right-0 top-8 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-10 min-w-[140px]">
                  <button
                    onClick={() => openEdit(property)}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(property)}
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

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingProperty ? "Edit Property" : "Add Property"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Property Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              placeholder="e.g. Main House, Rental Unit A"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="123 Main St"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input
                type="text"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                maxLength={2}
                placeholder="OH"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
              <input
                type="text"
                value={form.zip}
                onChange={(e) => setForm({ ...form, zip: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Units</label>
              <input
                type="number"
                value={form.unitCount}
                onChange={(e) => setForm({ ...form, unitCount: parseInt(e.target.value) || 1 })}
                min={1}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as PropertyType })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm bg-white"
            >
              {Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              {loading ? "Saving..." : editingProperty ? "Save Changes" : "Add Property"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
