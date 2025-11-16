export enum TopicStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed'
}

export interface SubTopic {
  id: string;
  title: string;
  status: TopicStatus;
}

export interface Topic {
  id: string;
  number: number;
  title: string;
  status: TopicStatus;
  subTopics?: SubTopic[];
}
