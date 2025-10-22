'use client';

import { useState, useMemo } from 'react';

interface JsonViewerProps {
  content: string;
  filename: string;
}

interface JsonNode {
  key: string;
  value: any;
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  path: string;
  expanded?: boolean;
}

export default function JsonViewer({ content, filename }: JsonViewerProps) {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set(['root']));
  const [searchTerm, setSearchTerm] = useState('');

  const { parsedData, error } = useMemo(() => {
    try {
      const parsed = JSON.parse(content);
      return { parsedData: parsed, error: null };
    } catch (err) {
      return { parsedData: null, error: err instanceof Error ? err.message : 'Invalid JSON' };
    }
  }, [content]);

  const toggleExpanded = (path: string) => {
    setExpandedPaths(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    const allPaths = new Set<string>();
    const collectPaths = (obj: any, currentPath: string) => {
      allPaths.add(currentPath);
      if (typeof obj === 'object' && obj !== null) {
        Object.keys(obj).forEach(key => {
          const newPath = currentPath === 'root' ? key : `${currentPath}.${key}`;
          collectPaths(obj[key], newPath);
        });
      }
    };
    if (parsedData) {
      collectPaths(parsedData, 'root');
    }
    setExpandedPaths(allPaths);
  };

  const collapseAll = () => {
    setExpandedPaths(new Set(['root']));
  };

  const getValueType = (value: any): JsonNode['type'] => {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value as JsonNode['type'];
  };

  const formatValue = (value: any, type: JsonNode['type']) => {
    switch (type) {
      case 'string':
        return `"${value}"`;
      case 'number':
      case 'boolean':
        return String(value);
      case 'null':
        return 'null';
      default:
        return '';
    }
  };

  const getValueColor = (type: JsonNode['type']) => {
    switch (type) {
      case 'string':
        return 'text-green-600 dark:text-green-400';
      case 'number':
        return 'text-blue-600 dark:text-blue-400';
      case 'boolean':
        return 'text-purple-600 dark:text-purple-400';
      case 'null':
        return 'text-gray-500 dark:text-gray-400';
      default:
        return 'text-slate-800 dark:text-slate-200';
    }
  };

  const renderJsonNode = (value: any, key: string, path: string, level: number = 0): JSX.Element => {
    const type = getValueType(value);
    const isExpanded = expandedPaths.has(path);
    const hasChildren = type === 'object' || type === 'array';
    const indent = level * 20;

    // Search filtering
    const matchesSearch = !searchTerm || 
      key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (typeof value === 'string' && value.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch && !hasChildren) return <></>;

    return (
      <div key={path} className="font-mono text-sm">
        <div 
          className="flex items-center py-1 hover:bg-slate-50 dark:hover:bg-slate-700 rounded px-2 cursor-pointer"
          style={{ paddingLeft: `${indent + 8}px` }}
          onClick={() => hasChildren && toggleExpanded(path)}
        >
          {hasChildren && (
            <span className="w-4 h-4 flex items-center justify-center text-slate-400 mr-2">
              {isExpanded ? '▼' : '▶'}
            </span>
          )}
          {!hasChildren && <span className="w-6 mr-2"></span>}
          
          <span className="text-slate-700 dark:text-slate-300 font-medium">
            {key}:
          </span>
          
          {!hasChildren && (
            <span className={`ml-2 ${getValueColor(type)}`}>
              {formatValue(value, type)}
            </span>
          )}
          
          {hasChildren && (
            <span className="ml-2 text-slate-500 dark:text-slate-400">
              {type === 'array' ? `[${value.length}]` : `{${Object.keys(value).length}}`}
            </span>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div>
            {type === 'array' 
              ? value.map((item: any, index: number) => 
                  renderJsonNode(item, `[${index}]`, `${path}.${index}`, level + 1)
                )
              : Object.entries(value).map(([childKey, childValue]) => 
                  renderJsonNode(childValue, childKey, `${path}.${childKey}`, level + 1)
                )
            }
          </div>
        )}
      </div>
    );
  };

  if (error) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
            <span>⚠️</span>
            <span className="font-medium">JSON Parse Error:</span>
            <span>{error}</span>
          </div>
        </div>
        <div className="flex-1 p-4 overflow-auto">
          <pre className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap bg-slate-50 dark:bg-slate-700 p-4 rounded-lg">
            {content}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-800">
      {/* Toolbar */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={expandAll}
              className="px-3 py-1.5 text-xs bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded transition-colors"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="px-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-600 hover:bg-slate-200 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-300 rounded transition-colors"
            >
              Collapse All
            </button>
          </div>
          
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search keys and values..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-1.5 text-sm bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500 rounded-lg text-slate-800 dark:text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {filename}
          </div>
        </div>
      </div>

      {/* JSON Tree */}
      <div className="flex-1 overflow-auto p-4">
        {parsedData && renderJsonNode(parsedData, 'root', 'root')}
      </div>
    </div>
  );
}