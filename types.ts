
export interface Lecture {
  id: string;
  title: string;
  processedAt: string;
  duration: string;
  transcript?: string;
  summary?: string;
  fileName: string;
  fileSize: number;
}

export enum View {
  HOME = 'HOME',
  DETAIL = 'DETAIL',
  LOADING = 'LOADING'
}
