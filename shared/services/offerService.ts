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
import { Offer } from "../types";

const COLLECTION = "offers";

const toOffer = (id: string, data: any): Offer => ({
  id,
  ...data,
  approvals: data.approvals || [],
  createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
  updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt
});

export const offerService = {
  async getAll(): Promise<Offer[]> {
    const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(docSnap => toOffer(docSnap.id, docSnap.data()));
  },

  async create(offer: Omit<Offer, "id" | "createdAt" | "updatedAt">): Promise<Offer> {
    const now = Timestamp.now();
    const payload = { ...offer, createdAt: now, updatedAt: now };
    const ref = await addDoc(collection(db, COLLECTION), payload);
    return { ...offer, id: ref.id, createdAt: now.toDate(), updatedAt: now.toDate() };
  },

  async update(id: string, data: Partial<Offer>): Promise<void> {
    const ref = doc(db, COLLECTION, id);
    const now = Timestamp.now();
    await updateDoc(ref, { ...data, updatedAt: now });
  }
};
