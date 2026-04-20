/**
 * Types for EduDoc Application
 */

export type SchoolLevel = 'Collège' | 'Lycée';

export interface ClassLevel {
  id: string;
  name: string;
  level: SchoolLevel;
}

export interface Subject {
  id: string;
  name: string;
  icon?: string;
  classIds: string[]; // Associated classes
}

export type PaperType = 'apprentissage' | 'examen';

export interface ExamPaper {
  id: string;
  title: string;
  classId: string;
  subjectId: string;
  type: PaperType;
  subjectUrl: string; // URL to DOCX
  correctionUrl: string; // URL to DOCX
  createdAt: string;
}

export interface EducationalResource {
  id: string;
  title: string;
  description: string;
  url: string;
  type: 'annale' | 'cours' | 'exercice';
  classId: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'student' | 'admin';
  isPremium: boolean;
  premiumUntil?: string;
  freeAccessCount: number; // For tracking the 1 free paper limit
}
