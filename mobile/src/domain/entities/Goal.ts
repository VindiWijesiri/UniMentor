export interface GoalLog {
  date: string;
  minutes: number;
  note?: string;
}

export interface Goal {
  _id: string;
  title: string;
  subject: string;
  module?: string;
  targetDate?: string;
  targetHours: number;
  status: 'active' | 'completed';
  logs: GoalLog[];
  progress: number;
}
