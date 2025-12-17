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
import { Company, CompanyRole } from "../types";

const COLLECTION = "companies";

const mapRole = (role: any): CompanyRole => ({
  ...role,
  createdAt: role?.createdAt instanceof Timestamp ? role.createdAt.toDate() : role?.createdAt
});

const mapCompany = (id: string, data: any): Company => ({
  id,
  ...data,
  roles: (data.roles || []).map(mapRole),
  createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
  updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt
});

// Recursively remove undefined values to satisfy Firestore
const stripUndefined = (value: any): any => {
  if (Array.isArray(value)) {
    return value.map(stripUndefined);
  }
  if (value && typeof value === "object") {
    const cleaned: Record<string, any> = {};
    Object.entries(value).forEach(([key, val]) => {
      if (val === undefined) return;
      cleaned[key] = stripUndefined(val);
    });
    return cleaned;
  }
  return value;
};

export const companyService = {
  async getAll(): Promise<Company[]> {
    const q = query(collection(db, COLLECTION), orderBy("name"));
    const snap = await getDocs(q);
    return snap.docs.map(docSnap => mapCompany(docSnap.id, docSnap.data()));
  },

  async create(company: Omit<Company, "id" | "createdAt" | "updatedAt">): Promise<Company> {
    const now = Timestamp.now();
    const payload = stripUndefined({
      ...company,
      createdAt: now,
      updatedAt: now
    });
    const docRef = await addDoc(collection(db, COLLECTION), payload);
    return {
      ...company,
      id: docRef.id,
      createdAt: now.toDate(),
      updatedAt: now.toDate()
    };
  },

  async update(id: string, data: Partial<Company>): Promise<void> {
    const ref = doc(db, COLLECTION, id);
    const now = Timestamp.now();
    const payload = stripUndefined({ ...data, updatedAt: now });
    await updateDoc(ref, payload);
  }
};
