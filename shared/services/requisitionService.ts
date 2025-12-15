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
import { JobRequisition } from "../types";

const COLLECTION = "requisitions";

const toRequisition = (id: string, data: any): JobRequisition => ({
  id,
  ...data,
  createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
  updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
  approvals: data.approvals || [],
  timeline: data.timeline || []
});

export const requisitionService = {
  async getAll(): Promise<JobRequisition[]> {
    const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(docSnap => toRequisition(docSnap.id, docSnap.data()));
  },

  async create(req: Omit<JobRequisition, "id" | "createdAt" | "updatedAt">): Promise<JobRequisition> {
    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...req,
      createdAt: now,
      updatedAt: now
    });
    return { ...req, id: docRef.id, createdAt: now.toDate(), updatedAt: now.toDate() };
  },

  async update(id: string, data: Partial<JobRequisition>): Promise<void> {
    const ref = doc(db, COLLECTION, id);
    const now = Timestamp.now();
    await updateDoc(ref, { ...data, updatedAt: now });
  }
};
