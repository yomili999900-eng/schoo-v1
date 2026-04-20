import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  serverTimestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ExamPaper, EducationalResource, PaperType } from '../types';

export async function getPapers(classId: string, subjectId: string, type?: PaperType) {
  const papersRef = collection(db, 'papers');
  let q = query(
    papersRef, 
    where('classId', '==', classId),
    where('subjectId', '==', subjectId)
  );

  if (type) {
    q = query(q, where('type', '==', type));
  }

  q = query(q, orderBy('createdAt', 'desc'));

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ExamPaper[];
}

export async function getResources(classId?: string) {
  const resourcesRef = collection(db, 'resources');
  let q = query(resourcesRef, orderBy('createdAt', 'desc'));

  if (classId && classId !== 'all') {
    q = query(q, where('classId', '==', classId));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as EducationalResource[];
}

export async function getAllPapers(limitCount: number = 20) {
  const papersRef = collection(db, 'papers');
  const q = query(papersRef, orderBy('createdAt', 'desc'), limit(limitCount));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ExamPaper[];
}

export async function deletePaper(id: string) {
  const { deleteDoc, doc } = await import('firebase/firestore');
  const paperRef = doc(db, 'papers', id);
  return await deleteDoc(paperRef);
}

export async function addPaper(paper: Omit<ExamPaper, 'id'>) {
  const papersRef = collection(db, 'papers');
  return await addDoc(papersRef, {
    ...paper,
    createdAt: serverTimestamp()
  });
}

export async function addResource(resource: Omit<EducationalResource, 'id'>) {
  const resourcesRef = collection(db, 'resources');
  return await addDoc(resourcesRef, {
    ...resource,
    createdAt: serverTimestamp()
  });
}
