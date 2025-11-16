import { Component, OnInit, AfterViewChecked } from '@angular/core';
import { DataService } from '../../services/data.service';
import { CodeSnippet } from '../../models/code-snippet.model';
import { Topic } from '../../models/topic.model';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import * as Prism from 'prismjs';
import 'prismjs/components/prism-java';

interface SnippetGroup {
  topicId: string;
  topicTitle: string;
  snippets: CodeSnippet[];
  collapsed: boolean;
}

@Component({
  selector: 'app-code-snippets',
  templateUrl: './code-snippets.component.html',
  styleUrls: ['./code-snippets.component.css']
})
export class CodeSnippetsComponent implements OnInit, AfterViewChecked {
  snippets$: Observable<CodeSnippet[]>;
  topics$: Observable<Topic[]>;
  groupedSnippets$: Observable<SnippetGroup[]>;

  showAddForm = false;
  editingSnippet: CodeSnippet | null = null;

  newSnippet: Partial<CodeSnippet> = {
    topicId: '',
    title: '',
    code: '',
    description: ''
  };

  constructor(private dataService: DataService) {
    this.snippets$ = this.dataService.getSnippets();
    this.topics$ = this.dataService.getTopics();

    // Combinar snippets y topics para agruparlos
    this.groupedSnippets$ = combineLatest([this.snippets$, this.topics$]).pipe(
      map(([snippets, topics]) => this.groupSnippetsByTopic(snippets, topics))
    );
  }

  ngOnInit(): void {
  }

  ngAfterViewChecked(): void {
    setTimeout(() => {
      Prism.highlightAll();
    }, 0);
  }

  groupSnippetsByTopic(snippets: CodeSnippet[], topics: Topic[]): SnippetGroup[] {
    const groups: SnippetGroup[] = [];
    const topicMap = new Map<string, string>();

    // Crear mapa de todos los topics y subtopics
    topics.forEach(topic => {
      topicMap.set(topic.id, `${topic.number}. ${topic.title}`);

      if (topic.subTopics) {
        topic.subTopics.forEach(subTopic => {
          topicMap.set(subTopic.id, `${topic.number}. ${topic.title} - ${subTopic.title}`);
        });
      }
    });

    // Agrupar snippets por topicId
    const groupMap = new Map<string, CodeSnippet[]>();

    snippets.forEach(snippet => {
      if (!groupMap.has(snippet.topicId)) {
        groupMap.set(snippet.topicId, []);
      }
      groupMap.get(snippet.topicId)?.push(snippet);
    });

    // Crear grupos ordenados
    groupMap.forEach((snippets, topicId) => {
      const topicTitle = topicMap.get(topicId) || 'Sin tema';
      groups.push({
        topicId,
        topicTitle,
        snippets: snippets.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
        collapsed: false
      });
    });

    // Ordenar grupos alfabéticamente
    return groups.sort((a, b) => a.topicTitle.localeCompare(b.topicTitle));
  }

  toggleGroup(group: SnippetGroup): void {
    group.collapsed = !group.collapsed;
  }

  showAddSnippetForm(): void {
    this.showAddForm = true;
    this.editingSnippet = null;
    this.resetNewSnippet();
  }

  hideAddSnippetForm(): void {
    this.showAddForm = false;
    this.resetNewSnippet();
  }

  resetNewSnippet(): void {
    this.newSnippet = {
      topicId: '',
      title: '',
      code: '',
      description: ''
    };
  }

  async addSnippet(): Promise<void> {
    if (this.newSnippet.topicId && this.newSnippet.title && this.newSnippet.code) {
      const snippet: CodeSnippet = {
        id: Date.now().toString(),
        topicId: this.newSnippet.topicId,
        title: this.newSnippet.title,
        code: this.newSnippet.code,
        description: this.newSnippet.description,
        createdAt: new Date()
      };

      await this.dataService.addSnippet(snippet);
      this.hideAddSnippetForm();
    }
  }

  editSnippet(snippet: CodeSnippet): void {
    this.editingSnippet = { ...snippet };
    this.showAddForm = true;
    this.newSnippet = {
      topicId: snippet.topicId,
      title: snippet.title,
      code: snippet.code,
      description: snippet.description
    };
  }

  async updateSnippet(): Promise<void> {
    if (this.editingSnippet && this.newSnippet.topicId && this.newSnippet.title && this.newSnippet.code) {
      const updatedSnippet: CodeSnippet = {
        ...this.editingSnippet,
        topicId: this.newSnippet.topicId,
        title: this.newSnippet.title,
        code: this.newSnippet.code,
        description: this.newSnippet.description
      };

      await this.dataService.updateSnippet(updatedSnippet);
      this.hideAddSnippetForm();
      this.editingSnippet = null;
    }
  }

  async deleteSnippet(id: string): Promise<void> {
    if (confirm('¿Estas segura de que quieres eliminar este fragmento de codigo?')) {
      await this.dataService.deleteSnippet(id);
    }
  }

  getAllTopicsAndSubTopics(topics: Topic[] | null): any[] {
    if (!topics) return [];

    const result: any[] = [];

    topics.forEach(topic => {
      result.push({ id: topic.id, title: `${topic.number}. ${topic.title}`, isSubTopic: false });

      if (topic.subTopics) {
        topic.subTopics.forEach(subTopic => {
          result.push({
            id: subTopic.id,
            title: `  ${topic.number}. ${topic.title} - ${subTopic.title}`,
            isSubTopic: true
          });
        });
      }
    });

    return result;
  }
}
