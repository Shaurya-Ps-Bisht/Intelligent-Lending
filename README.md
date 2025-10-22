# 🏠 Intelligent Lending - AI-Powered Mortgage Processing

A modern Next.js application that leverages AWS services for intelligent mortgage application processing and analysis.

## 🏗️ Architecture

![Architecture Diagram](resources/arch.png)

## 🔗 Related Repositories

- **[Intelligent Lending Agents](https://github.com/Shaurya-Ps-Bisht/Intelligent-Lending-Agents)** - Strands Agent codebase with AI agent implementations

## ✨ Features

- **🔐 AWS Cognito Authentication**: Secure login with AWS Cognito User Pools
- **⚡ Real-time Streaming**: Stream data from AWS Lambda and Bedrock AgentCore endpoints
- **🤖 5 Agent Canvases**: Separate visualization for VALIDATION, RESEARCH, ANALYSIS, SYNTHESIS, and EXECUTION agents
- **📊 Advanced JSON Viewer**: Beautiful, searchable JSON viewer for output files
- **📁 S3 File Management**: Browse and process input files, view output results
- **🎨 Modern UI**: Glassmorphism design with gradients, animations, and responsive layout
- **🌙 Dark Mode**: Full dark mode support
- **📱 Responsive**: Works on desktop, tablet, and mobile devices

## 🚀 Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS 4 with custom gradients and animations
- **Authentication**: AWS Cognito
- **Backend**: AWS Lambda, S3
- **AI**: Amazon Bedrock AgentCore
- **Deployment**: AWS Amplify

## 🛠️ Setup & Installation

### Prerequisites
- Node.js 18+ 
- AWS Account with configured services
- AWS Cognito User Pool
- AWS Lambda function for S3 operations

### Environment Variables
Create a `.env.local` file with:

```env
NEXT_PUBLIC_AWS_REGION=ap-south-1
NEXT_PUBLIC_COGNITO_USER_POOL_ID=your-user-pool-id
NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID=your-client-id
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

### Installation
```bash
# Clone the repository
git clone <your-repo-url>
cd homebuying-frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

## 📋 Usage

1. **Sign in** with your AWS Cognito credentials
2. **Custom Tab**: Enter custom prompts for AI processing
3. **Input Files Tab**: Browse and process mortgage application files from S3
4. **Output Files Tab**: View AI-generated decision files with the advanced JSON viewer
5. **Real-time Processing**: Watch as AI agents process data in real-time across multiple canvases

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐
│   Next.js App   │───▶│ AWS Cognito  │───▶│  AWS Lambda     │
│   (Frontend)    │    │ (Auth)       │    │ (S3 Operations) │
└─────────────────┘    └──────────────┘    └─────────────────┘
         │                                           │
         ▼                                           ▼
┌─────────────────┐                        ┌─────────────────┐
│ Bedrock Agent   │                        │   Amazon S3     │
│ Core (AI)       │                        │ (File Storage)  │
└─────────────────┘                        └─────────────────┘
```


## 🚀 Deployment

### AWS Amplify (Recommended)
1. Push code to GitHub/GitLab/Bitbucket
2. Connect repository to AWS Amplify
3. Configure environment variables
4. Deploy automatically

### Manual Build
```bash
npm run build
npm start
```

## 📁 Project Structure

```
src/
├── app/                 # Next.js app router
│   ├── api/            # API routes
│   └── layout.tsx      # Root layout
├── components/         # React components
│   ├── StreamingInterface.tsx
│   ├── JsonViewer.tsx
│   ├── AgentCanvas.tsx
│   └── AuthProvider.tsx
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries
└── services/           # API services
```

## 🔧 Configuration Files

- `amplify.yml` - AWS Amplify build configuration
- `next.config.ts` - Next.js configuration optimized for Amplify
- `tailwind.config.ts` - Tailwind CSS configuration
- `.env.example` - Environment variables template

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
- Check the AWS documentation for service-specific issues
- Review the Next.js documentation for frontend issues
- Open an issue in this repository

---

Built with ❤️ using AWS services and modern web technologies.