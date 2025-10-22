import { NextRequest, NextResponse } from 'next/server';

interface InvokeAgentRequest {
  payload: any;
  session_id: string;
  bearer_token: string;
  endpoint_name?: string;
}

function getAwsRegion(): string {
  return process.env.AWS_REGION || 'ap-south-1';
}

function getAgentArn(): string {
  const agentArn = process.env.BEDROCK_AGENT_ARN;
  if (!agentArn) {
    throw new Error('BEDROCK_AGENT_ARN environment variable is not configured');
  }
  return agentArn;
}

export async function POST(request: NextRequest) {
  try {
    const body: InvokeAgentRequest = await request.json();
    const { payload, session_id, bearer_token, endpoint_name = "DEFAULT" } = body;

    if (!payload || !session_id) {
      return NextResponse.json(
        { error: 'Missing required parameters: payload, session_id' },
        { status: 400 }
      );
    }

    // Get agent ARN from server-side environment variable
    const agent_arn = getAgentArn();

    // URL encode the entire ARN (matching Python reference: urllib.parse.quote(agent_arn, safe=""))
    const escapedArn = encodeURIComponent(agent_arn);
    const url = `https://bedrock-agentcore.${getAwsRegion()}.amazonaws.com/runtimes/${escapedArn}/invocations`;

    // Headers for AgentCore request
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Amzn-Bedrock-AgentCore-Runtime-Session-Id': session_id,
    };

    // Add authorization if bearer token is provided (for OAuth configured agents)
    if (bearer_token) {
      headers['Authorization'] = `Bearer ${bearer_token}`;
    }

    let requestBody: any;
    try {
      requestBody = typeof payload === 'string' ? JSON.parse(payload) : payload;
    } catch {
      requestBody = { payload };
    }

    // Add qualifier parameter to URL if not DEFAULT (matching Python reference)
    const urlWithParams = endpoint_name !== 'DEFAULT'
      ? `${url}?qualifier=${encodeURIComponent(endpoint_name)}`
      : url;

    console.log('Making request to AgentCore...');
    console.log('Request headers:', headers);
    console.log('Request body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(urlWithParams, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }

    // Create a readable stream for the client
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                controller.enqueue(`data: ${data}\n\n`);
              }
            }
          }
        } catch (error) {
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to invoke agent endpoint',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}