import { NextRequest, NextResponse } from 'next/server';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

interface InvokeLambdaRequest {
  lambda_arn: string;
  tool_name: string;
  arguments: any;
  bearer_token: string;
}

function getAwsRegion(): string {
  return process.env.AWS_REGION || 'ap-south-1';
}

export async function POST(request: NextRequest) {
  try {
    const body: InvokeLambdaRequest = await request.json();
    const { lambda_arn, tool_name, arguments: args, bearer_token } = body;

    if (!lambda_arn || !tool_name || !bearer_token) {
      return NextResponse.json(
        { error: 'Missing required parameters: lambda_arn, tool_name, bearer_token' },
        { status: 400 }
      );
    }

    // Extract function name from ARN
    const functionName = lambda_arn.split(':').pop();
    if (!functionName) {
      return NextResponse.json(
        { error: 'Invalid Lambda ARN format' },
        { status: 400 }
      );
    }

    // Initialize Lambda client with credentials from environment
    const lambdaClient = new LambdaClient({ 
      region: getAwsRegion(),
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      }
    });

    // Prepare Lambda payload - match the format expected by your Lambda function
    const lambdaPayload = {
      tool_name,
      arguments: args,
      ...args // Spread arguments at root level for Gateway format
    };

    // Create invoke command
    const command = new InvokeCommand({
      FunctionName: functionName,
      Payload: JSON.stringify(lambdaPayload),
      InvocationType: 'RequestResponse',
    });

    // Invoke Lambda
    const response = await lambdaClient.send(command);
    
    if (response.StatusCode !== 200) {
      throw new Error(`Lambda invocation failed with status: ${response.StatusCode}`);
    }

    // Parse response
    const payloadString = new TextDecoder().decode(response.Payload);
    const result = JSON.parse(payloadString);
    
    return NextResponse.json({
      statusCode: 200,
      body: result
    });

  } catch (error) {
    console.error('Lambda invocation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to invoke Lambda function', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}