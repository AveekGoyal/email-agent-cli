// services/gmail.ts
import { google } from 'googleapis';
import { authenticate } from '@google-cloud/local-auth';
import path from 'path';
import { GmailEmailResponse, EmailInput } from '../types';

export class GmailService {
  private auth: any = null;
  private gmail = google.gmail('v1');

  private SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.labels',
    'https://www.googleapis.com/auth/gmail.modify'
  ];

  constructor() {}

  public async initialize(): Promise<void> {
    if (!this.auth) {
      await this.initializeGmail();
    }
  }

  private async initializeGmail(): Promise<void> {
    try {
      const credentialsPath = path.join(process.cwd(), 'credentials.json');
      
      const authClient = await authenticate({
        keyfilePath: credentialsPath,
        scopes: this.SCOPES,
      });

      this.auth = authClient;
      this.gmail = google.gmail({ version: 'v1', auth: authClient });
      console.log('Gmail API initialized successfully');
    } catch (error) {
      console.error('Error initializing Gmail API:', error);
      throw error;
    }
  }

  private validateEmailResponse(email: GmailEmailResponse): EmailInput {
    return {
      id: email.id || `unknown_${Date.now()}`,
      threadId: email.threadId || `thread_${Date.now()}`,
      subject: email.subject,
      from: email.from,
      date: email.date,
      snippet: email.snippet,
      isRead: email.isRead,
      emailLink: email.emailLink,
      timestamp: email.timestamp
    };
  }

  public async fetchRecentEmails(maxResults: number = 10): Promise<EmailInput[]> {
    try {
      if (!this.auth) {
        throw new Error('Gmail API not initialized. Call initialize() first.');
      }

      const response = await this.gmail.users.messages.list({
        userId: 'me',
        maxResults,
      });

      if (!response.data.messages) {
        return [];
      }

      const emails = await Promise.all(
        response.data.messages.map(async (message: any) => {
          const email = await this.gmail.users.messages.get({
            userId: 'me',
            id: message.id,
          });

          const headers = email.data.payload?.headers;
          const subject = headers?.find((h: any) => h.name === 'Subject')?.value || 'No Subject';
          const from = headers?.find((h: any) => h.name === 'From')?.value || 'Unknown Sender';
          const date = headers?.find((h: any) => h.name === 'Date')?.value || new Date().toISOString();
          
          // Get read/unread status from labels
          const isRead = !email.data.labelIds?.includes('UNREAD');
          
          // Create email link (web Gmail URL)
          const emailLink = `https://mail.google.com/mail/u/0/#inbox/${email.data.id}`;
          
          // Convert date to timestamp
          const timestamp = new Date(date).getTime();

          const rawEmail: GmailEmailResponse = {
            id: email.data.id,
            threadId: email.data.threadId,
            subject,
            from,
            date,
            snippet: email.data.snippet || '',
            isRead,
            emailLink,
            timestamp
          };

          return this.validateEmailResponse(rawEmail);
        })
      );

      return emails;
    } catch (error) {
      console.error('Error fetching emails:', error);
      throw error;
    }
  }
}