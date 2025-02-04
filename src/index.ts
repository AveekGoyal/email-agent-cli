// index.ts
import { ProcessedEmail } from './types';
import { GmailService } from './services/gmail';
import { EmailProcessingAgent } from './agents/emailAgent';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';

function getPriorityColor(priority: string): any {
  switch (priority) {
    case 'Urgent':
      return chalk.red.bold;
    case 'Important':
      return chalk.yellow;
    case 'Normal':
      return chalk.green;
    default:
      return chalk.white;
  }
}

async function main() {
  try {
    console.log(chalk.blue.bold('\n📧 Email AI Agent Initializing...\n'));
    
    const gmailService = new GmailService();
    await gmailService.initialize();
    
    const emailAgent = new EmailProcessingAgent();
    
    console.log(chalk.cyan('🔍 Fetching and analyzing recent emails...\n'));
    const emails = await gmailService.fetchRecentEmails(10);
    
    // Create the public directory if it doesn't exist
    const publicDir = path.join(__dirname, '..', 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir);
    }

    // Initialize or read existing results
    const outputPath = path.join(publicDir, 'analysis-results.json');
    let allResults: any[] = [];
    if (fs.existsSync(outputPath)) {
      try {
        const fileContent = fs.readFileSync(outputPath, 'utf8');
        const parsedContent = JSON.parse(fileContent);
        allResults = Array.isArray(parsedContent) ? parsedContent : [parsedContent];
      } catch (error) {
        allResults = [];
      }
    }

    for (const email of emails) {
      try {
        const result = await emailAgent.processEmail(email);
        
        const priorityColor = getPriorityColor(result.classification.priority);
        
        // Add timestamp to the result
        const resultWithTimestamp = {
          ...result,
          processedAt: new Date().toISOString()
        };
        
        // Add to results array
        allResults.push(resultWithTimestamp);
        
        // Save updated results array
        fs.writeFileSync(outputPath, JSON.stringify(allResults, null, 2));
        
        // Console output
        console.log(chalk.white('\n' + '━'.repeat(80)));
        console.log(chalk.blue(`📧 Processed: ${email.subject}`));
        console.log(chalk.blue(`Priority: ${result.classification.priority}`));
      } catch (error) {
        console.error(chalk.red(`Error processing email: ${email.subject}`), error);
      }
    }
    
  } catch (error) {
    console.error(chalk.red('Error in main:'), error);
  }
}

main();
