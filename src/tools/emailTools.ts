// tools/emailTools.ts
import { z } from "zod";
import { tool } from "@langchain/core/tools";
import { ChatOpenAI } from "@langchain/openai";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { config } from '../config';

// Interfaces for our expected data structures
interface EmailClassification {
  priority: "Urgent" | "Important" | "Normal";
  reasoning: string;
  confidence: number;
}

interface EmailSummary {
  keyPoints: string[];
  actionItems: string[];
  suggestedResponse?: string;
  confidence: number;
}

interface EvaluationResult {
  isAccurate: boolean;
  improvementNeeded: boolean;
  reasonForImprovement?: string;
  suggestedImprovements?: string[];
}

// Classification Tool
export const classifyEmailTool = tool(
  async ({ subject, from, content, isRead, timestamp }) => {
    console.log('\n🔍 Starting email classification...');
    
    const model = new ChatOpenAI({
      modelName: "gpt-4o-mini",
      temperature: 0.2,
      openAIApiKey: config.openAiApiKey,
    });

    const parser = new JsonOutputParser<EmailClassification>();
    
    const prompt = ChatPromptTemplate.fromTemplate(`
      Analyze this email and classify its priority. Be thorough and consider all aspects:
      From: {from}
      Subject: {subject}
      Content: {content}
      Read Status: {isRead}
      Time Received: {receivedTime}
      
      Consider:
      - Sender importance and relationship
      - Time sensitivity of the content
      - Action requirements
      - Business impact
      - Personal impact
      - Whether the email has been read
      - How long ago the email was received
      
      {format_instructions}
      
      Respond with a JSON object containing:
      - priority: Must be exactly "Urgent", "Important", or "Normal"
      - reasoning: Explanation for the priority classification
      - confidence: Number between 0 and 1 indicating confidence in classification
    `);

    const chain = prompt.pipe(model).pipe(parser);

    const response = await chain.invoke({
      from,
      subject,
      content,
      isRead: isRead ? "Read" : "Unread",
      receivedTime: timestamp ? new Date(timestamp).toLocaleString() : new Date().toLocaleString(),
      format_instructions: parser.getFormatInstructions()
    });

    console.log('\n📊 Classification result:', response);
    return response;
  },
  {
    name: "classify_email",
    description: "Classifies email priority with confidence score",
    schema: z.object({
      subject: z.string().describe("Email subject"),
      from: z.string().describe("Email sender"),
      content: z.string().describe("Email content"),
      isRead: z.boolean().optional().describe("Whether the email has been read"),
      timestamp: z.number().optional().describe("Timestamp when the email was received"),
    }),
  }
);

// Summarization Tool
export const summarizeEmailTool = tool(
  async ({ subject, content, isRead, timestamp }) => {
    console.log('\n📝 Starting email summarization...');
    
    const model = new ChatOpenAI({
      modelName: "gpt-4o-mini",
      temperature: 0.2,
      openAIApiKey: config.openAiApiKey,
    });

    const parser = new JsonOutputParser<EmailSummary>();
    
    const prompt = ChatPromptTemplate.fromTemplate(`
      Provide a detailed analysis of this email:
      Subject: {subject}
      Content: {content}
      Read Status: {isRead}
      Time Received: {receivedTime}
      
      Consider the email's read status and time received when suggesting actions.
      If the email is unread and recent, consider suggesting immediate review.
      
      {format_instructions}
      
      Respond with a JSON object containing:
      - keyPoints: Array of main points from the email
      - actionItems: Array of required actions
      - suggestedResponse: Optional response suggestion
      - confidence: Number between 0 and 1 indicating confidence in analysis
    `);

    const chain = prompt.pipe(model).pipe(parser);

    const response = await chain.invoke({
      subject,
      content,
      isRead: isRead ? "Read" : "Unread",
      receivedTime: timestamp ? new Date(timestamp).toLocaleString() : new Date().toLocaleString(),
      format_instructions: parser.getFormatInstructions()
    });

    console.log('\n📊 Summary result:', response);
    return response;
  },
  {
    name: "summarize_email",
    description: "Summarizes email content and suggests actions",
    schema: z.object({
      subject: z.string().describe("Email subject"),
      content: z.string().describe("Email content"),
      isRead: z.boolean().optional().describe("Whether the email has been read"),
      timestamp: z.number().optional().describe("Timestamp when the email was received"),
    }),
  }
);

// Evaluation Tool
export const evaluateAnalysisTool = tool(
  async ({ subject, content, classification, summary }) => {
    console.log('\n🔍 Starting analysis evaluation...');
    
    const model = new ChatOpenAI({
      modelName: "gpt-4o-mini",
      temperature: 0.2,
      openAIApiKey: config.openAiApiKey,
    });

    const parser = new JsonOutputParser<EvaluationResult>();
    
    const prompt = ChatPromptTemplate.fromTemplate(`
      Evaluate the quality and accuracy of this email analysis:
      
      Original Email:
      Subject: {subject}
      Content: {content}
      
      Current Analysis:
      Classification: {classification}
      Summary: {summary}
      
      Evaluate:
      1. Does the priority level match the content?
      2. Are the key points accurate and complete?
      3. Are action items correctly identified?
      4. Is the confidence appropriate?
      
      {format_instructions}
      
      Respond with a JSON object containing:
      - isAccurate: Boolean indicating if analysis is accurate
      - improvementNeeded: Boolean indicating if improvements are needed
      - reasonForImprovement: Optional string explaining why improvement is needed
      - suggestedImprovements: Optional array of suggested improvements
    `);

    const chain = prompt.pipe(model).pipe(parser);

    const response = await chain.invoke({
      subject,
      content,
      classification: JSON.stringify(classification),
      summary: JSON.stringify(summary),
      format_instructions: parser.getFormatInstructions()
    });

    console.log('\n📊 Evaluation result:', response);
    return response;
  },
  {
    name: "evaluate_analysis",
    description: "Evaluates and suggests improvements for email analysis",
    schema: z.object({
      subject: z.string().describe("Email subject"),
      content: z.string().describe("Email content"),
      classification: z.string().describe("Current classification result"),
      summary: z.string().describe("Current summary result"),
    }),
  }
);

// Improvement Tool
export const improveAnalysisTool = tool(
  async ({ subject, content, previousAnalysis, improvements }) => {
    console.log('\n🔄 Starting analysis improvement...');
    
    const model = new ChatOpenAI({
      modelName: "gpt-4o-mini",
      temperature: 0.2,
      openAIApiKey: config.openAiApiKey,
    });

    interface ImprovedAnalysis {
      classification: EmailClassification;
      summary: EmailSummary;
    }

    const parser = new JsonOutputParser<ImprovedAnalysis>();
    
    const prompt = ChatPromptTemplate.fromTemplate(`
      Improve the email analysis based on the suggested improvements:
      
      Original Email:
      Subject: {subject}
      Content: {content}
      
      Previous Analysis: {previousAnalysis}
      Suggested Improvements: {improvements}
      
      {format_instructions}
      
      Respond with a JSON object containing:
      - classification: Object with priority, reasoning, and confidence
      - summary: Object with keyPoints, actionItems, suggestedResponse, and confidence
    `);

    const chain = prompt.pipe(model).pipe(parser);

    const response = await chain.invoke({
      subject,
      content,
      previousAnalysis: JSON.stringify(previousAnalysis),
      improvements: JSON.stringify(improvements),
      format_instructions: parser.getFormatInstructions()
    });

    console.log('\n✨ Improvement result:', response);
    return response;
  },
  {
    name: "improve_analysis",
    description: "Improves email analysis based on evaluation",
    schema: z.object({
      subject: z.string().describe("Email subject"),
      content: z.string().describe("Email content"),
      previousAnalysis: z.string().describe("Previous analysis result"),
      improvements: z.string().describe("Suggested improvements"),
    }),
  }
);