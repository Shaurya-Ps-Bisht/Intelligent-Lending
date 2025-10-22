# Bedrock AgentCore Streaming Interface

A Next.js application for streaming data from AWS Bedrock AgentCore agents with real-time visualization across 5 different agent types.

## Features

- **AWS Cognito Authentication**: Secure login with AWS Cognito User Pools
- **Real-time Streaming**: Stream data from Bedrock AgentCore endpoints
- **5 Agent Canvases**: Separate visualization for VALIDATION, RESEARCH, ANALYSIS, SYNTHESIS, and EXECUTION agents
- **Live Data Parsing**: Parse JSON chunks and display agent-specific data
- **Secure Configuration**: Agent ARN stored server-side for security
- **Responsive UI**: Clean, modern interface with Tailwind CSS
- **Error Handling**: Comprehensive error handling and user feedback

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm
- AWS Bedrock AgentCore access with valid agent ARN
- AWS Cognito User Pool configured for authentication

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Set up environment variables:

Copy `.env.example` to `.env.local` and configure:

```env
# AWS Configuration
AWS_REGION=us-east-1

# Bedrock AgentCore Configuration (Server-side only - KEEP SECRET)
BEDROCK_AGENT_ARN=arn:aws:bedrock-agentcore:us-east-1:123456789012:agent/ABCDEFGHIJ

# AWS Cognito Configuration
NEXT_PUBLIC_AWS_COGNITO_REGION=us-east-1
NEXT_PUBLIC_AWS_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
NEXT_PUBLIC_AWS_COGNITO_USER_POOL_WEB_CLIENT_ID=abcdefghijklmnopqrstuvwxyz

# Optional: Set default values for development
NEXT_PUBLIC_DEFAULT_SESSION_ID=default-session-123
```

**Important**: The `BEDROCK_AGENT_ARN` is kept server-side for security and will not be exposed to the client.

4. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Authentication

1. **Sign In**: Use your AWS Cognito credentials to authenticate
2. **Automatic Token Management**: Bearer tokens are automatically obtained from Cognito

### Configuration

Fill in the required fields in the configuration form:

- **Session ID** (required): Unique session identifier
- **Endpoint Name** (optional): Defaults to "DEFAULT"
- **Payload**: JSON payload to send to the agent

**Note**: Agent ARN and Bearer Token are automatically handled by the application.

### Streaming Data

1. Sign in with your Cognito credentials
2. Configure your session parameters
3. Click "Start Streaming" to begin receiving data
4. Watch as data streams into the appropriate agent canvases
5. Use "Clear Data" to reset all canvases
6. Sign out when finished

### Expected Data Format

The application expects streaming chunks in this format:

```json
{
  "type": "agent_start",
  "agent": "VALIDATION",
  "timestamp": "2025-10-22T11:23:28Z"
}
```

```json
{
  "type": "agent_chunk",
  "agent": "VALIDATION", 
  "data": "<thinking> I need to validate...",
  "timestamp": "2025-10-22T11:23:29Z"
}
```

### Supported Agent Types

- **VALIDATION**: Blue canvas - Data validation and verification
- **RESEARCH**: Green canvas - Research and information gathering  
- **ANALYSIS**: Purple canvas - Data analysis and processing
- **SYNTHESIS**: Orange canvas - Information synthesis and combination
- **EXECUTION**: Red canvas - Action execution and implementation

## Architecture

### Components

- **AuthProvider**: Cognito authentication context provider
- **LoginForm**: Secure login interface
- **StreamingInterface**: Main component handling the UI and streaming logic
- **AgentCanvas**: Individual canvas component for each agent type
- **useAgentStream**: Custom hook for managing streaming state and data

### API Routes

- **`/api/invoke-agent`**: Proxy endpoint for Bedrock AgentCore API calls with streaming support

### Key Files

```
src/
├── app/
│   ├── api/invoke-agent/route.ts    # API route for agent invocation
│   ├── page.tsx                     # Main page with auth guard
│   └── layout.tsx                   # App layout with auth provider
├── components/
│   ├── AuthProvider.tsx            # Cognito authentication provider
│   ├── LoginForm.tsx               # Login interface
│   ├── StreamingInterface.tsx       # Main streaming interface
│   └── AgentCanvas.tsx             # Individual agent canvas
├── hooks/
│   └── useAgentStream.ts           # Streaming logic hook
├── lib/
│   └── cognito.ts                  # Cognito authentication utilities
└── types/
    └── agent.ts                    # TypeScript type definitions
```

## Development

### Adding New Agent Types

1. Update the `AgentType` in `src/types/agent.ts`
2. Add the new agent to the `AgentData` interface
3. Update the color mapping in `AgentCanvas.tsx`
4. The streaming interface will automatically include the new agent

### Customizing Styling

The app uses Tailwind CSS. Modify the classes in the components or update the global styles in `src/app/globals.css`.

## Troubleshooting

### Common Issues

1. **Authentication Errors**: 
   - Verify Cognito User Pool ID and Client ID are correct
   - Ensure user exists in the Cognito User Pool
   - Check that the user pool allows the configured authentication flow

2. **Agent ARN Configuration**: 
   - Verify `BEDROCK_AGENT_ARN` is set correctly in `.env.local`
   - Ensure the ARN format matches: `arn:aws:bedrock-agentcore:region:account:agent/agent-id`

3. **CORS Errors**: Ensure your Bedrock AgentCore endpoint allows requests from your domain

4. **Network Issues**: Check your AWS region configuration and network connectivity

5. **Parsing Errors**: Ensure your agent returns data in the expected JSON format

### Debug Mode

Check the browser console for detailed logging of:
- Received chunks
- Parsing errors  
- Network requests
- Stream status

## License

This project is licensed under the MIT License.
## AWS
 Amplify Deployment

This application is designed to be deployed on AWS Amplify with secure environment variable management:

### Environment Variables for Production

In your Amplify console, configure these environment variables:

**Build Settings:**
- `AWS_REGION`: Your AWS region
- `BEDROCK_AGENT_ARN`: Your agent ARN (kept secure on server-side)

**Frontend Settings:**
- `NEXT_PUBLIC_AWS_COGNITO_REGION`: Your Cognito region
- `NEXT_PUBLIC_AWS_COGNITO_USER_POOL_ID`: Your User Pool ID
- `NEXT_PUBLIC_AWS_COGNITO_USER_POOL_WEB_CLIENT_ID`: Your Client ID
- `NEXT_PUBLIC_DEFAULT_SESSION_ID`: Default session ID (optional)

### Security Benefits

- **Agent ARN Protection**: The agent ARN is never exposed to the client-side code
- **Cognito Integration**: Secure authentication with AWS Cognito
- **Token Management**: Automatic bearer token handling
- **Environment Isolation**: Different configurations for dev/staging/production

### Deployment Steps

1. Connect your repository to AWS Amplify
2. Configure environment variables in the Amplify console
3. Set up your Cognito User Pool and users
4. Deploy and test the authentication flow

The application will automatically use the server-side agent ARN and client-side Cognito configuration.