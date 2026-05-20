"use client";

import { useState, useEffect } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Collections } from "@/lib/firestore";
import type { CircuitEndpoint } from "@/types";

export function useEndpoints(breakerId: string | undefined) {
  const [endpoints, setEndpoints] = useState<CircuitEndpoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!breakerId) {
      setEndpoints([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, Collections.CIRCUIT_ENDPOINTS),
      where("breakerId", "==", breakerId),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      setEndpoints(snap.docs.map((d) => ({ id: d.id, ...d.data() } as CircuitEndpoint)));
      setLoading(false);
    });

    return unsubscribe;
  }, [breakerId]);

  return { endpoints, loading };
}
