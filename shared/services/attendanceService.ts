import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  addDoc,
  updateDoc,
  Timestamp
} from "firebase/firestore";
import { db } from "./firebaseConfig";
import { AttendanceRecord } from "../types";

const COLLECTION = "attendance";

const toRecord = (id: string, data: any): AttendanceRecord => ({
  id,
  ...data,
  createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
  updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt
});

export const attendanceService = {
  async getByUserAndRange(userId: string, from: string, to: string): Promise<AttendanceRecord[]> {
    const q = query(
      collection(db, COLLECTION),
      where("userId", "==", userId),
      where("date", ">=", from),
      where("date", "<=", to),
      orderBy("date", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map(docSnap => toRecord(docSnap.id, docSnap.data()));
  },

  async getById(id: string): Promise<AttendanceRecord | null> {
    const ref = doc(db, COLLECTION, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return toRecord(snap.id, snap.data());
  },

  async upsert(record: Omit<AttendanceRecord, "id" | "createdAt" | "updatedAt"> & { id?: string }): Promise<string> {
    const now = Timestamp.now();
    if (record.id) {
      const ref = doc(db, COLLECTION, record.id);
      await updateDoc(ref, { ...record, updatedAt: now });
      return record.id;
    }
    const docRef = await addDoc(collection(db, COLLECTION), { ...record, createdAt: now, updatedAt: now });
    return docRef.id;
  }
};
