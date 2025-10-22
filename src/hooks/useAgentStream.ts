'use client';

import { useState, useCallback } from 'react';
import { AgentData, StreamChunk } from '@/types/agent';

interface UseAgentStreamProps {
  onChunk?: (chunk: StreamChunk) => void;
  onError?: (error: Error) => void;
  onComplete?: () => void;
}

export function useAgentStream({ onChunk, onError, onComplete }: UseAgentStreamProps = {}) {
  const [agentData, setAgentData] = useState<AgentData>({
    COORDINATOR: '',
    VALIDATION: '',
    CREDIT_RISK: '',
    EXTERNAL_SERVICES: '',
    DECISIONING: '',
    VALUER: '',
    LMI: '',
  });

  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearData = useCallback(() => {
    setAgentData({
      COORDINATOR: '',
      VALIDATION: '',
      CREDIT_RISK: '',
      EXTERNAL_SERVICES: '',
      DECISIONING: '',
      VALUER: '',
      LMI: '',
    });
    setError(null);
  }, []);

  const startStream = useCallback(async (params: {
    payload: any;
    sessionId: string;
    bearerToken: string;
    endpointName?: string;
  }) => {
    const { payload, sessionId, bearerToken, endpointName = 'DEFAULT' } = params;

    if (!sessionId || !bearerToken) {
      const error = new Error('Session ID and Bearer Token are required');
      setError(error.message);
      onError?.(error);
      return;
    }

    setIsStreaming(true);
    setError(null);
    clearData();

    try {
      const response = await fetch('/api/invoke-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payload,
          session_id: sessionId,
          bearer_token: bearerToken,
          endpoint_name: endpointName,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            let data = line.slice(6).trim();
            if (data) {
              try {
                // Handle double-encoded JSON - first parse to get the actual JSON string
                if (data.startsWith('"') && data.endsWith('"')) {
                  data = JSON.parse(data); // This removes the outer quotes and unescapes
                }
                
                // Now handle potentially concatenated JSON objects
                let remaining = data;
                while (remaining.length > 0) {
                  // Find the end of the first JSON object
                  let braceCount = 0;
                  let endIndex = -1;
                  
                  for (let i = 0; i < remaining.length; i++) {
                    if (remaining[i] === '{') braceCount++;
                    if (remaining[i] === '}') braceCount--;
                    if (braceCount === 0) {
                      endIndex = i + 1;
                      break;
                    }
                  }
                  
                  if (endIndex === -1) break; // No complete JSON object found
                  
                  const jsonStr = remaining.substring(0, endIndex);
                  const chunk = JSON.parse(jsonStr);
                  
                  // Cast to our interface after logging
                  const typedChunk = chunk as StreamChunk;
                  onChunk?.(typedChunk);

                  if (chunk.type === 'agent_chunk' && chunk.agent && chunk.data) {
                    const agentType = chunk.agent as keyof AgentData;
                    setAgentData(prev => ({
                      ...prev,
                      [agentType]: prev[agentType] + chunk.data,
                    }));
                  } else if (chunk.type === 'agent_start') {
                    const agentType = chunk.agent as keyof AgentData;
                    setAgentData(prev => ({
                      ...prev,
                      [agentType]: prev[agentType] + `\n[${chunk.timestamp}] Agent ${agentType} started\n`,
                    }));
                  } else if (chunk.type === 'agent_end') {
                    const agentType = chunk.agent as keyof AgentData;
                    setAgentData(prev => ({
                      ...prev,
                      [agentType]: prev[agentType] + `\n[${chunk.timestamp}] Agent ${agentType} completed\n`,
                    }));
                  }
                  
                  // Move to the next JSON object
                  remaining = remaining.substring(endIndex).trim();
                  
                  // Skip any newlines between JSON objects
                  while (remaining.startsWith('\n') || remaining.startsWith('\r')) {
                    remaining = remaining.substring(1);
                  }
                }
              } catch (outerParseError) {
                // Silently handle parse errors
              }
            }
          }
        }
      }

      onComplete?.();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown streaming error');
      setError(error.message);
      onError?.(error);
    } finally {
      setIsStreaming(false);
    }
  }, [agentData, onChunk, onError, onComplete, clearData]);

  return {
    agentData,
    isStreaming,
    error,
    startStream,
    clearData,
  };
}