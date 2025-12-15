import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  where,
  limit
} from "firebase/firestore";
import { db } from "./firebaseConfig";
import { OnboardingRecord } from "../types";

const COLLECTION = "onboarding";

const toRecord = (id: string, data: any): OnboardingRecord => ({
  id,
  ...data,
  tasks: data.tasks || [],
  createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
  updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt
});

export const onboardingService = {
  async getByOfferId(offerId: string): Promise<OnboardingRecord | null> {
    const q = query(collection(db, COLLECTION), where("offerId", "==", offerId), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const docSnap = snap.docs[0];
    return toRecord(docSnap.id, docSnap.data());
  },

  async getByBackgroundId(backgroundCheckId: string): Promise<OnboardingRecord | null> {
    const q = query(collection(db, COLLECTION), where("backgroundCheckId", "==", backgroundCheckId), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const docSnap = snap.docs[0];
    return toRecord(docSnap.id, docSnap.data());
  },

  async create(record: Omit<OnboardingRecord, "id" | "createdAt" | "updatedAt">): Promise<OnboardingRecord> {
    const now = Timestamp.now();
    const payload = { ...record, createdAt: now, updatedAt: now };
    const ref = await addDoc(collection(db, COLLECTION), payload);
    return { ...record, id: ref.id, createdAt: now.toDate(), updatedAt: now.toDate() };
  },

  async update(id: string, data: Partial<OnboardingRecord>): Promise<void> {
    const ref = doc(db, COLLECTION, id);
    const now = Timestamp.now();
    await updateDoc(ref, { ...data, updatedAt: now });
  }
};
