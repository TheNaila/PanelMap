"use client";

import { useState, useEffect } from "react";
import { collection, query, where, orderBy, onSnapshot, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Collections } from "@/lib/firestore";
import type { Panel } from "@/types";

export function usePanels(unitId: string | undefined) {
  const [panels, setPanels] = useState<Panel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!unitId) {
      setPanels([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, Collections.PANELS),
      where("unitId", "==", unitId),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setPanels(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Panel)));
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [unitId]);

  return { panels, loading, error };
}

export function usePanel(panelId: string | undefined) {
  const [panel, setPanel] = useState<Panel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!panelId) {
      setLoading(false);
      return;
    }
    getDoc(doc(db, Collections.PANELS, panelId)).then((snap) => {
      if (snap.exists()) setPanel({ id: snap.id, ...snap.data() } as Panel);
      setLoading(false);
    });
  }, [panelId]);

  return { panel, loading };
}
