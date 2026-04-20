import { 
  collection, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  writeBatch,
  getDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ClassLevel, Subject } from '@/types';
import { CLASSES as INITIAL_CLASSES, SUBJECTS as INITIAL_SUBJECTS } from '@/constants';

const CLASSES_COLLECTION = 'classes';
const SUBJECTS_COLLECTION = 'subjects';

export async function getClasses(): Promise<ClassLevel[]> {
  const q = query(collection(db, CLASSES_COLLECTION), orderBy('name', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassLevel));
}

export async function addClass(classData: Omit<ClassLevel, 'id'>) {
  return await addDoc(collection(db, CLASSES_COLLECTION), classData);
}

export async function deleteClass(id: string) {
  await deleteDoc(doc(db, CLASSES_COLLECTION, id));
}

export async function getSubjects(): Promise<Subject[]> {
  const q = query(collection(db, SUBJECTS_COLLECTION), orderBy('name', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subject));
}

export async function addSubject(subjectData: Omit<Subject, 'id'>) {
  return await addDoc(collection(db, SUBJECTS_COLLECTION), subjectData);
}

export async function deleteSubject(id: string) {
  await deleteDoc(doc(db, SUBJECTS_COLLECTION, id));
}

export async function bootstrapMetadata() {
  // Disabled automatic population of metadata
  return;
}
