"use client";

import { useState, useEffect } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Collections } from "@/lib/firestore";
import type { Unit } from "@/types";

export function useUnits(propertyId: string | undefined) {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!propertyId) {
      setUnits([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, Collections.UNITS),
      where("propertyId", "==", propertyId),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setUnits(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Unit)));
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [propertyId]);

  return { units, loading, error };
}
