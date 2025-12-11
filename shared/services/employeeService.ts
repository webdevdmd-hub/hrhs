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
import { Employee } from "../types";

const COLLECTION = "employees";

const toEmployee = (id: string, data: any): Employee => ({
  id,
  ...data,
  createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
  updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt
});

export const employeeService = {
  async getAllEmployees(): Promise<Employee[]> {
    const employeesQuery = query(collection(db, COLLECTION), orderBy("firstName"));
    const snapshot = await getDocs(employeesQuery);
    return snapshot.docs.map(docSnap => toEmployee(docSnap.id, docSnap.data()));
  },

  async addEmployee(payload: Omit<Employee, "id" | "createdAt" | "updatedAt">): Promise<Employee> {
    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...payload,
      createdAt: now,
      updatedAt: now
    });

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
    await updateDoc(ref, { ...data, updatedAt: now });
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
  }
};
