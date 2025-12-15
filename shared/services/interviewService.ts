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
import { Interview } from "../types";

const COLLECTION = "interviews";

const toInterview = (id: string, data: any): Interview => ({
  id,
  ...data,
  interviewers: data.interviewers || [],
  feedback: (data.feedback || []).map((f: any) => ({
    ...f,
    submittedAt: f.submittedAt instanceof Timestamp ? f.submittedAt.toDate() : f.submittedAt
  })),
  createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
  updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt
});

export const interviewService = {
  async getAll(): Promise<Interview[]> {
    const q = query(collection(db, COLLECTION), orderBy("date", "asc"));
    const snap = await getDocs(q);
    return snap.docs.map(docSnap => toInterview(docSnap.id, docSnap.data()));
  },

  async create(interview: Omit<Interview, "id" | "createdAt" | "updatedAt">): Promise<Interview> {
    const now = Timestamp.now();
    const payload = { ...interview, createdAt: now, updatedAt: now };
    const ref = await addDoc(collection(db, COLLECTION), payload);
    return { ...interview, id: ref.id, createdAt: now.toDate(), updatedAt: now.toDate() };
  },

  async update(id: string, data: Partial<Interview>): Promise<void> {
    const ref = doc(db, COLLECTION, id);
    const now = Timestamp.now();
    await updateDoc(ref, { ...data, updatedAt: now });
  }
};
