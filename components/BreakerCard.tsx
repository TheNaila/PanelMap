"use client";

import { CheckCircle, AlertTriangle, Zap, ZapOff, HelpCircle, Shield } from "lucide-react";
import type { Breaker, BreakerStatus } from "@/types";

const STATUS_CONFIG: Record<
  BreakerStatus,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  on: {
    label: "ON",
    bg: "bg-green-50",
    text: "text-green-800",
    border: "border-green-200",
    dot: "bg-green-500",
  },
  off: {
    label: "OFF",
    bg: "bg-gray-100",
    text: "text-gray-600",
    border: "border-gray-200",
    dot: "bg-gray-400",
  },
  tripped: {
    label: "TRIP",
    bg: "bg-red-50",
    text: "text-red-800",
    border: "border-red-300",
    dot: "bg-red-500",
  },
  unknown: {
    label: "?",
    bg: "bg-yellow-50",
    text: "text-yellow-800",
    border: "border-yellow-200",
    dot: "bg-yellow-400",
  },
};

interface BreakerCardProps {
  breaker: Breaker;
  slot: number;
  isSelected?: boolean;
  isMappingMode?: boolean;
  onClick: () => void;
}

export function BreakerCard({ breaker, slot, isSelected, isMappingMode, onClick }: BreakerCardProps) {
  const config = STATUS_CONFIG[breaker.status];
  const isDouble = breaker.slotsUsed > 1;
  const isCritical = breaker.isCritical;

  return (
    <button
      onClick={onClick}
      className={`
        relative w-full text-left rounded-lg border transition-all duration-150 p-2
        ${config.bg} ${config.border}
        ${isSelected ? "ring-2 ring-blue-500 ring-offset-1 scale-[0.98]" : "hover:shadow-md hover:scale-[0.98]"}
        ${isMappingMode ? "cursor-pointer active:scale-95" : ""}
        ${isDouble ? "row-span-2" : ""}
      `}
      style={{ minHeight: isDouble ? "5rem" : "2.5rem" }}
    >
      {/* Critical indicator */}
      {isCritical && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center z-10">
          <Shield className="w-2.5 h-2.5 text-white" />
        </div>
      )}

      {/* Verified indicator */}
      {breaker.isVerified && (
        <div className="absolute top-1 right-1">
          <CheckCircle className="w-3 h-3 text-green-500" />
        </div>
      )}

      <div className="flex flex-col h-full">
        {/* Slot number and amperage */}
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-[10px] font-bold text-gray-400">#{slot}</span>
          <span className={`text-[10px] font-bold ${config.text}`}>{breaker.amperage}A</span>
        </div>

        {/* Status dot */}
        <div className="flex items-center gap-1 mb-1">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${config.dot}`} />
          <span className={`text-[9px] font-semibold uppercase tracking-wide ${config.text}`}>
            {config.label}
          </span>
          {breaker.status === "tripped" && <AlertTriangle className="w-2.5 h-2.5 text-red-500" />}
        </div>

        {/* Label */}
        <div className="flex-1 flex items-start">
          <p className={`text-[11px] font-medium leading-tight ${config.text} line-clamp-2`}>
            {breaker.label || <span className="text-gray-400 italic">Unlabeled</span>}
          </p>
        </div>

        {/* Type badge */}
        <div className="mt-1">
          <span className={`text-[9px] font-medium px-1 py-0.5 rounded ${config.bg} ${config.text} border ${config.border}`}>
            {breaker.type}
          </span>
        </div>
      </div>
    </button>
  );
}

export function EmptyBreakerSlot({ slot, onClick }: { slot: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-lg border border-dashed border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50 transition-all p-2 group"
      style={{ minHeight: "2.5rem" }}
    >
      <div className="flex flex-col h-full items-center justify-center">
        <span className="text-[10px] text-gray-300 group-hover:text-blue-400">#{slot}</span>
        <span className="text-[9px] text-gray-300 group-hover:text-blue-400 mt-0.5">+ Add</span>
      </div>
    </button>
  );
}
