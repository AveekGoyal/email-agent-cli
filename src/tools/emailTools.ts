// tools/emailTools.ts
import { z } from "zod";
import { tool } from "@langchain/core/tools";
import { ChatAnthropic } from "@langchain/anthropic";
import { StringOutputParser } from "@langchain/core/output_parsers";
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

// Helper function to extract text content from model response
function getTextFromModelResponse(response: any): string {
  // Handle different response formats
  if (typeof response.content === 'string') {
    return response.content;
  } else if (Array.isArray(response.content)) {
    // If it's an array of content parts, concatenate all text parts
    return response.content
      .filter((part: any) => typeof part === 'string' || part.type === 'text')
      .map((part: any) => typeof part === 'string' ? part : part.text)
      .join('');
  } else if (response.text) {
    return response.text;
  } else {
    // Fallback
    return JSON.stringify(response);
  }
}

// Helper function to extract JSON from text that might contain markdown
function extractJsonFromText(text: string): any {
  try {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      return JSON.parse(jsonMatch[1].trim());
    }
    
    // If no code blocks, try to parse the whole text as JSON
    return JSON.parse(text.trim());
  } catch (error) {
    console.error('Error extracting JSON from text:', error);
    throw error;
  }
}

// Classification Tool
export const classifyEmailTool = tool(
  async ({ subject, from, content, isRead, timestamp }) => {
    console.log('\n🔍 Starting email classification...');
    
    const model = new ChatAnthropic({
      modelName: "claude-3-7-sonnet-20250219",
      temperature: 0.2,
      anthropicApiKey: config.claudeApiKey,
    });

    const promptText = `
      Analyze this email and classify its priority. Be thorough and consider all aspects:
      From: ${from}
      Subject: ${subject}
      Content: ${content}
      Read Status: ${isRead ? "Read" : "Unread"}
      Time Received: ${timestamp ? new Date(timestamp).toLocaleString() : new Date().toLocaleString()}
      
      Consider:
      - Sender importance and relationship
      - Time sensitivity of the content
      - Action requirements
      - Business impact
      - Personal impact
      - Whether the email has been read
      - How long ago the email was received
      
      Respond with a JSON object containing:
      - priority: Must be exactly "Urgent", "Important", or "Normal"
      - reasoning: Explanation for the priority classification
      - confidence: Number between 0 and 1 indicating confidence in classification
    `;

    try {
      // Call the model directly with the prompt text
      const response = await model.invoke(promptText);
      
      // Extract text content from the response
      const responseText = getTextFromModelResponse(response);
      
      // Parse the JSON from the response text
      const result = extractJsonFromText(responseText) as EmailClassification;
      
      console.log('\n📊 Classification result:', result);
      return result;
    } catch (error) {
      console.error('Error in classification:', error);
      return {
        priority: "Normal" as const,
        reasoning: "Error in processing",
        confidence: 0.5
      };
    }
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
    
    const model = new ChatAnthropic({
      modelName: "claude-3-7-sonnet-20250219",
      temperature: 0.2,
      anthropicApiKey: config.claudeApiKey,
    });

    const promptText = `
      Provide a detailed analysis of this email:
      Subject: ${subject}
      Content: ${content}
      Read Status: ${isRead ? "Read" : "Unread"}
      Time Received: ${timestamp ? new Date(timestamp).toLocaleString() : new Date().toLocaleString()}
      
      Consider the email's read status and time received when suggesting actions.
      If the email is unread and recent, consider suggesting immediate review.
      
      Respond with a JSON object containing:
      - keyPoints: Array of main points from the email
      - actionItems: Array of required actions
      - suggestedResponse: Optional response suggestion
      - confidence: Number between 0 and 1 indicating confidence in analysis
    `;

    try {
      // Call the model directly with the prompt text
      const response = await model.invoke(promptText);
      
      // Extract text content from the response
      const responseText = getTextFromModelResponse(response);
      
      // Parse the JSON from the response text
      const result = extractJsonFromText(responseText) as EmailSummary;
      
      console.log('\n📊 Summary result:', result);
      return result;
    } catch (error) {
      console.error('Error in summarization:', error);
      return {
        keyPoints: ["Error in processing"],
        actionItems: [],
        suggestedResponse: "Unable to process email",
        confidence: 0.5
      };
    }
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
    
    const model = new ChatAnthropic({
      modelName: "claude-3-7-sonnet-20250219",
      temperature: 0.2,
      anthropicApiKey: config.claudeApiKey,
    });

    const promptText = `
      Evaluate the quality and accuracy of this email analysis:
      
      Original Email:
      Subject: ${subject}
      Content: ${content}
      
      Current Analysis:
      Classification: ${classification}
      Summary: ${summary}
      
      Evaluate:
      1. Does the priority level match the content?
      2. Are the key points accurate and complete?
      3. Are action items correctly identified?
      4. Is the confidence appropriate?
      
      Respond with a JSON object containing:
      - isAccurate: Boolean indicating if analysis is accurate
      - improvementNeeded: Boolean indicating if improvements are needed
      - reasonForImprovement: Optional string explaining why improvement is needed
      - suggestedImprovements: Optional array of suggested improvements
    `;

    try {
      // Call the model directly with the prompt text
      const response = await model.invoke(promptText);
      
      // Extract text content from the response
      const responseText = getTextFromModelResponse(response);
      
      // Parse the JSON from the response text
      const result = extractJsonFromText(responseText) as EvaluationResult;
      
      console.log('\n📊 Evaluation result:', result);
      return result;
    } catch (error) {
      console.error('Error in evaluation:', error);
      return {
        isAccurate: true,
        improvementNeeded: false
      };
    }
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
    
    const model = new ChatAnthropic({
      modelName: "claude-3-7-sonnet-20250219",
      temperature: 0.2,
      anthropicApiKey: config.claudeApiKey,
    });

    interface ImprovedAnalysis {
      classification: EmailClassification;
      summary: EmailSummary;
    }

    const promptText = `
      Improve the email analysis based on the suggested improvements:
      
      Original Email:
      Subject: ${subject}
      Content: ${content}
      
      Previous Analysis: ${previousAnalysis}
      Suggested Improvements: ${improvements}
      
      Respond with a JSON object containing:
      - classification: Object with priority, reasoning, and confidence
      - summary: Object with keyPoints, actionItems, suggestedResponse, and confidence
    `;

    try {
      // Call the model directly with the prompt text
      const response = await model.invoke(promptText);
      
      // Extract text content from the response
      const responseText = getTextFromModelResponse(response);
      
      // Parse the JSON from the response text
      const result = extractJsonFromText(responseText) as ImprovedAnalysis;
      
      console.log('\n✨ Improvement result:', result);
      return result;
    } catch (error) {
      console.error('Error in improvement:', error);
      return {
        classification: {
          priority: "Normal" as const,
          reasoning: "Error in processing",
          confidence: 0.5
        },
        summary: {
          keyPoints: ["Error in processing"],
          actionItems: [],
          suggestedResponse: "Unable to process email",
          confidence: 0.5
        }
      };
    }
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