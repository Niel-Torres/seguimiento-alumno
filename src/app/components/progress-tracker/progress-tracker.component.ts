import { Component, OnInit } from '@angular/core';
import { DataService } from '../../services/data.service';
import { Topic, TopicStatus } from '../../models/topic.model';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-progress-tracker',
  templateUrl: './progress-tracker.component.html',
  styleUrls: ['./progress-tracker.component.css']
})
export class ProgressTrackerComponent implements OnInit {
  topics$: Observable<Topic[]>;
  TopicStatus = TopicStatus;

  constructor(private dataService: DataService) {
    this.topics$ = this.dataService.getTopics();
  }

  ngOnInit(): void {
  }

  getStatusIcon(status: TopicStatus): string {
    switch (status) {
      case TopicStatus.COMPLETED:
        return '✓';
      case TopicStatus.IN_PROGRESS:
        return '●';
      case TopicStatus.NOT_STARTED:
        return '○';
      default:
        return '○';
    }
  }

  getStatusClass(status: TopicStatus): string {
    switch (status) {
      case TopicStatus.COMPLETED:
        return 'completed';
      case TopicStatus.IN_PROGRESS:
        return 'in-progress';
      case TopicStatus.NOT_STARTED:
        return 'not-started';
      default:
        return 'not-started';
    }
  }

  async cycleTopicStatus(topicId: string, currentStatus: TopicStatus): Promise<void> {
    let newStatus: TopicStatus;

    switch (currentStatus) {
      case TopicStatus.NOT_STARTED:
        newStatus = TopicStatus.IN_PROGRESS;
        break;
      case TopicStatus.IN_PROGRESS:
        newStatus = TopicStatus.COMPLETED;
        break;
      case TopicStatus.COMPLETED:
        newStatus = TopicStatus.NOT_STARTED;
        break;
      default:
        newStatus = TopicStatus.NOT_STARTED;
    }

    await this.dataService.updateTopicStatus(topicId, newStatus);
  }

  async cycleSubTopicStatus(topicId: string, subTopicId: string, currentStatus: TopicStatus): Promise<void> {
    let newStatus: TopicStatus;

    switch (currentStatus) {
      case TopicStatus.NOT_STARTED:
        newStatus = TopicStatus.IN_PROGRESS;
        break;
      case TopicStatus.IN_PROGRESS:
        newStatus = TopicStatus.COMPLETED;
        break;
      case TopicStatus.COMPLETED:
        newStatus = TopicStatus.NOT_STARTED;
        break;
      default:
        newStatus = TopicStatus.NOT_STARTED;
    }

    await this.dataService.updateSubTopicStatus(topicId, subTopicId, newStatus);
  }
}
