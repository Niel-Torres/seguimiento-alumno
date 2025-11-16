export interface Exam {
  id: string;
  unit: string;
  topics: string;
  examDate: Date;
  grade?: number;
  createdAt: Date;
}

export function isPassed(grade: number | undefined): boolean | null {
  if (grade === undefined || grade === null) {
    return null; // No evaluado aún
  }
  return grade >= 5;
}

export function getGradeStatus(grade: number | undefined): 'passed' | 'failed' | 'pending' {
  if (grade === undefined || grade === null) {
    return 'pending';
  }
  return grade >= 5 ? 'passed' : 'failed';
}
