import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  Timestamp,
  updateDoc
} from "firebase/firestore";
import { db } from "./firebaseConfig";
import { BackgroundCheck } from "../types";

const COLLECTION = "backgroundChecks";

const toCheck = (id: string, data: any): BackgroundCheck => ({
  id,
  ...data,
  audit: data.audit || [],
  attachments: data.attachments || [],
  createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
  updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
  consentAt: data.consentAt instanceof Timestamp ? data.consentAt.toDate() : data.consentAt,
  startedAt: data.startedAt instanceof Timestamp ? data.startedAt.toDate() : data.startedAt,
  completedAt: data.completedAt instanceof Timestamp ? data.completedAt.toDate() : data.completedAt
});

export const backgroundService = {
  async getAll(): Promise<BackgroundCheck[]> {
    const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(docSnap => toCheck(docSnap.id, docSnap.data()));
  },

  async create(check: Omit<BackgroundCheck, "id" | "createdAt" | "updatedAt">): Promise<BackgroundCheck> {
    const now = Timestamp.now();
    const payload = { ...check, createdAt: now, updatedAt: now };
    const ref = await addDoc(collection(db, COLLECTION), payload);
    return { ...check, id: ref.id, createdAt: now.toDate(), updatedAt: now.toDate() };
  },

  async update(id: string, data: Partial<BackgroundCheck>): Promise<void> {
    const ref = doc(db, COLLECTION, id);
    const now = Timestamp.now();
    await updateDoc(ref, { ...data, updatedAt: now });
  }
};
