'use client';

import { useEffect, useRef, useState } from 'react';
import { AgentType } from '@/types/agent';

interface AgentCanvasProps {
  agentType: AgentType;
  data: string;
  className?: string;
}

export default function AgentCanvas({ agentType, data, className = '' }: AgentCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const expandedCanvasRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.scrollTop = canvasRef.current.scrollHeight;
    }
  }, [data]);

  useEffect(() => {
    if (isExpanded && expandedCanvasRef.current) {
      expandedCanvasRef.current.scrollTop = expandedCanvasRef.current.scrollHeight;
    }
  }, [data, isExpanded]);

  const handleExpand = () => {
    setIsExpanded(true);
  };

  const handleMinimize = () => {
    setIsExpanded(false);
  };

  const getAgentConfig = (type: AgentType) => {
    const configs: Record<AgentType, { color: string; bgColor: string; icon: string; name: string }> = {
      'COORDINATOR': { color: 'text-indigo-600', bgColor: 'bg-indigo-50 dark:bg-indigo-900/20', icon: '🎯', name: 'Coordinator' },
      'VALIDATION': { color: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-900/20', icon: '✅', name: 'Validation' },
      'CREDIT_RISK': { color: 'text-red-600', bgColor: 'bg-red-50 dark:bg-red-900/20', icon: '📊', name: 'Credit Risk' },
      'EXTERNAL_SERVICES': { color: 'text-green-600', bgColor: 'bg-green-50 dark:bg-green-900/20', icon: '🔗', name: 'External Services' },
      'DECISIONING': { color: 'text-purple-600', bgColor: 'bg-purple-50 dark:bg-purple-900/20', icon: '⚖️', name: 'Decisioning' },
      'VALUER': { color: 'text-yellow-600', bgColor: 'bg-yellow-50 dark:bg-yellow-900/20', icon: '🏠', name: 'Valuer' },
      'LMI': { color: 'text-pink-600', bgColor: 'bg-pink-50 dark:bg-pink-900/20', icon: '🛡️', name: 'LMI' },
    };
    return configs[type] || { color: 'text-gray-600', bgColor: 'bg-gray-50 dark:bg-gray-900/20', icon: '🤖', name: type };
  };

  const parseContent = (content: string) => {
    if (!content) return { parsedContent: [], codeBlocks: [] };
    
    const codeBlocks: Array<{ language: string; code: string; id: string }> = [];
    const parsedContent: Array<{ type: 'thinking' | 'output'; content: string; id: string }> = [];
    
    let workingContent = content;
    let elementId = 0;
    
    // First, handle code blocks to avoid conflicts with thinking blocks
    const completeCodeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g;
    let codeMatch;
    let codeBlockId = 0;
    
    while ((codeMatch = completeCodeBlockRegex.exec(workingContent)) !== null) {
      const language = codeMatch[1] || 'text';
      const code = codeMatch[2].trim();
      const id = `code-${codeBlockId++}`;
      codeBlocks.push({ language, code, id });
      
      // Replace the code block with a placeholder
      workingContent = workingContent.replace(codeMatch[0], `[CODE_BLOCK_${id}]`);
    }
    
    // Handle incomplete code blocks (opening ``` without closing)
    const incompleteCodeMatch = workingContent.match(/```(\w*)\n?([\s\S]*)$/);
    if (incompleteCodeMatch) {
      const language = incompleteCodeMatch[1] || 'text';
      const code = incompleteCodeMatch[2].trim();
      const id = `code-incomplete-${codeBlockId++}`;
      codeBlocks.push({ language, code: code + '\n\n[Streaming...]', id });
      
      // Replace with placeholder and mark as incomplete
      workingContent = workingContent.replace(/```[\w]*\n?[\s\S]*$/, `[CODE_BLOCK_${id}]`);
    }
    
    // Now parse the content sequentially, preserving order of thinking blocks and output
    const parts = workingContent.split(/(<thinking>[\s\S]*?<\/thinking>|<thinking>[\s\S]*$)/);
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i].trim();
      if (!part) continue;
      
      // Check if this part is a thinking block
      const completeThinkingMatch = part.match(/<thinking>([\s\S]*?)<\/thinking>/);
      const incompleteThinkingMatch = part.match(/<thinking>([\s\S]*)$/);
      
      if (completeThinkingMatch) {
        // Complete thinking block
        const thinkingContent = completeThinkingMatch[1].trim();
        if (thinkingContent) {
          parsedContent.push({
            type: 'thinking',
            content: thinkingContent,
            id: `thinking-${elementId++}`
          });
        }
      } else if (incompleteThinkingMatch) {
        // Incomplete thinking block (still streaming)
        const thinkingContent = incompleteThinkingMatch[1].trim();
        if (thinkingContent) {
          parsedContent.push({
            type: 'thinking',
            content: thinkingContent + '\n\n[Still thinking...]',
            id: `thinking-incomplete-${elementId++}`
          });
        }
      } else {
        // Regular output content
        const cleanContent = part
          .replace(/<\/?thinking>/g, '') // Remove any orphaned tags
          .trim();
        
        if (cleanContent) {
          parsedContent.push({
            type: 'output',
            content: cleanContent,
            id: `output-${elementId++}`
          });
        }
      }
    }
    
    return { parsedContent, codeBlocks };
  };

  const { parsedContent, codeBlocks } = parseContent(data);
  const config = getAgentConfig(agentType);

  const renderOutput = (text: string) => {
    // Replace code block placeholders with actual code block components
    const parts = text.split(/(\[CODE_BLOCK_[^\]]+\])/);
    
    return parts.map((part, index) => {
      const codeBlockMatch = part.match(/\[CODE_BLOCK_(.+)\]/);
      if (codeBlockMatch) {
        const codeBlock = codeBlocks.find(cb => cb.id === codeBlockMatch[1]);
        if (codeBlock) {
          return (
            <div key={index} className="my-3">
              <div className="bg-slate-900 dark:bg-slate-800 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 bg-slate-800 dark:bg-slate-700 border-b border-slate-700">
                  <span className="text-xs font-medium text-slate-300 uppercase tracking-wide">
                    {codeBlock.language || 'code'}
                  </span>
                  <button
                    onClick={() => navigator.clipboard.writeText(codeBlock.code)}
                    className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
                    title="Copy code"
                  >
                    📋 Copy
                  </button>
                </div>
                <pre className="p-4 text-sm text-slate-100 overflow-x-auto">
                  <code>{codeBlock.code}</code>
                </pre>
              </div>
            </div>
          );
        }
      }
      return part ? (
        <span key={index} className="whitespace-pre-wrap">
          {part}
        </span>
      ) : null;
    });
  };

  const renderContent = (ref: React.RefObject<HTMLDivElement>, isExpandedView = false) => (
    <div className="p-4 space-y-4">
      {parsedContent.length > 0 ? (
        parsedContent.map((item) => {
          if (item.type === 'thinking') {
            return (
              <div key={item.id} className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                    💭 Agent Thinking
                  </span>
                </div>
                <div className="text-sm text-amber-800 dark:text-amber-200 whitespace-pre-wrap leading-relaxed">
                  {item.content}
                </div>
              </div>
            );
          } else {
            return (
              <div key={item.id} className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                    📝 Output
                  </span>
                </div>
                <div className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                  {renderOutput(item.content)}
                </div>
              </div>
            );
          }
        })
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-3">
            <span className="text-slate-400 dark:text-slate-500 text-xl">{config.icon}</span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Waiting for data...
          </p>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Regular Canvas */}
      <div 
        className={`flex flex-col h-full cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${className}`}
        onClick={handleExpand}
      >
        {/* Header */}
        <div className={`${config.bgColor} border border-slate-200 dark:border-slate-700 rounded-t-xl p-4`}>
          <div className="flex items-center gap-3">
            <span className="text-xl">{config.icon}</span>
            <div className="flex-1">
              <h3 className={`font-semibold text-sm ${config.color} dark:text-slate-300`}>
                {config.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <div className={`w-2 h-2 rounded-full ${data ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {data ? 'Active' : 'Waiting'}
                </span>
              </div>
            </div>
            <div className="text-xs text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
              Click to expand
            </div>
          </div>
        </div>

        {/* Content */}
        <div 
          ref={canvasRef}
          className="flex-1 bg-white dark:bg-slate-800 border-x border-b border-slate-200 dark:border-slate-700 rounded-b-xl overflow-y-auto max-h-96"
        >
          {renderContent(canvasRef)}
        </div>
      </div>

      {/* Expanded Modal */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-4xl h-full max-h-[90vh] m-4 flex flex-col bg-white dark:bg-slate-800 rounded-2xl shadow-2xl">
            {/* Expanded Header */}
            <div className={`${config.bgColor} border-b border-slate-200 dark:border-slate-700 rounded-t-2xl p-6`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{config.icon}</span>
                  <div>
                    <h3 className={`font-semibold text-lg ${config.color} dark:text-slate-300`}>
                      {config.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div className={`w-2 h-2 rounded-full ${data ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        {data ? 'Active' : 'Waiting'}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleMinimize}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                  title="Minimize"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Expanded Content */}
            <div 
              ref={expandedCanvasRef}
              className="flex-1 overflow-y-auto bg-white dark:bg-slate-800 rounded-b-2xl"
            >
              {renderContent(expandedCanvasRef, true)}
            </div>
          </div>
        </div>
      )}
    </>
  );
}