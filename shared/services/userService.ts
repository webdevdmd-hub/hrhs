import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  Timestamp,
  setDoc,
  getDoc
} from "firebase/firestore";
import { db } from "./firebaseConfig";
import { User, Role } from "../types";

const USERS_COLLECTION = "users";

export const userService = {
  // Fetch all users
  async getAllUsers(): Promise<User[]> {
    try {
      const q = query(collection(db, USERS_COLLECTION), orderBy("firstName"));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Convert Firestore Timestamps to Date objects if necessary
          lastCheckIn: data.lastCheckIn instanceof Timestamp ? data.lastCheckIn.toDate() : data.lastCheckIn
        } as User;
      });
    } catch (error) {
      console.error("Error fetching users:", error);
      throw error;
    }
  },

  // Add a new user
  async addUser(user: Omit<User, "id">): Promise<User> {
    try {
      const docRef = await addDoc(collection(db, USERS_COLLECTION), {
        ...user,
        createdAt: Timestamp.now()
      });
      return { id: docRef.id, ...user };
    } catch (error) {
      console.error("Error adding user:", error);
      throw error;
    }
  },

  // Add a new user with a specific ID (e.g., Firebase Auth UID)
  async addUserWithId(userId: string, user: Omit<User, "id">): Promise<User> {
    try {
      await setDoc(doc(db, USERS_COLLECTION, userId), {
        ...user,
        createdAt: Timestamp.now()
      });
      return { id: userId, ...user };
    } catch (error) {
      console.error("Error adding user with provided ID:", error);
      throw error;
    }
  },

  // Fetch a single user by ID
  async getUserById(userId: string): Promise<User | null> {
    try {
      const userRef = doc(db, USERS_COLLECTION, userId);
      const docSnap = await getDoc(userRef);
      if (!docSnap.exists()) return null;

      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        lastCheckIn: data.lastCheckIn instanceof Timestamp ? data.lastCheckIn.toDate() : data.lastCheckIn
      } as User;
    } catch (error) {
      console.error("Error fetching user by ID:", error);
      throw error;
    }
  },

  // Update an existing user
  async updateUser(userId: string, data: Partial<User>): Promise<void> {
    try {
      const userRef = doc(db, USERS_COLLECTION, userId);
      await updateDoc(userRef, data);
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  },

  // Delete a user
  async deleteUser(userId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, USERS_COLLECTION, userId));
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  }
};
