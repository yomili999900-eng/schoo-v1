import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  query, 
  where,
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { EducationalResource } from '../types';

const COLLECTION_NAME = 'resources';

export async function addResource(resource: Omit<EducationalResource, 'id'>) {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...resource,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding resource:", error);
    throw error;
  }
}

export async function getResources(classId?: string) {
  try {
    let q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
    
    if (classId) {
      q = query(q, where('classId', '==', classId));
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as EducationalResource[];
  } catch (error) {
    console.error("Error getting resources:", error);
    throw error;
  }
}

export async function deleteResource(id: string) {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    console.error("Error deleting resource:", error);
    throw error;
  }
}
