"use client";

import { useState, useMemo } from "react";
import { BreakerCard, EmptyBreakerSlot } from "./BreakerCard";
import type { Breaker, Panel } from "@/types";

interface PanelGridProps {
  panel: Panel;
  breakers: Breaker[];
  isMappingMode?: boolean;
  selectedBreakerId?: string;
  onBreakerClick: (breaker: Breaker | null, slot: number) => void;
}

export function PanelGrid({
  panel,
  breakers,
  isMappingMode,
  selectedBreakerId,
  onBreakerClick,
}: PanelGridProps) {
  // Build a slot map for O(1) lookup
  const slotMap = useMemo(() => {
    const map = new Map<number, Breaker>();
    for (const b of breakers) {
      for (let i = 0; i < b.slotsUsed; i++) {
        map.set(b.slot + i, b);
      }
    }
    return map;
  }, [breakers]);

  const totalSlots = panel.totalSlots || 40;
  // Panel renders in two columns (left/right bus)
  // Slots 1,3,5... on left; 2,4,6... on right
  const leftSlots: number[] = [];
  const rightSlots: number[] = [];
  for (let i = 1; i <= totalSlots; i++) {
    if (i % 2 === 1) leftSlots.push(i);
    else rightSlots.push(i);
  }

  // Track which slots to skip (occupied by a double-pole breaker's second slot)
  const skipSlots = new Set<number>();
  for (const b of breakers) {
    if (b.slotsUsed > 1) {
      for (let i = 1; i < b.slotsUsed; i++) {
        skipSlots.add(b.slot + i);
      }
    }
  }

  const renderSlot = (slot: number) => {
    if (skipSlots.has(slot)) return null;
    const breaker = slotMap.get(slot);
    if (breaker && breaker.slot === slot) {
      return (
        <BreakerCard
          key={slot}
          breaker={breaker}
          slot={slot}
          isSelected={selectedBreakerId === breaker.id}
          isMappingMode={isMappingMode}
          onClick={() => onBreakerClick(breaker, slot)}
        />
      );
    }
    return (
      <EmptyBreakerSlot
        key={slot}
        slot={slot}
        onClick={() => onBreakerClick(null, slot)}
      />
    );
  };

  return (
    <div className="bg-gray-800 rounded-xl p-3 shadow-inner">
      {/* Panel header */}
      <div className="text-center mb-3">
        <div className="bg-gray-700 rounded-lg py-1.5 px-4">
          <p className="text-white text-xs font-bold uppercase tracking-widest">{panel.name}</p>
          <p className="text-gray-400 text-[10px] mt-0.5">
            {panel.amperage}A · {panel.voltage} · {panel.phases === 3 ? "3-Phase" : "Single Phase"}
          </p>
        </div>
      </div>

      {/* Main breaker indicator */}
      <div className="flex justify-center mb-3">
        <div className="bg-gray-600 rounded-lg px-6 py-1.5 border border-gray-500">
          <p className="text-gray-300 text-[10px] font-semibold uppercase tracking-wide text-center">
            Main Breaker — {panel.amperage}A
          </p>
        </div>
      </div>

      {/* Bus bar */}
      <div className="flex gap-2">
        {/* Left column (odd slots) */}
        <div className="flex-1 grid gap-1.5">
          <div className="text-[9px] text-gray-500 font-medium text-center uppercase tracking-wide mb-1">
            L1
          </div>
          {leftSlots.map((slot) => (
            <div key={slot}>{renderSlot(slot)}</div>
          ))}
        </div>

        {/* Center divider */}
        <div className="w-4 flex flex-col items-center">
          <div className="text-[9px] text-gray-600 mb-1">·</div>
          {leftSlots.map((_, i) => (
            <div
              key={i}
              className="flex-1 w-0.5 bg-gray-600 my-0.5 rounded-full min-h-[2.5rem]"
            />
          ))}
        </div>

        {/* Right column (even slots) */}
        <div className="flex-1 grid gap-1.5">
          <div className="text-[9px] text-gray-500 font-medium text-center uppercase tracking-wide mb-1">
            L2
          </div>
          {rightSlots.map((slot) => (
            <div key={slot}>{renderSlot(slot)}</div>
          ))}
        </div>
      </div>

      {/* Neutral/Ground bar */}
      <div className="mt-3 bg-gray-700 rounded-lg py-1.5 px-4 text-center">
        <p className="text-gray-400 text-[9px] uppercase tracking-widest">
          Neutral · Ground Bus
        </p>
      </div>
    </div>
  );
}
