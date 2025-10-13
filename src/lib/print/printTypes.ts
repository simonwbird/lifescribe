export type PrintScope = 'person' | 'event' | 'dateRange' | 'collection';
export type PrintLayout = 'yearbook' | 'tribute' | 'portfolio' | 'timeline';

export interface PrintConfig {
  scope: PrintScope;
  layout: PrintLayout;
  scopeId?: string; // person_id, event_id, etc.
  dateRange?: {
    start: string;
    end: string;
  };
  options: {
    includeTOC: boolean;
    includePageNumbers: boolean;
    pageSize: 'letter' | 'a4' | 'legal';
    orientation: 'portrait' | 'landscape';
    margins: {
      top: number;
      right: number;
      bottom: number;
      left: number;
      bleed: number; // for print bleed
    };
  };
}

export interface PrintPage {
  pageNumber: number;
  content: PrintContent[];
  layout: 'full' | 'grid' | 'split' | 'text';
}

export interface PrintContent {
  type: 'story' | 'photo' | 'heading' | 'timeline' | 'text';
  data: any;
  position?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface BookMetadata {
  title: string;
  subtitle?: string;
  coverImage?: string;
  author: string;
  dateCreated: string;
  pageCount: number;
}
