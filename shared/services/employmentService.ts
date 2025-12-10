import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  Timestamp 
} from "firebase/firestore";
import { db } from "./firebaseConfig";
import { EmploymentDetails } from "../types";

const COLLECTION = "employmentDetails";

const toEmployment = (id: string, data: any): EmploymentDetails => ({
  userId: id,
  ...data,
  createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
  updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt
});

export const employmentService = {
  async getByUserId(userId: string): Promise<EmploymentDetails | null> {
    const ref = doc(db, COLLECTION, userId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return toEmployment(snap.id, snap.data());
  },

  async getAll(): Promise<EmploymentDetails[]> {
    const querySnapshot = await getDocs(collection(db, COLLECTION));
    return querySnapshot.docs.map(docSnap => toEmployment(docSnap.id, docSnap.data()));
  },

  async upsert(userId: string, details: EmploymentDetails): Promise<EmploymentDetails> {
    const now = Timestamp.now();
    await setDoc(doc(db, COLLECTION, userId), {
      ...details,
      userId,
      updatedAt: now,
      createdAt: details.createdAt ? details.createdAt : now
    }, { merge: true });
    return { ...details, userId };
  }
};
