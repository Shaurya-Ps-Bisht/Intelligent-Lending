'use client';

import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useLambdaService, S3File } from '@/services/lambdaService';

interface LeftPaneProps {
  formData: {
    payload: string;
    sessionId: string;
    endpointName: string;
  };
  onInputChange: (field: string, value: string) => void;
  onStartStreaming: () => void;
  isStreaming: boolean;
  error: string | null;
}

type TabType = 'custom' | 'input-files' | 'output-files';

export default function LeftPane({ 
  formData, 
  onInputChange, 
  onStartStreaming, 
  isStreaming, 
  error 
}: LeftPaneProps) {
  const [activeTab, setActiveTab] = useState<TabType>('custom');
  const [inputFiles, setInputFiles] = useState<S3File[]>([]);
  const [outputFiles, setOutputFiles] = useState<S3File[]>([]);
  const [selectedFile, setSelectedFile] = useState<S3File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  
  const { listInputFiles, listOutputFiles, readFile } = useLambdaService();

  const loadInputFiles = async () => {
    try {
      setLoading(true);
      const files = await listInputFiles();
      setInputFiles(files);
    } catch (error) {
      console.error('Failed to load input files:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOutputFiles = async () => {
    try {
      setLoading(true);
      const files = await listOutputFiles();
      setOutputFiles(files);
    } catch (error) {
      console.error('Failed to load output files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (file: S3File) => {
    try {
      setLoading(true);
      setSelectedFile(file);
      const content = await readFile(file.key);
      setFileContent(content);
    } catch (error) {
      console.error('Failed to read file:', error);
      setFileContent('Error loading file content');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessFile = (file: S3File) => {
    const prompt = `Please process the mortgage application file: ${file.key}. Analyze the application data and provide a comprehensive assessment including validation, credit risk analysis, and decision recommendation in one go.`;
    onInputChange('payload', JSON.stringify({ prompt }));
    onInputChange('sessionId', uuidv4()); // New session for each file
    onStartStreaming();
  };

  useEffect(() => {
    if (activeTab === 'input-files' && inputFiles.length === 0) {
      loadInputFiles();
    } else if (activeTab === 'output-files' && outputFiles.length === 0) {
      loadOutputFiles();
    }
  }, [activeTab]);

  const tabs = [
    { id: 'custom' as TabType, label: 'Custom Prompt', icon: '✏️' },
    { id: 'input-files' as TabType, label: 'Input Files', icon: '📁' },
    { id: 'output-files' as TabType, label: 'Output Files', icon: '📄' },
  ];

  return (
    <div className="w-96 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col h-full">
      {/* Tab Navigation */}
      <div className="border-b border-slate-200 dark:border-slate-700">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <span>{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'custom' && (
          <div className="p-4 space-y-4">
            <h3 className="font-medium text-slate-800 dark:text-slate-200">Custom Prompt</h3>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Session ID
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.sessionId}
                  onChange={(e) => onInputChange('sessionId', e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="unique-session-id"
                />
                <button
                  type="button"
                  onClick={() => onInputChange('sessionId', uuidv4())}
                  className="px-3 py-2 bg-slate-100 dark:bg-slate-600 hover:bg-slate-200 dark:hover:bg-slate-500 text-slate-600 dark:text-slate-300 rounded-lg transition-colors"
                  title="Generate new session ID"
                >
                  🔄
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Endpoint Name
              </label>
              <input
                type="text"
                value={formData.endpointName}
                onChange={(e) => onInputChange('endpointName', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="DEFAULT"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Payload (JSON)
              </label>
              <textarea
                value={formData.payload}
                onChange={(e) => onInputChange('payload', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                rows={6}
                placeholder='{"prompt": "Hello, agent!"}'
              />
            </div>
            
            <button
              onClick={onStartStreaming}
              disabled={isStreaming}
              className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-slate-300 disabled:to-slate-400 text-white font-medium rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
            >
              {isStreaming ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Processing...
                </div>
              ) : (
                'Start Processing'
              )}
            </button>
            
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-red-500">⚠️</span>
                  <span className="font-medium">Error:</span>
                  <span>{error}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'input-files' && (
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-slate-800 dark:text-slate-200">Input Files</h3>
              <button
                onClick={loadInputFiles}
                disabled={loading}
                className="px-3 py-1 text-sm bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded transition-colors"
              >
                🔄 Refresh
              </button>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="space-y-2">
                {inputFiles.map((file) => (
                  <div key={file.key} className="border border-slate-200 dark:border-slate-600 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                        {file.displayName}
                      </span>
                      <button
                        onClick={() => handleProcessFile(file)}
                        disabled={isStreaming}
                        className="px-2 py-1 text-xs bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 text-white rounded transition-colors"
                      >
                        Process
                      </button>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(file.lastModified).toLocaleDateString()} • {(file.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                ))}
                {inputFiles.length === 0 && (
                  <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                    No input files found
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'output-files' && (
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-slate-800 dark:text-slate-200">Output Files</h3>
              <button
                onClick={loadOutputFiles}
                disabled={loading}
                className="px-3 py-1 text-sm bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded transition-colors"
              >
                🔄 Refresh
              </button>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="space-y-2">
                {outputFiles.map((file) => (
                  <div key={file.key} className="border border-slate-200 dark:border-slate-600 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                        {file.displayName}
                      </span>
                      <button
                        onClick={() => handleFileSelect(file)}
                        disabled={loading}
                        className="px-2 py-1 text-xs bg-green-500 hover:bg-green-600 disabled:bg-slate-300 text-white rounded transition-colors"
                      >
                        View
                      </button>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(file.lastModified).toLocaleDateString()} • {(file.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                ))}
                {outputFiles.length === 0 && (
                  <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                    No output files found
                  </div>
                )}
              </div>
            )}
            
            {selectedFile && fileContent && (
              <div className="mt-4 border-t border-slate-200 dark:border-slate-600 pt-4">
                <h4 className="font-medium text-slate-800 dark:text-slate-200 mb-2">
                  {selectedFile.displayName}
                </h4>
                <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3 max-h-64 overflow-y-auto">
                  <pre className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                    {fileContent}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}