export interface StreamChunk {
  type: 'agent_start' | 'agent_chunk' | 'agent_end' | 'error';
  agent: AgentType;
  data?: string;
  timestamp: string;
}

export type AgentType = 'COORDINATOR' | 'VALIDATION' | 'CREDIT_RISK' | 'EXTERNAL_SERVICES' | 'DECISIONING' | 'VALUER' | 'LMI';

export interface AgentData {
  COORDINATOR: string;
  VALIDATION: string;
  CREDIT_RISK: string;
  EXTERNAL_SERVICES: string;
  DECISIONING: string;
  VALUER: string;
  LMI: string;
}

export interface InvokeAgentRequest {
  payload: any;
  session_id: string;
  bearer_token: string;
  endpoint_name?: string;
}

export interface AgentStreamParams {
  payload: any;
  sessionId: string;
  bearerToken: string;
  endpointName?: string;
}