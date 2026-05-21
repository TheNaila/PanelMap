"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle, Shield, Thermometer, Droplets, Zap, Wind, Refrigerator,
  Phone, ChevronRight, ExternalLink, CheckCircle, XCircle, HelpCircle,
} from "lucide-react";
import type { Breaker } from "@/types";

const CRITICAL_CATEGORIES = [
  {
    id: "refrigerator",
    label: "Refrigerator / Freezer",
    icon: Refrigerator,
    keywords: ["refrigerator", "fridge", "freezer"],
    color: "bg-blue-50 border-blue-200 text-blue-700",
    iconBg: "bg-blue-100",
    urgency: "medium",
  },
  {
    id: "sump",
    label: "Sump Pump",
    icon: Droplets,
    keywords: ["sump", "sump pump"],
    color: "bg-cyan-50 border-cyan-200 text-cyan-700",
    iconBg: "bg-cyan-100",
    urgency: "high",
  },
  {
    id: "boiler",
    label: "Boiler / Furnace",
    icon: Thermometer,
    keywords: ["boiler", "furnace", "heat"],
    color: "bg-orange-50 border-orange-200 text-orange-700",
    iconBg: "bg-orange-100",
    urgency: "high",
  },
  {
    id: "hvac",
    label: "HVAC / AC",
    icon: Wind,
    keywords: ["hvac", "ac", "air conditioner", "air handler", "condenser"],
    color: "bg-teal-50 border-teal-200 text-teal-700",
    iconBg: "bg-teal-100",
    urgency: "medium",
  },
  {
    id: "medical",
    label: "Medical Equipment",
    icon: Shield,
    keywords: ["medical", "oxygen", "cpap", "nebulizer", "dialysis"],
    color: "bg-red-50 border-red-200 text-red-700",
    iconBg: "bg-red-100",
    urgency: "critical",
  },
  {
    id: "well",
    label: "Well Pump",
    icon: Droplets,
    keywords: ["well", "well pump"],
    color: "bg-emerald-50 border-emerald-200 text-emerald-700",
    iconBg: "bg-emerald-100",
    urgency: "high",
  },
  {
    id: "security",
    label: "Security System",
    icon: Shield,
    keywords: ["security", "alarm"],
    color: "bg-purple-50 border-purple-200 text-purple-700",
    iconBg: "bg-purple-100",
    urgency: "medium",
  },
] as const;

interface EmergencyCircuitsViewProps {
  breakers: Breaker[];
}

export function EmergencyCircuitsView({ breakers }: EmergencyCircuitsViewProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const criticalBreakers = breakers.filter((b) => b.isCritical);

  const matchedByCategory = CRITICAL_CATEGORIES.map((cat) => {
    const matched = criticalBreakers.filter(
      (b) =>
        cat.keywords.some(
          (kw) =>
            b.criticalKeywords.includes(kw) ||
            b.label.toLowerCase().includes(kw) ||
            b.devicesServed.some((d) => d.toLowerCase().includes(kw))
        )
    );
    return { ...cat, breakers: matched };
  });

  // Also show manually marked critical breakers that don't fit categories
  const categorizedBreakerIds = new Set(matchedByCategory.flatMap((c) => c.breakers.map((b) => b.id)));
  const uncategorizedCritical = criticalBreakers.filter((b) => !categorizedBreakerIds.has(b.id));

  // Filter by search
  const filteredBreakers = searchTerm
    ? criticalBreakers.filter(
        (b) =>
          b.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
          b.criticalKeywords.some((k) => k.includes(searchTerm.toLowerCase())) ||
          b.devicesServed.some((d) => d.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : null;

  const getStatusDisplay = (status: Breaker["status"]) => {
    switch (status) {
      case "on":
        return { icon: CheckCircle, color: "text-green-500", label: "ON" };
      case "off":
        return { icon: XCircle, color: "text-gray-400", label: "OFF" };
      case "tripped":
        return { icon: AlertTriangle, color: "text-red-500", label: "TRIPPED" };
      default:
        return { icon: HelpCircle, color: "text-yellow-400", label: "UNKNOWN" };
    }
  };

  const BreakerRow = ({ breaker }: { breaker: Breaker }) => {
    const statusDisplay = getStatusDisplay(breaker.status);
    const StatusIcon = statusDisplay.icon;

    return (
      <Link
        href={`/properties/${breaker.propertyId}/units/${breaker.unitId}/panels/${breaker.panelId}`}
        className={`flex items-center gap-3 p-3 rounded-xl border bg-white shadow-sm hover:shadow-md transition-shadow ${
          breaker.status === "tripped" ? "border-red-300 bg-red-50" : "border-gray-200"
        }`}
      >
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${
            breaker.status === "tripped" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"
          }`}
        >
          #{breaker.slot}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">{breaker.label || "Unlabeled"}</p>
          <p className="text-xs text-gray-500 truncate">
            {breaker.amperage}A · Panel {breaker.panelId.slice(-4)}
          </p>
          {breaker.devicesServed.length > 0 && (
            <p className="text-xs text-gray-400 truncate mt-0.5">{breaker.devicesServed.join(", ")}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-1">
            <StatusIcon className={`w-4 h-4 ${statusDisplay.color}`} />
            <span className={`text-xs font-bold ${statusDisplay.color}`}>{statusDisplay.label}</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>
      </Link>
    );
  };

  return (
    <div className="space-y-4">
      {/* Emergency banner */}
      <div className="bg-red-600 rounded-2xl p-4 text-white">
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle className="w-5 h-5 text-red-200" />
          <h2 className="font-bold text-lg">Emergency Panel View</h2>
        </div>
        <p className="text-red-100 text-sm">
          Critical circuits at a glance. Tap any breaker to navigate to its panel.
        </p>
        <a
          href="tel:911"
          className="mt-3 flex items-center gap-2 bg-white/20 hover:bg-white/30 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors w-fit"
        >
          <Phone className="w-4 h-4" />
          Emergency: 911
        </a>
      </div>

      {/* Search */}
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search critical circuits..."
        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-400 focus:border-transparent outline-none text-sm bg-white shadow-sm"
      />

      {/* Search results */}
      {filteredBreakers !== null ? (
        <div>
          <p className="text-sm text-gray-500 mb-2">
            {filteredBreakers.length} result{filteredBreakers.length !== 1 ? "s" : ""}
          </p>
          <div className="space-y-2">
            {filteredBreakers.map((b) => (
              <BreakerRow key={b.id} breaker={b} />
            ))}
          </div>
        </div>
      ) : criticalBreakers.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-gray-100 rounded-full p-5 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <Shield className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">No critical circuits marked</h3>
          <p className="text-gray-500 text-sm max-w-xs mx-auto">
            Open any breaker and enable &quot;Critical Circuit&quot; to show it here.
          </p>
        </div>
      ) : (
        <>
          {/* Categories */}
          {matchedByCategory
            .filter((cat) => cat.breakers.length > 0)
            .sort((a, b) => {
              const urgencyOrder = { critical: 0, high: 1, medium: 2 };
              return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
            })
            .map((cat) => {
              const Icon = cat.icon;
              return (
                <div key={cat.id} className={`rounded-xl border ${cat.color} p-4`}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`p-2 rounded-xl ${cat.iconBg}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold text-sm">{cat.label}</h3>
                    {cat.urgency === "critical" && (
                      <span className="ml-auto text-xs bg-red-600 text-white px-2 py-0.5 rounded-full font-bold">
                        CRITICAL
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {cat.breakers.map((b) => (
                      <BreakerRow key={b.id} breaker={b} />
                    ))}
                  </div>
                </div>
              );
            })}

          {/* Uncategorized critical */}
          {uncategorizedCritical.length > 0 && (
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
              <h3 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                Other Critical Circuits
              </h3>
              <div className="space-y-2">
                {uncategorizedCritical.map((b) => (
                  <BreakerRow key={b.id} breaker={b} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Tripped alert */}
      {criticalBreakers.some((b) => b.status === "tripped") && (
        <div className="fixed bottom-20 left-4 right-4 bg-red-600 text-white rounded-2xl p-4 shadow-2xl z-50 flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-red-200 flex-shrink-0" />
          <div>
            <p className="font-bold">⚡ Critical breaker tripped!</p>
            <p className="text-red-200 text-sm">
              {criticalBreakers.filter((b) => b.status === "tripped").length} circuit(s) need attention.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
