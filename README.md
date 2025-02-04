# Email Agent CLI

An intelligent email management system that uses AI to analyze, classify, and summarize your emails, helping you prioritize and manage your inbox effectively.

## Features

- 📧 Automated email analysis and classification
- 🏷️ Priority-based categorization (Urgent, Important, Normal)
- 📝 Smart email summarization with key points extraction
- ✅ Action item identification
- 💡 Suggested responses generation
- 📊 Beautiful web-based dashboard for email visualization
- 🎯 High accuracy confidence scoring

## Tech Stack

- **Backend**
  - Node.js
  - TypeScript
  - Gmail API
  - OpenAI GPT API
  - LangChain

- **Frontend**
  - HTML5
  - Tailwind CSS for styling
  - Vanilla JavaScript
  - Static file generation

## Prerequisites

Before you begin, ensure you have the following:

1. Node.js (v16 or higher)
2. npm or yarn
3. A Google Cloud Platform account
4. An OpenAI API key

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/email-agent-cli.git
cd email-agent-cli
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
OPENAI_API_KEY=your_openai_api_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=your_redirect_uri
```

## Google Cloud Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Enable the Gmail API:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Gmail API"
   - Click "Enable"

4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Select "Desktop application" (since this is a CLI tool)
   - Download the client credentials JSON file

5. Configure OAuth consent screen:
   - Go to "APIs & Services" > "OAuth consent screen"
   - Select "External"
   - Fill in the required information
   - Add the following scopes:
     - `https://www.googleapis.com/auth/gmail.readonly`
     - `https://www.googleapis.com/auth/gmail.labels`

## OpenAI API Setup

1. Go to [OpenAI's website](https://platform.openai.com)
2. Create an account or sign in
3. Navigate to the API section
4. Generate an API key
5. Copy the key and add it to your `.env` file

## Usage

1. Start the application:
```bash
npm start
```

2. The application will:
   - Prompt you to authenticate with Google in your browser
   - After authentication, it will fetch your recent emails
   - Analyze them using AI
   - Generate analysis results in the `public` folder

3. View the analysis results:
   - Open `public/index.html` in your web browser
   - The dashboard will show your emails categorized by priority
   - Each email card contains:
     - Read/Unread status
     - Priority level
     - Key points from the email
     - Suggested action items
     - Direct link to open in Gmail

## How It Works

1. **Email Fetching**: The application uses Gmail API to fetch your recent emails
2. **AI Analysis**: Each email is analyzed using OpenAI's GPT model to:
   - Determine priority
   - Extract key points
   - Identify action items
   - Generate suggested responses
3. **Results Generation**: 
   - Analysis results are saved to `public/analysis-results.json`
   - A static dashboard (`public/index.html`) displays the results
   - No server is required - just open the HTML file in your browser

## Project Structure

The project is organized into several key directories and files:

### Source Code (`src/`)

#### Core Components
- `index.ts`: Entry point of the application. Handles the main execution flow and CLI interface.

#### Agents
- `agents/emailAgent.ts`: Core email processing agent that orchestrates the analysis workflow:
  - Manages the AI model configuration
  - Coordinates between different analysis tools
  - Handles confidence thresholds and result validation
  - Implements retry and improvement logic for low-confidence results

#### Services
- `services/gmail.ts`: Gmail API integration service:
  - Handles Gmail authentication
  - Fetches emails and their metadata
  - Manages API scopes and permissions
  - Provides methods for email operations

#### Tools
- `tools/emailTools.ts`: Collection of AI-powered email analysis tools:
  - Email classification tool (priority determination)
  - Email summarization tool (key points extraction)
  - Analysis evaluation tool (quality checking)
  - Analysis improvement tool (refinement of results)

#### Types and Interfaces
- `types/index.ts`: TypeScript type definitions:
  - Email data structures
  - Classification results
  - Summary formats
  - API response types

### Public Assets (`public/`)
- `index.html`: Static dashboard for visualizing email analysis:
  - Priority-based email cards
  - Filtering and sorting capabilities
  - Interactive UI elements
- `analysis-results.json`: Generated file containing processed email data

### Configuration
- `.env`: Environment configuration file:
  - API keys
  - Authentication credentials
  - Service configurations

### Documentation
- `README.md`: Project documentation
- `LICENSE`: MIT license file

## File Relationships

1. The process starts in `index.ts`, which initializes the email agent
2. `emailAgent.ts` uses the Gmail service to fetch emails and coordinates the analysis
3. `gmail.ts` handles all Gmail API interactions
4. `emailTools.ts` provides the AI-powered analysis capabilities
5. Results are saved to `analysis-results.json`
6. The dashboard in `index.html` reads and displays the results

## Dashboard Features

- **Priority Filtering**: Filter emails by Urgent, Important, or Normal priority
- **Read/Unread Status**: Quickly identify unread emails
- **Direct Gmail Links**: Open any email directly in Gmail
- **Action Items**: View suggested actions for each email
- **Smart Summaries**: Get AI-generated summaries of email content
- **Confidence Scores**: See the AI's confidence in its analysis

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Error Handling

If you encounter any issues:

1. Check your API keys and credentials
2. Ensure all required scopes are enabled in Google Cloud Console
3. Verify your `.env` file contains all required variables
4. Check the console for error messages
5. Ensure you have sufficient API credits (OpenAI)

## Security Notes

- Never commit your `.env` file
- Keep your API keys secure
- Regularly rotate your credentials
- Monitor your API usage
- Review OAuth consent screen settings periodically

## Support

For support, please open an issue in the GitHub repository or contact the maintainers.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Development

The project uses Tailwind CSS for styling. The following files are important for frontend development:

- `public/index.html`: Main dashboard interface
- `public/styles.css`: Tailwind CSS imports
- `tailwind.config.js`: Tailwind configuration
- `postcss.config.js`: PostCSS configuration

To modify styles:
1. Use Tailwind utility classes directly in HTML
2. For custom styles, extend the theme in `tailwind.config.js`
3. The dashboard uses Tailwind's JIT (Just-In-Time) compiler via CDN for development

## Dashboard Features

The dashboard (`public/index.html`) provides a modern interface with:

- **Email Management**
  - Priority-based email cards with distinct visual indicators
  - Read/Unread status badges
  - Time-of-day filtering

- **Analysis Display**
  - Key points extraction
  - Action items identification
  - Suggested responses
  - Confidence scores

- **UI Components**
  - Responsive grid layout
  - Interactive filter buttons
  - File upload functionality
  - Direct Gmail links

- **Visual Hierarchy**
  - Priority-based color coding
  - Clear section organization
  - Modern card design
  - Responsive layout for all screen sizes
