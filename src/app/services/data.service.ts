import { Injectable } from '@angular/core';
import { Topic, TopicStatus, SubTopic } from '../models/topic.model';
import { CodeSnippet } from '../models/code-snippet.model';
import { Exam } from '../models/exam.model';
import { BehaviorSubject, Observable } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private topicsSubject: BehaviorSubject<Topic[]>;
  private snippetsSubject: BehaviorSubject<CodeSnippet[]>;
  private examsSubject: BehaviorSubject<Exam[]>;

  constructor(
    private supabaseService: SupabaseService,
    private authService: AuthService
  ) {
    this.topicsSubject = new BehaviorSubject<Topic[]>([]);
    this.snippetsSubject = new BehaviorSubject<CodeSnippet[]>([]);
    this.examsSubject = new BehaviorSubject<Exam[]>([]);

    // Cargar datos cuando el usuario inicia sesión
    this.authService.currentUser.subscribe(async (user) => {
      if (user) {
        await this.loadAllData();
      } else {
        // Limpiar datos cuando cierra sesión
        this.topicsSubject.next([]);
        this.snippetsSubject.next([]);
        this.examsSubject.next([]);
      }
    });
  }

  private async loadAllData(): Promise<void> {
    await Promise.all([
      this.loadTopicsFromSupabase(),
      this.loadSnippetsFromSupabase(),
      this.loadExamsFromSupabase()
    ]);
  }

  // ==================== TOPICS ====================

  getTopics(): Observable<Topic[]> {
    return this.topicsSubject.asObservable();
  }

  async updateTopicStatus(topicId: string, status: TopicStatus): Promise<void> {
    if (!this.authService.currentUserValue) return;

    // Actualizar en Supabase
    const { error } = await this.supabaseService.client
      .from('topics')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', topicId)
      .eq('user_id', this.authService.currentUserValue.id);

    if (error) {
      console.error('Error updating topic:', error);
      return;
    }

    // Actualizar localmente
    const topics = this.topicsSubject.value.map(topic => {
      if (topic.id === topicId) {
        return { ...topic, status };
      }
      return topic;
    });
    this.topicsSubject.next(topics);
  }

  async updateSubTopicStatus(topicId: string, subTopicId: string, status: TopicStatus): Promise<void> {
    if (!this.authService.currentUserValue) return;

    // Actualizar en Supabase
    const { error } = await this.supabaseService.client
      .from('topics')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', subTopicId)
      .eq('user_id', this.authService.currentUserValue.id);

    if (error) {
      console.error('Error updating subtopic:', error);
      return;
    }

    // Actualizar localmente
    const topics = this.topicsSubject.value.map(topic => {
      if (topic.id === topicId && topic.subTopics) {
        const updatedSubTopics = topic.subTopics.map(subTopic => {
          if (subTopic.id === subTopicId) {
            return { ...subTopic, status };
          }
          return subTopic;
        });
        return { ...topic, subTopics: updatedSubTopics };
      }
      return topic;
    });
    this.topicsSubject.next(topics);
  }

  async addTopic(topic: Topic): Promise<void> {
    if (!this.authService.currentUserValue) return;

    const { error } = await this.supabaseService.client
      .from('topics')
      .insert({
        id: topic.id,
        user_id: this.authService.currentUserValue.id,
        number: topic.number,
        title: topic.title,
        status: topic.status,
        parent_id: null
      });

    if (error) {
      console.error('Error adding topic:', error);
      return;
    }

    const topics = [...this.topicsSubject.value, topic];
    this.topicsSubject.next(topics);
  }

  private async loadTopicsFromSupabase(): Promise<void> {
    if (!this.authService.currentUserValue) return;

    const { data, error } = await this.supabaseService.client
      .from('topics')
      .select('*')
      .eq('user_id', this.authService.currentUserValue.id)
      .order('number', { ascending: true });

    if (error) {
      console.error('Error loading topics:', error);
      // Si no hay datos, inicializar con topics por defecto
      await this.initializeDefaultTopics();
      return;
    }

    if (!data || data.length === 0) {
      await this.initializeDefaultTopics();
      return;
    }

    // Reconstruir jerarquía
    const topicsMap = new Map<string, Topic>();
    const rootTopics: Topic[] = [];

    data.forEach((row: any) => {
      if (!row.parent_id) {
        topicsMap.set(row.id, {
          id: row.id,
          number: row.number,
          title: row.title,
          status: row.status as TopicStatus,
          subTopics: []
        });
      }
    });

    data.forEach((row: any) => {
      if (row.parent_id) {
        const parent = topicsMap.get(row.parent_id);
        if (parent) {
          if (!parent.subTopics) {
            parent.subTopics = [];
          }
          parent.subTopics.push({
            id: row.id,
            title: row.title,
            status: row.status as TopicStatus
          });
        }
      }
    });

    topicsMap.forEach((topic) => {
      rootTopics.push(topic);
    });

    this.topicsSubject.next(rootTopics);
  }

  private async initializeDefaultTopics(): Promise<void> {
    if (!this.authService.currentUserValue) return;

    const initialTopics = this.getInitialTopics();
    const flatTopics: any[] = [];

    initialTopics.forEach(topic => {
      flatTopics.push({
        id: topic.id,
        user_id: this.authService.currentUserValue!.id,
        number: topic.number,
        title: topic.title,
        status: topic.status,
        parent_id: null
      });

      if (topic.subTopics) {
        topic.subTopics.forEach(subTopic => {
          flatTopics.push({
            id: subTopic.id,
            user_id: this.authService.currentUserValue!.id,
            number: null,
            title: subTopic.title,
            status: subTopic.status,
            parent_id: topic.id
          });
        });
      }
    });

    const { error } = await this.supabaseService.client
      .from('topics')
      .insert(flatTopics);

    if (error) {
      console.error('Error initializing topics:', error);
      return;
    }

    this.topicsSubject.next(initialTopics);
  }

  // ==================== CODE SNIPPETS ====================

  getSnippets(): Observable<CodeSnippet[]> {
    return this.snippetsSubject.asObservable();
  }

  async addSnippet(snippet: CodeSnippet): Promise<void> {
    if (!this.authService.currentUserValue) return;

    const { error } = await this.supabaseService.client
      .from('code_snippets')
      .insert({
        id: snippet.id,
        user_id: this.authService.currentUserValue.id,
        topic_id: snippet.topicId,
        title: snippet.title,
        code: snippet.code,
        description: snippet.description
      });

    if (error) {
      console.error('Error adding snippet:', error);
      return;
    }

    const snippets = [...this.snippetsSubject.value, snippet];
    this.snippetsSubject.next(snippets);
  }

  async updateSnippet(snippet: CodeSnippet): Promise<void> {
    if (!this.authService.currentUserValue) return;

    const { error } = await this.supabaseService.client
      .from('code_snippets')
      .update({
        topic_id: snippet.topicId,
        title: snippet.title,
        code: snippet.code,
        description: snippet.description,
        updated_at: new Date().toISOString()
      })
      .eq('id', snippet.id)
      .eq('user_id', this.authService.currentUserValue.id);

    if (error) {
      console.error('Error updating snippet:', error);
      return;
    }

    const snippets = this.snippetsSubject.value.map(s =>
      s.id === snippet.id ? snippet : s
    );
    this.snippetsSubject.next(snippets);
  }

  async deleteSnippet(id: string): Promise<void> {
    if (!this.authService.currentUserValue) return;

    const { error } = await this.supabaseService.client
      .from('code_snippets')
      .delete()
      .eq('id', id)
      .eq('user_id', this.authService.currentUserValue.id);

    if (error) {
      console.error('Error deleting snippet:', error);
      return;
    }

    const snippets = this.snippetsSubject.value.filter(s => s.id !== id);
    this.snippetsSubject.next(snippets);
  }

  getSnippetsByTopic(topicId: string): CodeSnippet[] {
    return this.snippetsSubject.value.filter(s => s.topicId === topicId);
  }

  private async loadSnippetsFromSupabase(): Promise<void> {
    if (!this.authService.currentUserValue) return;

    const { data, error } = await this.supabaseService.client
      .from('code_snippets')
      .select('*')
      .eq('user_id', this.authService.currentUserValue.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading snippets:', error);
      return;
    }

    const snippets = (data || []).map((row: any) => ({
      id: row.id,
      topicId: row.topic_id,
      title: row.title,
      code: row.code,
      description: row.description,
      createdAt: new Date(row.created_at)
    }));

    this.snippetsSubject.next(snippets);
  }

  // ==================== EXAMS ====================

  getExams(): Observable<Exam[]> {
    return this.examsSubject.asObservable();
  }

  async addExam(exam: Exam): Promise<void> {
    if (!this.authService.currentUserValue) return;

    const { error } = await this.supabaseService.client
      .from('exams')
      .insert({
        id: exam.id,
        user_id: this.authService.currentUserValue.id,
        unit: exam.unit,
        topics: exam.topics,
        exam_date: exam.examDate.toISOString(),
        grade: exam.grade
      });

    if (error) {
      console.error('Error adding exam:', error);
      return;
    }

    const exams = [...this.examsSubject.value, exam];
    this.examsSubject.next(exams);
  }

  async updateExam(exam: Exam): Promise<void> {
    if (!this.authService.currentUserValue) return;

    const { error } = await this.supabaseService.client
      .from('exams')
      .update({
        unit: exam.unit,
        topics: exam.topics,
        exam_date: exam.examDate.toISOString(),
        grade: exam.grade,
        updated_at: new Date().toISOString()
      })
      .eq('id', exam.id)
      .eq('user_id', this.authService.currentUserValue.id);

    if (error) {
      console.error('Error updating exam:', error);
      return;
    }

    const exams = this.examsSubject.value.map(e =>
      e.id === exam.id ? exam : e
    );
    this.examsSubject.next(exams);
  }

  async deleteExam(id: string): Promise<void> {
    if (!this.authService.currentUserValue) return;

    const { error } = await this.supabaseService.client
      .from('exams')
      .delete()
      .eq('id', id)
      .eq('user_id', this.authService.currentUserValue.id);

    if (error) {
      console.error('Error deleting exam:', error);
      return;
    }

    const exams = this.examsSubject.value.filter(e => e.id !== id);
    this.examsSubject.next(exams);
  }

  private async loadExamsFromSupabase(): Promise<void> {
    if (!this.authService.currentUserValue) return;

    const { data, error } = await this.supabaseService.client
      .from('exams')
      .select('*')
      .eq('user_id', this.authService.currentUserValue.id)
      .order('exam_date', { ascending: false });

    if (error) {
      console.error('Error loading exams:', error);
      return;
    }

    const exams = (data || []).map((row: any) => ({
      id: row.id,
      unit: row.unit,
      topics: row.topics,
      examDate: new Date(row.exam_date),
      grade: row.grade,
      createdAt: new Date(row.created_at)
    }));

    this.examsSubject.next(exams);
  }

  // ==================== INITIAL DATA ====================

  private getInitialTopics(): Topic[] {
    return [
      {
        id: 'topic-1',
        number: 1,
        title: 'Variables',
        status: TopicStatus.NOT_STARTED
      },
      {
        id: 'topic-2',
        number: 2,
        title: 'Condicionales',
        status: TopicStatus.NOT_STARTED,
        subTopics: [
          { id: 'topic-2-1', title: 'Condicionales simples', status: TopicStatus.NOT_STARTED },
          { id: 'topic-2-2', title: 'Condicionales dobles', status: TopicStatus.NOT_STARTED },
          { id: 'topic-2-3', title: 'Condicionales dobles complejo', status: TopicStatus.NOT_STARTED },
          { id: 'topic-2-4', title: 'Switch simple', status: TopicStatus.NOT_STARTED },
          { id: 'topic-2-5', title: 'Switch complejo', status: TopicStatus.NOT_STARTED }
        ]
      },
      {
        id: 'topic-3',
        number: 3,
        title: 'Bucles',
        status: TopicStatus.NOT_STARTED,
        subTopics: [
          { id: 'topic-3-1', title: 'For simple', status: TopicStatus.NOT_STARTED },
          { id: 'topic-3-2', title: 'For complejo', status: TopicStatus.NOT_STARTED },
          { id: 'topic-3-3', title: 'While simple', status: TopicStatus.NOT_STARTED },
          { id: 'topic-3-4', title: 'While complejo', status: TopicStatus.NOT_STARTED },
          { id: 'topic-3-5', title: 'Do while simple', status: TopicStatus.NOT_STARTED },
          { id: 'topic-3-6', title: 'Do while complejo', status: TopicStatus.NOT_STARTED }
        ]
      },
      {
        id: 'topic-4',
        number: 4,
        title: 'Funciones',
        status: TopicStatus.NOT_STARTED,
        subTopics: [
          { id: 'topic-4-1', title: 'Funciones simples', status: TopicStatus.NOT_STARTED },
          { id: 'topic-4-2', title: 'Funciones sin parametros', status: TopicStatus.NOT_STARTED },
          { id: 'topic-4-3', title: 'Funciones con parametros', status: TopicStatus.NOT_STARTED },
          { id: 'topic-4-4', title: 'Funciones complejas', status: TopicStatus.NOT_STARTED }
        ]
      },
      {
        id: 'topic-5',
        number: 5,
        title: 'Tablas',
        status: TopicStatus.NOT_STARTED
      },
      {
        id: 'topic-6',
        number: 6,
        title: 'Cadenas',
        status: TopicStatus.NOT_STARTED
      },
      {
        id: 'topic-7',
        number: 7,
        title: 'Clases',
        status: TopicStatus.NOT_STARTED
      },
      {
        id: 'topic-8',
        number: 8,
        title: 'Herencia',
        status: TopicStatus.NOT_STARTED
      },
      {
        id: 'topic-9',
        number: 9,
        title: 'Interfaces',
        status: TopicStatus.NOT_STARTED
      },
      {
        id: 'topic-10',
        number: 10,
        title: 'Ficheros',
        status: TopicStatus.NOT_STARTED
      }
    ];
  }
}
