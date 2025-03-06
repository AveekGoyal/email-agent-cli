# Email Agent CLI

An intelligent email management system that uses AI to analyze, classify, and summarize your emails, helping you prioritize and manage your inbox effectively. It also includes a specialized feature for analyzing Upwork job emails and generating creative portfolio project ideas based on in-demand skills.

## Features

- 📧 Automated email analysis and classification
- 🏷️ Priority-based categorization (Urgent, Important, Normal)
- 📝 Smart email summarization with key points extraction
- ✅ Action item identification
- 💡 Suggested responses generation
- 📊 Beautiful web-based dashboard for email visualization
- 🎯 High accuracy confidence scoring
- 🚀 Upwork job market analysis and portfolio project idea generation

## Upwork Portfolio Project Generator

This specialized feature analyzes your Upwork job notification emails to:

1. **Identify In-Demand Skills**: Analyzes emails to determine which skills, technologies, and project types are most in demand
2. **Discover Market Trends**: Identifies emerging trends and client preferences in the freelance marketplace
3. **Generate Original Project Ideas**: Creates 15 unique portfolio project ideas that showcase the most in-demand skills
4. **Exclude Unwanted Technologies**: Automatically filters out WordPress, PHP, and Laravel-related projects
5. **Focus on Modern Tech**: Prioritizes projects using React, Next.js, Node.js, AI integration, and other modern technologies

The analysis results are saved to:
- `public/skill-demand-analysis.json`: Detailed breakdown of in-demand skills and technologies
- `public/portfolio-suggestions.json`: 15 original portfolio project ideas with descriptions and relevance explanations

## Tech Stack

- **Backend**
  - Node.js
  - TypeScript
  - Gmail API
  - Anthropic Claude 3.7 Sonnet API
  - LangChain

- **Frontend**
  - HTML5
  - Tailwind CSS for styling
  - Vanilla JavaScript
  - Static file generation

## Prerequisites

1. Node.js and npm installed
2. Claude API key
3. Google Cloud project with Gmail API enabled

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/AveekGoyal/email-agent-cli.git
   cd email-agent-cli
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory:
   ```env
   CLAUDE_API_KEY=your_claude_api_key
   ```

4. Set up Google OAuth credentials:
   - Create a project in Google Cloud Console
   - Enable the Gmail API
   - Create OAuth credentials
   - Download the credentials and save as `credentials.json` in the project root

## Usage

1. Run the application:
   ```bash
   npm start
   ```

2. The application will:
   - Fetch your recent emails from Gmail
   - Analyze and classify each email
   - Generate summaries and action items
   - Save the results to `public/analysis-results.json`
   - Analyze Upwork emails from March 4-6, 2025
   - Generate skill demand analysis and portfolio project ideas
   - Save results to `public/skill-demand-analysis.json` and `public/portfolio-suggestions.json`

3. View the results:
   - Open `public/index.html` in your browser to see the email analysis dashboard
   - Check `public/portfolio-suggestions.json` for Upwork portfolio project ideas
   - Examine `public/skill-demand-analysis.json` for detailed skill demand insights

## How It Works

1. **Email Fetching**: The application uses Gmail API to fetch your recent emails
2. **AI Analysis**: Each email is analyzed using Anthropic Claude API to:
   - Determine priority
   - Extract key points
   - Identify action items
   - Generate suggested responses
3. **Upwork Analysis**: A two-step process for analyzing Upwork emails:
   - **Step 1: Skill Demand Analysis**
     - Identifies the most in-demand technologies, skills, and categories
     - Discovers emerging trends and client insights
     - Assigns demand scores to each skill and technology
   - **Step 2: Portfolio Project Generation**
     - Uses the skill demand analysis to generate original project ideas
     - Creates detailed project descriptions with relevant skills
     - Ensures projects showcase the most in-demand skills
4. **Result Storage**: All analysis results are stored as JSON files for easy access
5. **Visualization**: A simple web interface displays your analyzed emails and portfolio suggestions

## Project Structure

The project is organized into several key directories and files:

### Source Code (`src/`)

#### Core Components
- `index.ts`: Entry point of the application. Handles the main execution flow and CLI interface.

#### Agents
- `agents/emailAgent.ts`: Core email processing agent that orchestrates the analysis workflow
- `agents/upworkAgent.ts`: Specialized agent for analyzing Upwork emails and generating portfolio project ideas

#### Tools
- `tools/emailTools.ts`: Collection of tools for email analysis, classification, and summarization
- `tools/upworkTools.ts`: Tools for analyzing Upwork emails, identifying skill demand, and generating portfolio project ideas

#### Services
- `services/gmailService.ts`: Handles Gmail API integration and email fetching
- `services/fileService.ts`: Manages file operations for storing analysis results

#### Configuration
- `config.ts`: Central configuration for API keys, model settings, and application parameters

### Output (`public/`)
- `index.html`: Web dashboard for visualizing email analysis results
- `analysis-results.json`: Structured data from email analysis
- `skill-demand-analysis.json`: Analysis of in-demand skills from Upwork emails
- `portfolio-suggestions.json`: Generated portfolio project ideas

## Dashboard Features

The web dashboard provides a visual interface to:

- **Email Overview**: See all analyzed emails at a glance
- **Priority Filtering**: Filter emails by priority level
- **Action Items**: View suggested actions for each email
- **Smart Summaries**: Get AI-generated summaries of email content
- **Confidence Scores**: See the AI's confidence in its analysis
- **Portfolio Projects**: Browse suggested portfolio project ideas

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Anthropic Claude](https://www.anthropic.com/claude) for providing the AI capabilities
- [LangChain](https://js.langchain.com/) for the AI framework
- [Gmail API](https://developers.google.com/gmail/api) for email access
