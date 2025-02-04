// agents/emailAgent.ts
import { ChatOpenAI } from "@langchain/openai";
import { 
  classifyEmailTool, 
  summarizeEmailTool, 
  evaluateAnalysisTool,
  improveAnalysisTool 
} from "../tools/emailTools";
import { config } from '../config';
import { EmailInput, ProcessedEmail } from '../types';

export class EmailProcessingAgent {
  private model: ChatOpenAI;
  private tools: any[];
  private CONFIDENCE_THRESHOLD = 0.8;

  constructor() {
    this.model = new ChatOpenAI({
      modelName: "gpt-4o-mini",
      temperature: 0,
      openAIApiKey: config.openAiApiKey,
    });
    
    this.tools = [
      classifyEmailTool,
      summarizeEmailTool,
      evaluateAnalysisTool,
      improveAnalysisTool
    ];
  }

  private getTimeOfDay(dateStr: string): 'Morning' | 'Afternoon' | 'Evening' {
    const date = new Date(dateStr);
    const hours = date.getHours();
    
    if (hours >= 21 || hours < 10) {
      return 'Morning';
    } else if (hours >= 10 && hours < 15) {
      return 'Afternoon';
    } else {
      return 'Evening';
    }
  }

  async processEmail(email: EmailInput): Promise<ProcessedEmail> {
    const modelWithTools = this.model.bindTools(this.tools);

    try {
      console.log('\n📝 Starting email analysis...');
      console.log('Email details:', {
        subject: email.subject,
        from: email.from,
        snippet: email.snippet.substring(0, 100) + '...'
      });

      // Initial analysis
      console.log('\n🔄 Running initial classification...');
      const classificationResult = await classifyEmailTool.invoke({
        subject: email.subject,
        from: email.from,
        content: email.snippet
      });

      console.log('\n🔄 Running initial summary...');
      const summaryResult = await summarizeEmailTool.invoke({
        subject: email.subject,
        content: email.snippet
      });

      // Log results
      console.log('\n📊 Classification result:', classificationResult);
      console.log('\n📊 Summary result:', summaryResult);

      // Create initial analysis
      const timeOfDay = this.getTimeOfDay(email.date);
      const initialAnalysis: ProcessedEmail = {
        id: email.id,
        threadId: email.threadId,
        subject: email.subject,
        from: email.from,
        date: email.date,
        isRead: email.isRead,
        emailLink: email.emailLink,
        timestamp: email.timestamp,
        classification: {
          priority: classificationResult.priority,
          reasoning: classificationResult.reasoning,
          confidence: classificationResult.confidence,
          timeOfDay
        },
        summary: {
          keyPoints: summaryResult.keyPoints,
          actionItems: summaryResult.actionItems,
          suggestedResponse: summaryResult.suggestedResponse,
          confidence: summaryResult.confidence
        }
      };

      console.log('\n📋 Initial analysis created:', initialAnalysis);

      // Evaluate the analysis
      console.log('\n🔍 Running evaluation...');
      const evaluationResult = await evaluateAnalysisTool.invoke({
        subject: email.subject,
        content: email.snippet,
        classification: JSON.stringify(classificationResult),
        summary: JSON.stringify(summaryResult)
      });

      console.log('\n📊 Evaluation result:', evaluationResult);

      // If improvements needed, make one improvement attempt
      if (evaluationResult.improvementNeeded) {
        console.log('\n🔄 Running improvement...');
        const improvedResult = await improveAnalysisTool.invoke({
          subject: email.subject,
          content: email.snippet,
          previousAnalysis: JSON.stringify(initialAnalysis),
          improvements: JSON.stringify(evaluationResult.suggestedImprovements)
        });

        console.log('\n✨ Improvement result:', improvedResult);

        // Create final analysis with improvements
        const finalAnalysis: ProcessedEmail = {
          ...initialAnalysis,
          classification: {
            priority: improvedResult.classification.priority,
            reasoning: improvedResult.classification.reasoning,
            confidence: improvedResult.classification.confidence,
            timeOfDay
          },
          summary: {
            keyPoints: improvedResult.summary.keyPoints,
            actionItems: improvedResult.summary.actionItems,
            suggestedResponse: improvedResult.summary.suggestedResponse,
            confidence: improvedResult.summary.confidence
          }
        };

        console.log('\n✅ Final analysis:', finalAnalysis);
        return finalAnalysis;
      }

      // If no improvements needed, return initial analysis
      console.log('\n✅ Returning initial analysis as final result');
      return initialAnalysis;

    } catch (error) {
      console.error('\n❌ Error in email processing:', error);
      const errorResult: ProcessedEmail = {
        id: email.id,
        threadId: email.threadId,
        subject: email.subject,
        from: email.from,
        date: email.date,
        isRead: email.isRead,
        emailLink: email.emailLink,
        timestamp: email.timestamp,
        classification: {
          priority: "Normal" as const,
          reasoning: "Error in processing",
          confidence: 0,
          timeOfDay: this.getTimeOfDay(email.date)
        },
        summary: {
          keyPoints: ["Error in processing"],
          actionItems: [],
          suggestedResponse: "Unable to process email",
          confidence: 0
        }
      };
      console.log('\n⚠️ Returning error result:', errorResult);
      return errorResult;
    }
  }
}
