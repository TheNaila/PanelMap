"use client";

import { useState, useEffect } from "react";
import { getActivityLog } from "@/lib/firestore";
import { useAuth } from "@/context/AuthContext";
import { Activity, Zap, Home, Building, Plug, Camera, Map } from "lucide-react";
import type { ActivityLog } from "@/types";

const ACTION_CONFIG: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  property_created: { icon: Home, label: "Property added", color: "bg-blue-100 text-blue-600" },
  property_updated: { icon: Home, label: "Property updated", color: "bg-blue-100 text-blue-600" },
  property_deleted: { icon: Home, label: "Property deleted", color: "bg-red-100 text-red-600" },
  unit_created: { icon: Building, label: "Unit added", color: "bg-indigo-100 text-indigo-600" },
  unit_updated: { icon: Building, label: "Unit updated", color: "bg-indigo-100 text-indigo-600" },
  panel_created: { icon: Zap, label: "Panel added", color: "bg-yellow-100 text-yellow-600" },
  panel_updated: { icon: Zap, label: "Panel updated", color: "bg-yellow-100 text-yellow-600" },
  breaker_created: { icon: Zap, label: "Breaker added", color: "bg-orange-100 text-orange-600" },
  breaker_updated: { icon: Zap, label: "Breaker updated", color: "bg-orange-100 text-orange-600" },
  breaker_mapped: { icon: Map, label: "Circuit mapped", color: "bg-green-100 text-green-600" },
  endpoint_created: { icon: Plug, label: "Endpoint added", color: "bg-purple-100 text-purple-600" },
  endpoint_updated: { icon: Plug, label: "Endpoint updated", color: "bg-purple-100 text-purple-600" },
  photo_uploaded: { icon: Camera, label: "Photo uploaded", color: "bg-pink-100 text-pink-600" },
};

function timeAgo(ts: { seconds: number } | null | undefined): string {
  if (!ts) return "";
  const now = Date.now() / 1000;
  const diff = now - ts.seconds;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function ActivityPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getActivityLog(user.uid).then((data) => {
      setLogs(data.slice(0, 50));
      setLoading(false);
    });
  }, [user]);

  return (
    <div className="px-4 py-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Activity className="w-6 h-6 text-gray-600" />
        <h1 className="text-2xl font-bold text-gray-900">Activity Log</h1>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border p-3 animate-pulse flex gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-xl" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-1" />
                <div className="h-3 bg-gray-200 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No activity yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => {
            const config = ACTION_CONFIG[log.action] || {
              icon: Activity,
              label: log.action,
              color: "bg-gray-100 text-gray-600",
            };
            const Icon = config.icon;
            const detailStr = Object.entries(log.details || {})
              .map(([k, v]) => `${v}`)
              .filter(Boolean)
              .join(" · ");

            return (
              <div key={log.id} className="bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-3 shadow-sm">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${config.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{config.label}</p>
                  {detailStr && (
                    <p className="text-xs text-gray-500 truncate">{detailStr}</p>
                  )}
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {timeAgo(log.createdAt as unknown as { seconds: number })}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
