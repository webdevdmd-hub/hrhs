import {
  addDoc,
  collection,
  doc,
  deleteDoc,
  getDocs,
  orderBy,
  query,
  Timestamp,
  updateDoc
} from "firebase/firestore";
import { db } from "./firebaseConfig";
import { Employee } from "../types";

const COLLECTION = "employees";

const toEmployee = (id: string, data: any): Employee => ({
  id,
  ...data,
  createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
  updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt
});

// Remove undefined values recursively to satisfy Firestore
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

export const employeeService = {
  async getAllEmployees(): Promise<Employee[]> {
    const employeesQuery = query(collection(db, COLLECTION), orderBy("firstName"));
    const snapshot = await getDocs(employeesQuery);
    return snapshot.docs.map(docSnap => toEmployee(docSnap.id, docSnap.data()));
  },

  async addEmployee(payload: Omit<Employee, "id" | "createdAt" | "updatedAt">): Promise<Employee> {
    const now = Timestamp.now();
    const docRef = await addDoc(
      collection(db, COLLECTION),
      stripUndefined({
        ...payload,
        createdAt: now,
        updatedAt: now
      })
    );

    return {
      id: docRef.id,
      ...payload,
      createdAt: now.toDate(),
      updatedAt: now.toDate()
    };
  },

  async updateEmployee(id: string, data: Partial<Employee>): Promise<void> {
    const ref = doc(db, COLLECTION, id);
    const now = Timestamp.now();
    const payload = stripUndefined({ ...data, updatedAt: now });
    await updateDoc(ref, payload);
  },

  async markInactive(id: string, dateOfExit?: string): Promise<void> {
    const ref = doc(db, COLLECTION, id);
    const now = Timestamp.now();
    await updateDoc(ref, {
      employmentStatus: "inactive",
      onboardingStatus: "Inactive",
      dateOfExit: dateOfExit || new Date().toISOString().slice(0, 10),
      updatedAt: now
    });
  },

  async deleteEmployee(id: string): Promise<void> {
    const ref = doc(db, COLLECTION, id);
    await deleteDoc(ref);
  }
};
