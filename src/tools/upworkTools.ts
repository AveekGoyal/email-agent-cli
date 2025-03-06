// tools/upworkTools.ts
import { z } from "zod";
import { tool } from "@langchain/core/tools";
import { ChatAnthropic } from "@langchain/anthropic";
import { config } from '../config';
import * as fs from 'fs';
import * as path from 'path';

// Interface for skill demand analysis
interface SkillDemandAnalysis {
  topTechnologies: Array<{name: string, demandScore: number}>;
  topCategories: Array<{category: string, demandScore: number}>;
  topSkills: Array<{skill: string, demandScore: number}>;
  emergingTrends: string[];
  insights: string[];
}

// Interface for portfolio project suggestions
interface PortfolioProjectSuggestion {
  projectTitle: string;
  projectDescription: string;
  relevantSkills: string[];
  difficultyLevel: "Beginner" | "Intermediate" | "Advanced";
  estimatedTimeToComplete: string;
  whyRelevant: string;
  confidence: number;
}

// Helper function to extract text content from model response
function getTextFromModelResponse(response: any): string {
  console.log('Raw model response type:', typeof response);
  
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
      const jsonContent = jsonMatch[1].trim();
      console.log('Extracted JSON content from markdown code block');
      return JSON.parse(jsonContent);
    }
    
    // If no code blocks, try to find array pattern
    const arrayMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (arrayMatch) {
      console.log('Extracted JSON array pattern');
      return JSON.parse(arrayMatch[0]);
    }
    
    // If still no match, try to parse the whole text as JSON
    console.log('Attempting to parse whole text as JSON');
    return JSON.parse(text.trim());
  } catch (error) {
    console.error('Error extracting JSON from text:', error);
    console.log('Raw text received (first 500 chars):', text.substring(0, 500) + '...');
    
    // Save the full raw text to a file for debugging
    try {
      saveRawResponse(text, 'json-extraction-error.txt');
    } catch (e) {
      console.error('Error saving raw text:', e);
    }
    
    // Fallback: try to manually extract and build the JSON
    try {
      console.log('Attempting manual JSON extraction...');
      
      // Look for project titles and descriptions
      const projects = [];
      const titleRegex = /"projectTitle"\s*:\s*"([^"]+)"/g;
      const descRegex = /"projectDescription"\s*:\s*"([^"]+)"/g;
      const skillsRegex = /"relevantSkills"\s*:\s*\[([^\]]+)\]/g;
      const difficultyRegex = /"difficultyLevel"\s*:\s*"([^"]+)"/g;
      const timeRegex = /"estimatedTimeToComplete"\s*:\s*"([^"]+)"/g;
      const whyRegex = /"whyRelevant"\s*:\s*"([^"]+)"/g;
      
      const titles = [];
      const descriptions = [];
      const skills = [];
      const difficulties = [];
      const times = [];
      const whys = [];
      
      let match;
      
      // Extract titles
      while ((match = titleRegex.exec(text)) !== null) {
        titles.push(match[1]);
      }
      
      // Extract descriptions
      while ((match = descRegex.exec(text)) !== null) {
        descriptions.push(match[1]);
      }
      
      // Extract skills
      while ((match = skillsRegex.exec(text)) !== null) {
        const skillsText = match[1];
        const skillsList = skillsText.split(',').map(s => {
          return s.trim().replace(/"/g, '');
        });
        skills.push(skillsList);
      }
      
      // Extract difficulties
      while ((match = difficultyRegex.exec(text)) !== null) {
        difficulties.push(match[1]);
      }
      
      // Extract times
      while ((match = timeRegex.exec(text)) !== null) {
        times.push(match[1]);
      }
      
      // Extract whys
      while ((match = whyRegex.exec(text)) !== null) {
        whys.push(match[1]);
      }
      
      // Build projects
      for (let i = 0; i < titles.length; i++) {
        projects.push({
          projectTitle: titles[i] || `Project ${i+1}`,
          projectDescription: descriptions[i] || `Description for project ${i+1}`,
          relevantSkills: skills[i] || ['AI Integration', 'React.js', 'Next.js', 'Node.js', 'Responsive Design'],
          difficultyLevel: difficulties[i] || 'Intermediate',
          estimatedTimeToComplete: times[i] || '2-3 weeks',
          whyRelevant: whys[i] || 'This project showcases in-demand skills and modern technologies',
          confidence: 0.85
        });
      }
      
      if (projects.length > 0) {
        console.log(`Manually extracted ${projects.length} projects`);
        return projects;
      }
      
      throw new Error('Could not manually extract JSON');
    } catch (fallbackError) {
      console.error('Fallback extraction failed:', fallbackError);
      throw error; // Throw the original error
    }
  }
}

// Save raw response to file for debugging
function saveRawResponse(response: string, filename: string): void {
  try {
    const publicDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir);
    }
    
    const outputPath = path.join(publicDir, filename);
    fs.writeFileSync(outputPath, response);
    console.log(`Raw response saved to ${outputPath}`);
  } catch (error) {
    console.error(`Error saving to ${filename}:`, error);
  }
}

// Analyze Upwork emails for skill demand
export const analyzeUpworkSkillDemandTool = tool(
  async ({ emails }) => {
    console.log('\nud83dudd0d Starting Upwork email analysis for skill demand...');
    
    const model = new ChatAnthropic({
      modelName: "claude-3-7-sonnet-20250219",
      temperature: 0.2,
      anthropicApiKey: config.claudeApiKey,
    });

    const promptText = `
      You are a data analyst specializing in freelance market trends and skill demand analysis.
      
      I want you to analyze these ${emails.length} Upwork job emails to identify the most in-demand skills, 
      technologies, and project categories. Focus on identifying patterns and trends.
      
      Upwork Emails:
      ${JSON.stringify(emails)}
      
      Analyze these emails and provide:
      
      1. The top 10 most requested technologies (like React, Node.js, etc.) with a demand score (1-10)
      2. The top 5 categories of work (like AI Development, Frontend Development, etc.) with a demand score (1-10)
      3. The top 10 specific skills (like API Integration, UI/UX Design, etc.) with a demand score (1-10)
      4. 5 emerging trends you've noticed in these job postings
      5. 5 key insights about what clients are looking for
      
      IMPORTANT: 
      - Exclude WordPress, PHP, and Laravel from your analysis
      - Focus on modern technologies and approaches
      - Be specific and data-driven in your analysis
      - Use the actual frequency of mentions in the emails to determine demand scores
      
      Respond with a JSON object containing:
      - topTechnologies: Array of {name, demandScore} objects
      - topCategories: Array of {category, demandScore} objects
      - topSkills: Array of {skill, demandScore} objects
      - emergingTrends: Array of strings
      - insights: Array of strings
    `;

    try {
      // Call the model with the prompt text
      const response = await model.invoke(promptText);
      
      // Extract text content from the response
      const responseText = getTextFromModelResponse(response);
      
      // Save raw response for debugging
      saveRawResponse(responseText, 'skill-demand-analysis.txt');
      
      // Parse the JSON from the response text
      const result = extractJsonFromText(responseText) as SkillDemandAnalysis;
      
      console.log('\nud83dudcca Skill demand analysis:', result);
      return result;
    } catch (error) {
      console.error('Error in skill demand analysis:', error);
      return {
        topTechnologies: [],
        topCategories: [],
        topSkills: [],
        emergingTrends: [],
        insights: []
      };
    }
  },
  {
    name: "analyze_upwork_skill_demand",
    description: "Analyzes Upwork emails to identify in-demand skills and technologies",
    schema: z.object({
      emails: z.array(z.object({
        subject: z.string().describe("Email subject"),
        from: z.string().describe("Email sender"),
        content: z.string().describe("Email content"),
        date: z.string().describe("Email date")
      })).describe("Array of Upwork emails to analyze")
    }),
  }
);

// Generate portfolio project ideas based on skill demand analysis
export const generatePortfolioProjectsTool = tool(
  async ({ skillDemandAnalysis }) => {
    console.log('\nud83dudd0d Generating portfolio project ideas based on skill demand analysis...');
    
    const model = new ChatAnthropic({
      modelName: "claude-3-7-sonnet-20250219",
      temperature: 0.7, // Higher temperature for more creativity
      anthropicApiKey: config.claudeApiKey,
    });

    const promptText = `
      You are a creative portfolio advisor specializing in helping developers showcase their skills effectively.
      
      Based on this analysis of in-demand skills and technologies from Upwork job postings:
      ${JSON.stringify(skillDemandAnalysis)}
      
      Generate 15 HIGHLY ORIGINAL portfolio project ideas that would:
      1. Showcase the most in-demand skills and technologies identified in the analysis
      2. Demonstrate technical expertise and problem-solving abilities
      3. Be visually impressive and stand out to potential clients
      4. Be practical to complete in a reasonable timeframe (1-4 weeks)
      5. Highlight modern technologies and approaches
      
      IMPORTANT CONSTRAINTS:
      - DO NOT suggest any WordPress, PHP, or Laravel-related projects
      - DO NOT suggest generic or common projects like "e-commerce site" or "blog platform"
      - Each project must be highly original, creative, and specific
      - Focus on projects that combine multiple in-demand skills in interesting ways
      - Include a mix of difficulty levels (beginner, intermediate, advanced)
      - Include projects that demonstrate both frontend and backend capabilities
      - Projects should NOT directly match typical job postings but instead showcase the same skills
      
      Make each project idea SPECIFIC and UNIQUE - not generic templates. For example, instead of "AI Chatbot", 
      suggest "Personalized Nutrition Coach AI that analyzes food photos and provides tailored advice".
      
      Respond with an array of exactly 15 JSON objects, each containing:
      - projectTitle: A clear, concise, creative title for the portfolio project
      - projectDescription: Detailed description of what the project entails and its unique features (at least 3 sentences)
      - relevantSkills: Array of at least 5 specific skills this project would showcase
      - difficultyLevel: Must be exactly "Beginner", "Intermediate", or "Advanced"
      - estimatedTimeToComplete: Estimated time to complete (e.g., "2-3 days", "1-2 weeks")
      - whyRelevant: Explanation of why this project would impress clients and showcase abilities (at least 2 sentences)
      - confidence: Number between 0 and 1 indicating confidence in this suggestion
    `;

    try {
      // Call the model with the prompt text
      const response = await model.invoke(promptText);
      
      // Extract text content from the response
      const responseText = getTextFromModelResponse(response);
      
      // Save raw response for debugging
      saveRawResponse(responseText, 'portfolio-project-ideas.txt');
      
      // Parse the JSON from the response text
      const result = extractJsonFromText(responseText) as PortfolioProjectSuggestion[];
      
      console.log('\nud83dudcca Portfolio project suggestions:', result);
      return result;
    } catch (error) {
      console.error('Error in portfolio project generation:', error);
      return [];
    }
  },
  {
    name: "generate_portfolio_projects",
    description: "Generates portfolio project ideas based on skill demand analysis",
    schema: z.object({
      skillDemandAnalysis: z.object({
        topTechnologies: z.array(z.object({
          name: z.string(),
          demandScore: z.number()
        })),
        topCategories: z.array(z.object({
          category: z.string(),
          demandScore: z.number()
        })),
        topSkills: z.array(z.object({
          skill: z.string(),
          demandScore: z.number()
        })),
        emergingTrends: z.array(z.string()),
        insights: z.array(z.string())
      }).describe("Analysis of in-demand skills and technologies")
    }),
  }
);

// Legacy tool for backward compatibility
export const analyzeUpworkEmailsTool = tool(
  async ({ emails }) => {
    console.log('\nud83dudd0d Starting Upwork email analysis for portfolio projects (legacy method)...');
    
    try {
      // First analyze skill demand
      const skillDemandAnalysis = await analyzeUpworkSkillDemandTool.invoke({ emails });
      
      // Then generate portfolio projects based on the analysis
      const portfolioProjects = await generatePortfolioProjectsTool.invoke({ skillDemandAnalysis });
      
      return portfolioProjects;
    } catch (error) {
      console.error('Error in portfolio project suggestions:', error);
      return [];
    }
  },
  {
    name: "analyze_upwork_emails",
    description: "Analyzes Upwork emails and suggests portfolio projects",
    schema: z.object({
      emails: z.array(z.object({
        subject: z.string().describe("Email subject"),
        from: z.string().describe("Email sender"),
        content: z.string().describe("Email content"),
        date: z.string().describe("Email date")
      })).describe("Array of Upwork emails to analyze")
    }),
  }
);
