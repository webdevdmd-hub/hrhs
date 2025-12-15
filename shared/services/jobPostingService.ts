import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  where
} from "firebase/firestore";
import { db } from "./firebaseConfig";
import { JobApplication, JobPosting } from "../types";

const COLLECTION = "jobPostings";
const APPS_COLLECTION = "jobApplications";

const toPosting = (id: string, data: any): JobPosting => ({
  id,
  ...data,
  createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
  updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt
});

const toApplication = (id: string, data: any): JobApplication => ({
  id,
  ...data,
  notes: (data.notes || []).map((n: any) => ({
    ...n,
    createdAt: n.createdAt instanceof Timestamp ? n.createdAt.toDate() : n.createdAt
  })),
  submittedAt: data.submittedAt instanceof Timestamp ? data.submittedAt.toDate() : data.submittedAt
});

export const jobPostingService = {
  async getAll(): Promise<JobPosting[]> {
    const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(docSnap => toPosting(docSnap.id, docSnap.data()));
  },

  async create(post: Omit<JobPosting, "id" | "createdAt" | "updatedAt">): Promise<JobPosting> {
    const now = Timestamp.now();
    const ref = await addDoc(collection(db, COLLECTION), { ...post, createdAt: now, updatedAt: now });
    return { ...post, id: ref.id, createdAt: now.toDate(), updatedAt: now.toDate() };
  },

  async update(id: string, data: Partial<JobPosting>): Promise<void> {
    const ref = doc(db, COLLECTION, id);
    const now = Timestamp.now();
    await updateDoc(ref, { ...data, updatedAt: now });
  },

  async getApplications(postingId: string): Promise<JobApplication[]> {
    const q = query(collection(db, APPS_COLLECTION), where("postingId", "==", postingId), orderBy("submittedAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(docSnap => toApplication(docSnap.id, docSnap.data()));
  },

  async submitApplication(app: Omit<JobApplication, "id" | "submittedAt"> & { postingId: string }): Promise<JobApplication> {
    const now = Timestamp.now();
    const ref = await addDoc(collection(db, APPS_COLLECTION), { ...app, stage: app.stage || "Applied", submittedAt: now });
    return { ...app, id: ref.id, submittedAt: now.toDate(), stage: app.stage || "Applied" };
  },

  async updateApplication(id: string, data: Partial<JobApplication>): Promise<void> {
    const ref = doc(db, APPS_COLLECTION, id);
    await updateDoc(ref, data);
  }
};
