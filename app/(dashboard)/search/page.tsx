"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { Search, Zap, Plug, Lightbulb, Cpu, Home, Tag, ChevronRight, Loader2, X } from "lucide-react";
import { searchBreakers, searchEndpoints } from "@/lib/firestore";
import { useAuth } from "@/context/AuthContext";
import type { Breaker, CircuitEndpoint } from "@/types";

function debounce<T extends (...args: Parameters<T>) => void>(fn: T, delay: number) {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

export default function SearchPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [breakers, setBreakers] = useState<Breaker[]>([]);
  const [endpoints, setEndpoints] = useState<CircuitEndpoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const doSearch = useCallback(
    debounce(async (term: string) => {
      if (!user || term.length < 2) {
        setBreakers([]);
        setEndpoints([]);
        setHasSearched(false);
        return;
      }
      setLoading(true);
      try {
        const [b, e] = await Promise.all([
          searchBreakers(user.uid, term),
          searchEndpoints(user.uid, term),
        ]);
        setBreakers(b);
        setEndpoints(e);
        setHasSearched(true);
      } finally {
        setLoading(false);
      }
    }, 400),
    [user]
  );

  const handleChange = (val: string) => {
    setQuery(val);
    doSearch(val);
  };

  const clearSearch = () => {
    setQuery("");
    setBreakers([]);
    setEndpoints([]);
    setHasSearched(false);
  };

  const SUGGESTIONS = [
    "kitchen", "refrigerator", "basement", "bathroom", "HVAC",
    "sump pump", "washer", "dryer", "garage",
  ];

  return (
    <div className="px-4 py-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Search Circuits</h1>

      {/* Search input */}
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Search rooms, appliances, labels, notes..."
          className="w-full pl-10 pr-10 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm bg-white shadow-sm"
          autoFocus
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Suggestion chips */}
      {!hasSearched && (
        <div>
          <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Try searching for</p>
          <div className="flex flex-wrap gap-2 mb-6">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => handleChange(s)}
                className="text-sm bg-gray-100 hover:bg-blue-100 hover:text-blue-700 text-gray-600 px-3 py-1.5 rounded-full transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
        </div>
      )}

      {/* Results */}
      {!loading && hasSearched && (
        <div className="space-y-6">
          {/* Breakers */}
          {breakers.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Zap className="w-4 h-4" />
                Breakers ({breakers.length})
              </h2>
              <div className="space-y-2">
                {breakers.map((b) => (
                  <Link
                    key={b.id}
                    href={`/properties/${b.propertyId}/units/${b.unitId}/panels/${b.panelId}`}
                    className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 p-3 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center text-xs font-bold text-yellow-700 flex-shrink-0">
                      #{b.slot}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        {b.label || <span className="text-gray-400 italic">Unlabeled</span>}
                      </p>
                      <p className="text-xs text-gray-500">
                        {b.amperage}A · {b.type}
                        {b.roomsServed.length > 0 && ` · ${b.roomsServed[0]}`}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Endpoints */}
          {endpoints.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Plug className="w-4 h-4" />
                Circuit Endpoints ({endpoints.length})
              </h2>
              <div className="space-y-2">
                {endpoints.map((ep) => (
                  <Link
                    key={ep.id}
                    href={`/properties/${ep.propertyId}/units/${ep.unitId}/panels/${ep.panelId}`}
                    className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 p-3 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Plug className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{ep.name}</p>
                      <p className="text-xs text-gray-500">
                        {ep.type}
                        {ep.room && ` · ${ep.room}`}
                        {ep.location && ` · ${ep.location}`}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* No results */}
          {breakers.length === 0 && endpoints.length === 0 && (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No results for &quot;{query}&quot;</p>
              <p className="text-gray-400 text-sm mt-1">Try searching by room, appliance, or breaker label</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
