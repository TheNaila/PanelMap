"use client";

import { useState, useEffect } from "react";
import { collection, query, where, orderBy, onSnapshot, doc, onSnapshot as onSnap } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Collections } from "@/lib/firestore";
import type { Breaker } from "@/types";

export function useBreakers(panelId: string | undefined) {
  const [breakers, setBreakers] = useState<Breaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!panelId) {
      setBreakers([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, Collections.BREAKERS),
      where("panelId", "==", panelId),
      orderBy("slot", "asc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setBreakers(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Breaker)));
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [panelId]);

  return { breakers, loading, error };
}

export function useBreaker(breakerId: string | undefined) {
  const [breaker, setBreaker] = useState<Breaker | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!breakerId) {
      setLoading(false);
      return;
    }
    const unsubscribe = onSnap(doc(db, Collections.BREAKERS, breakerId), (snap) => {
      if (snap.exists()) setBreaker({ id: snap.id, ...snap.data() } as Breaker);
      setLoading(false);
    });
    return unsubscribe;
  }, [breakerId]);

  return { breaker, loading };
}

export function useUserBreakers(userId: string | undefined) {
  const [breakers, setBreakers] = useState<Breaker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setBreakers([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, Collections.BREAKERS),
      where("userId", "==", userId),
      where("isCritical", "==", true)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      setBreakers(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Breaker)));
      setLoading(false);
    });

    return unsubscribe;
  }, [userId]);

  return { breakers, loading };
}
