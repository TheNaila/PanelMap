"use client";

import { useState } from "react";
import {
  Zap, ZapOff, CheckCircle, ArrowRight, ArrowLeft, Plus, Trash2,
  AlertTriangle, Lightbulb, Plug, Cpu, Flame, Grid, HelpCircle,
} from "lucide-react";
import { createCircuitEndpoint, updateBreaker } from "@/lib/firestore";
import { useAuth } from "@/context/AuthContext";
import type { Breaker, EndpointType, CircuitEndpoint } from "@/types";
import { Timestamp } from "firebase/firestore";

type WizardStep = "select" | "turn_off" | "record" | "confirm";

interface PendingEndpoint {
  type: EndpointType;
  name: string;
  room: string;
  location: string;
}

const ENDPOINT_ICONS: Record<EndpointType, React.ElementType> = {
  outlet: Plug,
  light: Lightbulb,
  appliance: Cpu,
  hvac: Flame,
  fixture: Grid,
  room: Grid,
  other: HelpCircle,
};

interface MappingWizardProps {
  breakers: Breaker[];
  onComplete?: () => void;
  initialBreakerId?: string;
}

export function MappingWizard({ breakers, onComplete, initialBreakerId }: MappingWizardProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<WizardStep>(initialBreakerId ? "turn_off" : "select");
  const [selectedBreaker, setSelectedBreaker] = useState<Breaker | null>(
    initialBreakerId ? breakers.find((b) => b.id === initialBreakerId) || null : null
  );
  const [pendingEndpoints, setPendingEndpoints] = useState<PendingEndpoint[]>([]);
  const [newEndpoint, setNewEndpoint] = useState<PendingEndpoint>({
    type: "outlet",
    name: "",
    room: "",
    location: "",
  });
  const [saving, setSaving] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleSelectBreaker = (breaker: Breaker) => {
    setSelectedBreaker(breaker);
    setStep("turn_off");
    setPendingEndpoints([]);
  };

  const handleAddEndpoint = () => {
    if (!newEndpoint.name.trim()) return;
    setPendingEndpoints((prev) => [...prev, { ...newEndpoint }]);
    setNewEndpoint({ type: "outlet", name: "", room: "", location: "" });
  };

  const handleRemoveEndpoint = (index: number) => {
    setPendingEndpoints((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveMapping = async () => {
    if (!user || !selectedBreaker) return;
    setSaving(true);
    try {
      for (const ep of pendingEndpoints) {
        await createCircuitEndpoint(
          user.uid,
          selectedBreaker.id,
          selectedBreaker.panelId,
          selectedBreaker.unitId,
          selectedBreaker.propertyId,
          {
            ...ep,
            notes: "",
            isVerified: true,
            verifiedAt: Timestamp.now(),
            photoIds: [],
          }
        );
      }
      // Mark breaker as verified
      await updateBreaker(selectedBreaker.id, user.uid, selectedBreaker.propertyId, {
        isVerified: true,
        verifiedAt: Timestamp.now(),
      });
      setStep("confirm");
      setConfirmed(true);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setStep("select");
    setSelectedBreaker(null);
    setPendingEndpoints([]);
    setConfirmed(false);
    setNewEndpoint({ type: "outlet", name: "", room: "", location: "" });
  };

  return (
    <div className="max-w-lg mx-auto">
      {/* Step indicator */}
      <div className="flex items-center justify-between mb-6">
        {(["select", "turn_off", "record", "confirm"] as WizardStep[]).map((s, i) => {
          const stepLabels: Record<WizardStep, string> = {
            select: "Select",
            turn_off: "Turn Off",
            record: "Record",
            confirm: "Done",
          };
          const isCompleted =
            (s === "select" && ["turn_off", "record", "confirm"].includes(step)) ||
            (s === "turn_off" && ["record", "confirm"].includes(step)) ||
            (s === "record" && step === "confirm");
          const isCurrent = s === step;

          return (
            <div key={s} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-shrink-0">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    isCompleted
                      ? "bg-green-500 text-white"
                      : isCurrent
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {isCompleted ? <CheckCircle className="w-4 h-4" /> : i + 1}
                </div>
                <span
                  className={`text-[10px] mt-1 font-medium ${
                    isCurrent ? "text-blue-600" : isCompleted ? "text-green-600" : "text-gray-400"
                  }`}
                >
                  {stepLabels[s]}
                </span>
              </div>
              {i < 3 && (
                <div
                  className={`flex-1 h-0.5 mx-2 rounded ${
                    isCompleted ? "bg-green-400" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step: Select Breaker */}
      {step === "select" && (
        <div>
          <div className="text-center mb-6">
            <div className="bg-blue-100 rounded-full p-4 w-16 h-16 flex items-center justify-center mx-auto mb-3">
              <Zap className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Select a Breaker</h2>
            <p className="text-gray-500 text-sm mt-1">
              Choose which breaker you want to map. You&apos;ll turn it off and record what loses power.
            </p>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {breakers
              .filter((b) => b.type !== "main")
              .sort((a, b) => a.slot - b.slot)
              .map((breaker) => (
                <button
                  key={breaker.id}
                  onClick={() => handleSelectBreaker(breaker)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all hover:shadow-sm ${
                    breaker.isVerified
                      ? "border-green-200 bg-green-50"
                      : "border-gray-200 bg-white hover:border-blue-300"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      breaker.isVerified ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    #{breaker.slot}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {breaker.label || "Unlabeled"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {breaker.amperage}A · {breaker.type}
                    </p>
                  </div>
                  {breaker.isVerified ? (
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  ) : (
                    <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  )}
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Step: Turn Off */}
      {step === "turn_off" && selectedBreaker && (
        <div className="text-center">
          <div className="bg-orange-100 rounded-full p-5 w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <ZapOff className="w-10 h-10 text-orange-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Turn Off Breaker</h2>

          <div className="bg-gray-800 rounded-2xl p-5 mb-6 text-white text-left">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-orange-400 rounded-xl w-12 h-12 flex items-center justify-center text-lg font-bold text-gray-900">
                #{selectedBreaker.slot}
              </div>
              <div>
                <p className="font-bold text-lg">{selectedBreaker.label || "Unlabeled"}</p>
                <p className="text-gray-300 text-sm">{selectedBreaker.amperage}A · {selectedBreaker.type}</p>
              </div>
            </div>
            {selectedBreaker.roomsServed.length > 0 && (
              <p className="text-gray-300 text-sm">
                Likely affects: {selectedBreaker.roomsServed.join(", ")}
              </p>
            )}
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-left">
            <div className="flex gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Before you flip the breaker</p>
                <ul className="text-sm text-amber-700 mt-1 space-y-0.5 list-disc list-inside">
                  <li>Save any open work on computers</li>
                  <li>Note time-sensitive appliances (stove, oven)</li>
                  <li>Have a flashlight ready if basement or closet</li>
                </ul>
              </div>
            </div>
          </div>

          <p className="text-gray-600 text-sm mb-6">
            Go to your electrical panel and flip breaker <strong>#{selectedBreaker.slot}</strong> to the OFF position, then come back here.
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => setStep("select")}
              className="flex items-center gap-2 border border-gray-200 text-gray-600 px-4 py-3 rounded-xl text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={() => setStep("record")}
              className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-3 rounded-xl text-sm font-bold transition-colors"
            >
              I turned it off <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step: Record Endpoints */}
      {step === "record" && selectedBreaker && (
        <div>
          <div className="text-center mb-5">
            <div className="bg-purple-100 rounded-full p-4 w-16 h-16 flex items-center justify-center mx-auto mb-3">
              <Plug className="w-8 h-8 text-purple-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">What lost power?</h2>
            <p className="text-gray-500 text-sm mt-1">
              Walk through the space and record every outlet, light, and appliance that is now off.
            </p>
          </div>

          {/* Recorded list */}
          {pendingEndpoints.length > 0 && (
            <div className="bg-gray-50 rounded-xl border border-gray-100 p-3 mb-4 space-y-2">
              {pendingEndpoints.map((ep, i) => {
                const Icon = ENDPOINT_ICONS[ep.type];
                return (
                  <div key={i} className="flex items-center gap-2 group">
                    <Icon className="w-4 h-4 text-purple-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{ep.name}</p>
                      {(ep.room || ep.location) && (
                        <p className="text-xs text-gray-500">
                          {[ep.room, ep.location].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveEndpoint(i)}
                      className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add endpoint form */}
          <div className="bg-purple-50 rounded-xl border border-purple-100 p-3 space-y-3 mb-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                What is it?
              </label>
              <div className="grid grid-cols-4 gap-1">
                {(Object.entries(ENDPOINT_ICONS) as [EndpointType, React.ElementType][]).map(
                  ([type, Icon]) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setNewEndpoint({ ...newEndpoint, type })}
                      className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all text-xs ${
                        newEndpoint.type === type
                          ? "border-purple-400 bg-purple-100 text-purple-700"
                          : "border-gray-200 bg-white text-gray-500 hover:border-purple-200"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-[9px] capitalize">{type}</span>
                    </button>
                  )
                )}
              </div>
            </div>

            <div>
              <input
                type="text"
                value={newEndpoint.name}
                onChange={(e) => setNewEndpoint({ ...newEndpoint, name: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && handleAddEndpoint()}
                placeholder="Name (e.g. Outlet by sink, Overhead light)"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-purple-400 outline-none text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={newEndpoint.room}
                onChange={(e) => setNewEndpoint({ ...newEndpoint, room: e.target.value })}
                placeholder="Room"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-purple-400 outline-none text-sm"
              />
              <input
                type="text"
                value={newEndpoint.location}
                onChange={(e) => setNewEndpoint({ ...newEndpoint, location: e.target.value })}
                placeholder="Location (e.g. NW wall)"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-purple-400 outline-none text-sm"
              />
            </div>

            <button
              type="button"
              onClick={handleAddEndpoint}
              disabled={!newEndpoint.name.trim()}
              className="w-full flex items-center justify-center gap-1.5 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add to List
            </button>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep("turn_off")}
              className="flex items-center gap-2 border border-gray-200 text-gray-600 px-4 py-3 rounded-xl text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={handleSaveMapping}
              disabled={pendingEndpoints.length === 0 || saving}
              className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-4 py-3 rounded-xl text-sm font-bold transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              {saving ? "Saving..." : `Save ${pendingEndpoints.length} Endpoint${pendingEndpoints.length !== 1 ? "s" : ""}`}
            </button>
          </div>
        </div>
      )}

      {/* Step: Confirm */}
      {step === "confirm" && selectedBreaker && (
        <div className="text-center">
          <div className="bg-green-100 rounded-full p-5 w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Circuit Mapped!</h2>
          <p className="text-gray-500 text-sm mb-6">
            Breaker <strong>#{selectedBreaker.slot}</strong> ({selectedBreaker.label || "Unlabeled"}) has been mapped with{" "}
            <strong>{pendingEndpoints.length} endpoint{pendingEndpoints.length !== 1 ? "s" : ""}</strong> and marked as verified.
          </p>

          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 text-left">
            <p className="text-sm font-semibold text-green-800 mb-2">
              🔌 Remember to turn the breaker back ON!
            </p>
            <p className="text-sm text-green-700">
              Go back to your panel and flip breaker #{selectedBreaker.slot} to the ON position.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="flex-1 border border-gray-200 text-gray-700 py-3 rounded-xl text-sm font-medium hover:bg-gray-50"
            >
              Map Another
            </button>
            {onComplete && (
              <button
                onClick={onComplete}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-sm font-bold"
              >
                Done
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
