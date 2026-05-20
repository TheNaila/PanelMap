"use client";

import { useAuth } from "@/context/AuthContext";
import { useProperties } from "@/hooks/useProperties";
import { PropertySelector } from "@/components/PropertySelector";
import { EmptyState } from "@/components/EmptyState";
import { Home, AlertTriangle, Map, Zap } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { user } = useAuth();
  const { properties, loading } = useProperties(user?.uid);

  return (
    <div className="px-4 py-4 max-w-2xl mx-auto">
      {/* Welcome */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Hi, {user?.displayName?.split(" ")[0] || "there"} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">Manage your electrical panels</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Link
          href="/map-circuit"
          className="flex flex-col items-center gap-2 bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md hover:border-blue-200 transition-all"
        >
          <div className="bg-blue-100 rounded-xl p-2.5">
            <Map className="w-5 h-5 text-blue-600" />
          </div>
          <span className="text-xs font-medium text-gray-700 text-center">Map Circuit</span>
        </Link>

        <Link
          href="/emergency"
          className="flex flex-col items-center gap-2 bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md hover:border-red-200 transition-all"
        >
          <div className="bg-red-100 rounded-xl p-2.5">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <span className="text-xs font-medium text-gray-700 text-center">Emergency</span>
        </Link>

        <Link
          href="/search"
          className="flex flex-col items-center gap-2 bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md hover:border-green-200 transition-all"
        >
          <div className="bg-green-100 rounded-xl p-2.5">
            <Zap className="w-5 h-5 text-green-600" />
          </div>
          <span className="text-xs font-medium text-gray-700 text-center">Find Circuit</span>
        </Link>
      </div>

      {/* Properties */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-xl" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : properties.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <EmptyState
            icon={Home}
            title="No properties yet"
            description="Add your first property to start mapping your electrical panels."
            action={
              <PropertySelector properties={[]} />
            }
          />
        </div>
      ) : (
        <PropertySelector properties={properties} />
      )}
    </div>
  );
}
