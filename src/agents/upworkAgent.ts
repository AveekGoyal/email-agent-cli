// agents/upworkAgent.ts
import { ChatAnthropic } from "@langchain/anthropic";
import { analyzeUpworkEmailsTool, analyzeUpworkSkillDemandTool, generatePortfolioProjectsTool } from "../tools/upworkTools";
import { config } from '../config';
import { EmailInput } from '../types';
import * as fs from 'fs';
import * as path from 'path';

export interface SkillDemandAnalysis {
  topTechnologies: Array<{name: string, demandScore: number}>;
  topCategories: Array<{category: string, demandScore: number}>;
  topSkills: Array<{skill: string, demandScore: number}>;
  emergingTrends: string[];
  insights: string[];
}

export interface PortfolioProjectSuggestion {
  projectTitle: string;
  projectDescription: string;
  relevantSkills: string[];
  difficultyLevel: "Beginner" | "Intermediate" | "Advanced";
  estimatedTimeToComplete: string;
  whyRelevant: string;
  confidence: number;
}

export class UpworkAgent {
  private model: ChatAnthropic;
  private tools: any[];

  constructor() {
    this.model = new ChatAnthropic({
      modelName: "claude-3-7-sonnet-20250219",
      temperature: 0.3,
      anthropicApiKey: config.claudeApiKey,
    });
    
    this.tools = [
      analyzeUpworkSkillDemandTool,
      generatePortfolioProjectsTool,
      analyzeUpworkEmailsTool
    ];
  }

  // Filter emails that are from Upwork
  private filterUpworkEmails(emails: EmailInput[]): EmailInput[] {
    return emails.filter(email => {
      const fromLower = email.from.toLowerCase();
      
      // Only include emails specifically from Upwork domains
      return (
        fromLower.includes('upwork.com') ||
        fromLower.includes('notifications.upwork.com') ||
        fromLower.includes('upwork notification')
      );
    });
  }

  // Filter emails from a specific date range
  private filterEmailsByDateRange(emails: EmailInput[]): EmailInput[] {
    // Filter emails from March 4 to March 6, 2025
    const startDate = new Date('2025-03-04T00:00:00+05:30').getTime();
    const endDate = new Date('2025-03-06T23:59:59+05:30').getTime();
    
    return emails.filter(email => {
      const emailTimestamp = email.timestamp;
      return emailTimestamp >= startDate && emailTimestamp <= endDate;
    });
  }

  // Convert EmailInput to format needed for analysis
  private formatEmailsForAnalysis(emails: EmailInput[]): any[] {
    return emails.map(email => ({
      subject: email.subject,
      from: email.from,
      content: email.snippet,
      date: email.date
    }));
  }

  // Process emails and generate portfolio project suggestions
  async generatePortfolioProjects(emails: EmailInput[]): Promise<PortfolioProjectSuggestion[]> {
    try {
      console.log('\n🔍 Starting Upwork email analysis...');
      
      // Filter emails that are from Upwork
      const upworkEmails = this.filterUpworkEmails(emails);
      console.log(`\n📊 Found ${upworkEmails.length} Upwork emails`);
      
      if (upworkEmails.length === 0) {
        console.log('\n⚠️ No Upwork emails found to analyze');
        return [];
      }
      
      // Filter emails from March 4 to March 6
      const dateRangeEmails = this.filterEmailsByDateRange(upworkEmails);
      console.log(`\n📊 Found ${dateRangeEmails.length} Upwork emails from March 4 to March 6`);
      
      // Format emails for analysis
      const formattedEmails = this.formatEmailsForAnalysis(
        dateRangeEmails.length > 0 ? dateRangeEmails : upworkEmails
      );
      
      // Step 1: Analyze skill demand
      console.log('\n📊 Analyzing skill demand from Upwork emails...');
      const skillDemandAnalysis = await analyzeUpworkSkillDemandTool.invoke({
        emails: formattedEmails
      }) as SkillDemandAnalysis;
      
      // Save skill demand analysis to file
      this.saveSkillDemandAnalysis(skillDemandAnalysis);
      
      // Step 2: Generate portfolio project suggestions based on skill demand
      console.log('\n🔄 Generating portfolio project suggestions based on skill demand...');
      const portfolioSuggestions = await generatePortfolioProjectsTool.invoke({
        skillDemandAnalysis
      }) as PortfolioProjectSuggestion[];
      
      // Save portfolio suggestions to file
      this.savePortfolioSuggestions(portfolioSuggestions);
      
      if (portfolioSuggestions.length > 0) {
        console.log('\n✅ Portfolio project suggestions generated successfully');
        this.displayPortfolioSuggestions(portfolioSuggestions);
      } else {
        console.log('\n⚠️ No portfolio project suggestions generated. Try again later when you have more Upwork emails.');
      }
      
      return portfolioSuggestions;
    } catch (error) {
      console.error('\n❌ Error generating portfolio projects:', error);
      return [];
    }
  }
  
  // Save skill demand analysis to file
  private saveSkillDemandAnalysis(analysis: SkillDemandAnalysis): void {
    try {
      const publicDir = path.join(process.cwd(), 'public');
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir);
      }
      
      const outputPath = path.join(publicDir, 'skill-demand-analysis.json');
      fs.writeFileSync(outputPath, JSON.stringify({
        generatedAt: new Date().toISOString(),
        analysis
      }, null, 2));
      
      console.log(`\n💾 Skill demand analysis saved to ${outputPath}`);
    } catch (error) {
      console.error('\n❌ Error saving skill demand analysis:', error);
    }
  }

  // Save portfolio suggestions to file
  private savePortfolioSuggestions(suggestions: PortfolioProjectSuggestion[]): void {
    try {
      const publicDir = path.join(process.cwd(), 'public');
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir);
      }
      
      const outputPath = path.join(publicDir, 'portfolio-suggestions.json');
      fs.writeFileSync(outputPath, JSON.stringify({
        generatedAt: new Date().toISOString(),
        suggestions
      }, null, 2));
      
      console.log(`\n💾 Portfolio suggestions saved to ${outputPath}`);
    } catch (error) {
      console.error('\n❌ Error saving portfolio suggestions:', error);
    }
  }

  // Display portfolio suggestions in a readable format
  private displayPortfolioSuggestions(suggestions: PortfolioProjectSuggestion[]): void {
    try {
      for (let i = 0; i < suggestions.length; i++) {
        const project = suggestions[i];
        console.log(`\nProject ${i+1}: ${project.projectTitle}`);
        console.log(`Description: ${project.projectDescription}`);
        console.log(`Skills: ${project.relevantSkills.join(', ')}`);
        console.log(`Difficulty: ${project.difficultyLevel}`);
        console.log(`Estimated Time: ${project.estimatedTimeToComplete}`);
        console.log(`Why Relevant: ${project.whyRelevant}`);
        
        if (i < suggestions.length - 1) {
          console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        }
      }
    } catch (error) {
      console.error('\n❌ Error displaying portfolio suggestions:', error);
    }
  }
}
