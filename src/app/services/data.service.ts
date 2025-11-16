import { Injectable } from '@angular/core';
import { Topic, TopicStatus, SubTopic } from '../models/topic.model';
import { CodeSnippet } from '../models/code-snippet.model';
import { Exam } from '../models/exam.model';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private readonly TOPICS_KEY = 'java-topics';
  private readonly SNIPPETS_KEY = 'code-snippets';
  private readonly EXAMS_KEY = 'java-exams';

  private topicsSubject: BehaviorSubject<Topic[]>;
  private snippetsSubject: BehaviorSubject<CodeSnippet[]>;
  private examsSubject: BehaviorSubject<Exam[]>;

  constructor() {
    const storedTopics = this.loadTopics();
    const storedSnippets = this.loadSnippets();
    const storedExams = this.loadExams();

    this.topicsSubject = new BehaviorSubject<Topic[]>(storedTopics.length > 0 ? storedTopics : this.getInitialTopics());
    this.snippetsSubject = new BehaviorSubject<CodeSnippet[]>(storedSnippets);
    this.examsSubject = new BehaviorSubject<Exam[]>(storedExams);

    // Save initial data if none exists
    if (storedTopics.length === 0) {
      this.saveTopics(this.topicsSubject.value);
    }
  }

  // Topics methods
  getTopics(): Observable<Topic[]> {
    return this.topicsSubject.asObservable();
  }

  updateTopicStatus(topicId: string, status: TopicStatus): void {
    const topics = this.topicsSubject.value.map(topic => {
      if (topic.id === topicId) {
        return { ...topic, status };
      }
      return topic;
    });
    this.topicsSubject.next(topics);
    this.saveTopics(topics);
  }

  updateSubTopicStatus(topicId: string, subTopicId: string, status: TopicStatus): void {
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
    this.saveTopics(topics);
  }

  addTopic(topic: Topic): void {
    const topics = [...this.topicsSubject.value, topic];
    this.topicsSubject.next(topics);
    this.saveTopics(topics);
  }

  // Code snippets methods
  getSnippets(): Observable<CodeSnippet[]> {
    return this.snippetsSubject.asObservable();
  }

  addSnippet(snippet: CodeSnippet): void {
    const snippets = [...this.snippetsSubject.value, snippet];
    this.snippetsSubject.next(snippets);
    this.saveSnippets(snippets);
  }

  updateSnippet(snippet: CodeSnippet): void {
    const snippets = this.snippetsSubject.value.map(s =>
      s.id === snippet.id ? snippet : s
    );
    this.snippetsSubject.next(snippets);
    this.saveSnippets(snippets);
  }

  deleteSnippet(id: string): void {
    const snippets = this.snippetsSubject.value.filter(s => s.id !== id);
    this.snippetsSubject.next(snippets);
    this.saveSnippets(snippets);
  }

  getSnippetsByTopic(topicId: string): CodeSnippet[] {
    return this.snippetsSubject.value.filter(s => s.topicId === topicId);
  }

  // Local storage methods
  private saveTopics(topics: Topic[]): void {
    localStorage.setItem(this.TOPICS_KEY, JSON.stringify(topics));
  }

  private loadTopics(): Topic[] {
    const data = localStorage.getItem(this.TOPICS_KEY);
    return data ? JSON.parse(data) : [];
  }

  private saveSnippets(snippets: CodeSnippet[]): void {
    localStorage.setItem(this.SNIPPETS_KEY, JSON.stringify(snippets));
  }

  private loadSnippets(): CodeSnippet[] {
    const data = localStorage.getItem(this.SNIPPETS_KEY);
    return data ? JSON.parse(data) : [];
  }

  // Exams methods
  getExams(): Observable<Exam[]> {
    return this.examsSubject.asObservable();
  }

  addExam(exam: Exam): void {
    const exams = [...this.examsSubject.value, exam];
    this.examsSubject.next(exams);
    this.saveExams(exams);
  }

  updateExam(exam: Exam): void {
    const exams = this.examsSubject.value.map(e =>
      e.id === exam.id ? exam : e
    );
    this.examsSubject.next(exams);
    this.saveExams(exams);
  }

  deleteExam(id: string): void {
    const exams = this.examsSubject.value.filter(e => e.id !== id);
    this.examsSubject.next(exams);
    this.saveExams(exams);
  }

  private saveExams(exams: Exam[]): void {
    localStorage.setItem(this.EXAMS_KEY, JSON.stringify(exams));
  }

  private loadExams(): Exam[] {
    const data = localStorage.getItem(this.EXAMS_KEY);
    if (!data) return [];

    const exams = JSON.parse(data);
    // Convert date strings back to Date objects
    return exams.map((exam: any) => ({
      ...exam,
      examDate: new Date(exam.examDate),
      createdAt: new Date(exam.createdAt)
    }));
  }

  // Initial data
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
