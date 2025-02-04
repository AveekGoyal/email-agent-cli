// types/index.ts
export interface EmailInput {
    id: string;
    threadId: string;
    subject: string;
    from: string;
    date: string;
    snippet: string;
    isRead: boolean;
    emailLink: string;
    timestamp: number;
  }
  
  export interface GmailEmailResponse {
    id: string | null | undefined;
    threadId: string | null | undefined;
    subject: string;
    from: string;
    date: string;
    snippet: string;
    isRead: boolean;
    emailLink: string;
    timestamp: number;
  }
  
  export interface ClassificationResult {
    priority: "Urgent" | "Important" | "Normal";
    timeOfDay: 'Morning' | 'Afternoon' | 'Evening';
    reasoning: string;
    confidence: number;
  }
  
  export interface SummaryResult {
    keyPoints: string[];
    actionItems: string[];
    suggestedResponse?: string;
    confidence: number;
  }
  
  export interface ProcessedEmail {
    id: string;
    threadId: string;
    subject: string;
    from: string;
    date: string;
    isRead: boolean;
    emailLink: string;
    timestamp: number;
    classification: ClassificationResult;
    summary: SummaryResult;
  }