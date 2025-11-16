import { Component, OnInit } from '@angular/core';
import { DataService } from '../../services/data.service';
import { Exam, getGradeStatus } from '../../models/exam.model';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-exams',
  templateUrl: './exams.component.html',
  styleUrls: ['./exams.component.css']
})
export class ExamsComponent implements OnInit {
  exams$: Observable<Exam[]>;

  showAddForm = false;
  editingExam: Exam | null = null;

  newExam: Partial<Exam> = {
    unit: '',
    topics: '',
    examDate: undefined,
    grade: undefined
  };

  constructor(private dataService: DataService) {
    this.exams$ = this.dataService.getExams();
  }

  ngOnInit(): void {
  }

  showAddExamForm(): void {
    this.showAddForm = true;
    this.editingExam = null;
    this.resetNewExam();
  }

  hideAddExamForm(): void {
    this.showAddForm = false;
    this.resetNewExam();
  }

  resetNewExam(): void {
    this.newExam = {
      unit: '',
      topics: '',
      examDate: undefined,
      grade: undefined
    };
  }

  async addExam(): Promise<void> {
    if (this.newExam.unit && this.newExam.topics && this.newExam.examDate) {
      const exam: Exam = {
        id: Date.now().toString(),
        unit: this.newExam.unit,
        topics: this.newExam.topics,
        examDate: new Date(this.newExam.examDate),
        grade: this.newExam.grade,
        createdAt: new Date()
      };

      await this.dataService.addExam(exam);
      this.hideAddExamForm();
    }
  }

  editExam(exam: Exam): void {
    this.editingExam = { ...exam };
    this.showAddForm = true;
    this.newExam = {
      unit: exam.unit,
      topics: exam.topics,
      examDate: exam.examDate,
      grade: exam.grade
    };
  }

  async updateExam(): Promise<void> {
    if (this.editingExam && this.newExam.unit && this.newExam.topics && this.newExam.examDate) {
      const updatedExam: Exam = {
        ...this.editingExam,
        unit: this.newExam.unit,
        topics: this.newExam.topics,
        examDate: new Date(this.newExam.examDate),
        grade: this.newExam.grade
      };

      await this.dataService.updateExam(updatedExam);
      this.hideAddExamForm();
      this.editingExam = null;
    }
  }

  async deleteExam(id: string): Promise<void> {
    if (confirm('¿Estas segura de que quieres eliminar este examen?')) {
      await this.dataService.deleteExam(id);
    }
  }

  getGradeStatus(grade: number | undefined): 'passed' | 'failed' | 'pending' {
    return getGradeStatus(grade);
  }

  getStatusText(status: 'passed' | 'failed' | 'pending'): string {
    switch (status) {
      case 'passed':
        return 'Aprobado';
      case 'failed':
        return 'Suspenso';
      case 'pending':
        return 'Pendiente';
    }
  }

  getStatusIcon(status: 'passed' | 'failed' | 'pending'): string {
    switch (status) {
      case 'passed':
        return '✓';
      case 'failed':
        return '✗';
      case 'pending':
        return '○';
    }
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  isExamPast(examDate: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exam = new Date(examDate);
    exam.setHours(0, 0, 0, 0);
    return exam < today;
  }

  isExamToday(examDate: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exam = new Date(examDate);
    exam.setHours(0, 0, 0, 0);
    return exam.getTime() === today.getTime();
  }

  isExamSoon(examDate: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exam = new Date(examDate);
    exam.setHours(0, 0, 0, 0);
    const diff = exam.getTime() - today.getTime();
    const daysDiff = diff / (1000 * 60 * 60 * 24);
    return daysDiff > 0 && daysDiff <= 7;
  }
}
