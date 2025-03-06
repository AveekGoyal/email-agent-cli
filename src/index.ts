// index.ts
import { ProcessedEmail } from './types';
import { GmailService } from './services/gmail';
import { EmailProcessingAgent } from './agents/emailAgent';
import { UpworkAgent } from './agents/upworkAgent';
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
    const upworkAgent = new UpworkAgent();
    
    console.log(chalk.cyan('🔍 Fetching recent emails...\n'));
    // Fetch more emails to increase chances of finding Upwork emails
    const emails = await gmailService.fetchRecentEmails(100);
    
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

    // Skip email processing and focus on Upwork analysis
    console.log(chalk.cyan('\n🔍 Analyzing Upwork emails for portfolio project suggestions...\n'));
    const portfolioSuggestions = await upworkAgent.generatePortfolioProjects(emails);
    
    if (portfolioSuggestions.length > 0) {
      console.log(chalk.green('\n✨ Portfolio Project Suggestions:'));
      portfolioSuggestions.forEach((project, index) => {
        console.log(chalk.white('\n' + '━'.repeat(80)));
        console.log(chalk.yellow(`Project ${index + 1}: ${project.projectTitle}`));
        console.log(chalk.blue(`Description: ${project.projectDescription}`));
        console.log(chalk.blue(`Skills: ${project.relevantSkills.join(', ')}`));
        console.log(chalk.blue(`Difficulty: ${project.difficultyLevel}`));
        console.log(chalk.blue(`Estimated Time: ${project.estimatedTimeToComplete}`));
        console.log(chalk.blue(`Why Relevant: ${project.whyRelevant}`));
      });
    } else {
      console.log(chalk.yellow('\n⚠️ No portfolio project suggestions generated. Try again later when you have more Upwork emails.'));
    }
    
    console.log(chalk.green('\n✅ Analysis complete!'));
  } catch (error) {
    console.error(chalk.red('\n❌ Error in main process:'), error);
  }
}

main();
