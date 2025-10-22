'use client';

import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import AgentCanvas from './AgentCanvas';
import JsonViewer from './JsonViewer';
import { useAgentStream } from '@/hooks/useAgentStream';
import { useAuth } from './AuthProvider';
import { useLambdaService, S3File } from '@/services/lambdaService';

type TabType = 'custom' | 'input-files' | 'output-files';

export default function StreamingInterface() {
  const { user, signOut, getBearerToken } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('custom');
  const [formData, setFormData] = useState({
    payload: '{"prompt": "Hello, agent!"}',
    sessionId: '',
    endpointName: 'DEFAULT',
  });

  // File management state
  const [inputFiles, setInputFiles] = useState<S3File[]>([]);
  const [outputFiles, setOutputFiles] = useState<S3File[]>([]);
  const [selectedFile, setSelectedFile] = useState<S3File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const { agentData, isStreaming, error, startStream, clearData } = useAgentStream({
    onChunk: (chunk) => {
      console.log('Received chunk:', chunk);
    },
    onError: (error) => {
      alert(`Streaming failed: ${error.message}`);
    },
    onComplete: () => {
      // Stream completed
    },
  });

  const { listInputFiles, listOutputFiles, readFile } = useLambdaService();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleStartStreaming = async () => {
    if (!formData.sessionId) {
      alert('Please provide Session ID');
      return;
    }

    try {
      const bearerToken = await getBearerToken();
      if (!bearerToken) {
        alert('Unable to get authentication token. Please sign in again.');
        return;
      }

      let payload;
      try {
        payload = JSON.parse(formData.payload);
      } catch {
        payload = { message: formData.payload };
      }

      await startStream({
        payload,
        sessionId: formData.sessionId,
        bearerToken,
        endpointName: formData.endpointName,
      });
    } catch (error) {
      alert('Failed to start streaming. Please try again.');
    }
  };

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
      setFileContent(`Error: ${error instanceof Error ? error.message : 'Failed to load file'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessFile = async (file: S3File) => {
    const prompt = `Please process the mortgage application file: ${file.key}. Analyze the application data and provide a comprehensive assessment including validation, credit risk analysis, and decision recommendation.`;
    const newSessionId = uuidv4();
    const newPayload = JSON.stringify({ prompt });
    
    // Update the form data for UI display
    setFormData(prev => ({
      ...prev,
      payload: newPayload,
      sessionId: newSessionId
    }));

    // Start streaming with the new values directly (don't wait for state update)
    try {
      const bearerToken = await getBearerToken();
      if (!bearerToken) {
        alert('Unable to get authentication token. Please sign in again.');
        return;
      }

      await startStream({
        payload: { prompt },
        sessionId: newSessionId,
        bearerToken,
        endpointName: formData.endpointName,
      });
    } catch (error) {
      alert('Failed to start streaming. Please try again.');
    }
  };

  // Generate session ID after mount to avoid hydration mismatch
  useEffect(() => {
    if (!formData.sessionId) {
      setFormData(prev => ({ ...prev, sessionId: uuidv4() }));
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'input-files' && inputFiles.length === 0) {
      loadInputFiles();
    } else if (activeTab === 'output-files' && outputFiles.length === 0) {
      loadOutputFiles();
    }
  }, [activeTab]);

  const tabs = [
    { id: 'custom' as TabType, label: 'Custom', icon: '✏️' },
    { id: 'input-files' as TabType, label: 'Input Files', icon: '📁' },
    { id: 'output-files' as TabType, label: 'Output Files', icon: '📄' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <span className="text-white font-bold text-sm">IL</span>
                </div>
                <div className="absolute -inset-1 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-xl blur opacity-20 animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                  Intelligent Lending
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">AI-Powered Mortgage Processing</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-full border border-slate-200 dark:border-slate-700">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {user?.username || user?.email}
                </div>
              </div>
              <button
                onClick={signOut}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all duration-200"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-89px)]">
        {/* Modern Left Sidebar */}
        <div className="w-72 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-slate-200/50 dark:border-slate-700/50 flex flex-col shadow-xl">
          {/* Tab Navigation */}
          <div className="p-6">
            <div className="space-y-3">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group w-full flex items-center gap-4 px-5 py-4 text-sm font-semibold rounded-xl transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25 transform scale-[1.02]'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-gradient-to-r hover:from-slate-50 hover:to-slate-100 dark:hover:from-slate-800 dark:hover:to-slate-700 hover:text-slate-800 dark:hover:text-slate-200 hover:shadow-md hover:scale-[1.01]'
                  }`}
                >
                  <span className={`text-xl transition-transform duration-300 ${activeTab === tab.id ? 'scale-110' : 'group-hover:scale-105'}`}>
                    {tab.icon}
                  </span>
                  <span className="font-medium">{tab.label}</span>
                  {activeTab === tab.id && (
                    <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab-specific sidebar content */}
          <div className="flex-1 overflow-y-auto border-t border-slate-200/50 dark:border-slate-700/50">
            {activeTab === 'input-files' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg">Input Files</h3>
                  <button
                    onClick={loadInputFiles}
                    disabled={loading}
                    className="p-2.5 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all duration-200 hover:scale-105"
                  >
                    <span className={`text-lg ${loading ? 'animate-spin' : ''}`}>🔄</span>
                  </button>
                </div>
                
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Loading files...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {inputFiles.map((file, index) => (
                      <div key={file.key} className="group relative bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 hover:scale-[1.02] hover:border-blue-200 dark:hover:border-blue-800">
                        <div className="absolute top-3 right-3 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl flex items-center justify-center">
                            <span className="text-blue-600 dark:text-blue-400 text-lg">📄</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate mb-1">
                              {file.displayName}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                              {new Date(file.lastModified).toISOString().split('T')[0]} • {(file.size / 1024).toFixed(1)} KB
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleProcessFile(file)}
                          disabled={isStreaming}
                          className="w-full px-4 py-2.5 text-sm font-semibold bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-slate-300 disabled:to-slate-400 text-white rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                        >
                          {isStreaming ? (
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              Processing...
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-2">
                              <span>⚡</span>
                              Process File
                            </div>
                          )}
                        </button>
                      </div>
                    ))}
                    {inputFiles.length === 0 && (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <span className="text-2xl text-slate-400">📁</span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">No input files found</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Upload files to get started</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'output-files' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg">Output Files</h3>
                  <button
                    onClick={loadOutputFiles}
                    disabled={loading}
                    className="p-2.5 text-slate-500 hover:text-green-600 dark:text-slate-400 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-xl transition-all duration-200 hover:scale-105"
                  >
                    <span className={`text-lg ${loading ? 'animate-spin' : ''}`}>🔄</span>
                  </button>
                </div>
                
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-8 h-8 border-3 border-green-200 border-t-green-600 rounded-full animate-spin mb-4"></div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Loading files...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {outputFiles.map((file, index) => (
                      <div key={file.key} className={`group relative bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border rounded-2xl p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${
                        selectedFile?.key === file.key 
                          ? 'border-green-300 dark:border-green-700 shadow-lg shadow-green-500/10 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20' 
                          : 'border-slate-200 dark:border-slate-700 hover:border-green-200 dark:hover:border-green-800 hover:shadow-green-500/10'
                      }`}>
                        <div className="absolute top-3 right-3 w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl flex items-center justify-center">
                            <span className="text-green-600 dark:text-green-400 text-lg">📊</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate mb-1">
                              {file.displayName}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                              {new Date(file.lastModified).toISOString().split('T')[0]} • {(file.size / 1024).toFixed(1)} KB
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleFileSelect(file)}
                          disabled={loading}
                          className="w-full px-4 py-2.5 text-sm font-semibold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-slate-300 disabled:to-slate-400 text-white rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-green-500/25 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                        >
                          {loading && selectedFile?.key === file.key ? (
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              Loading...
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-2">
                              <span>👁️</span>
                              View Results
                            </div>
                          )}
                        </button>
                      </div>
                    ))}
                    {outputFiles.length === 0 && (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <span className="text-2xl text-slate-400">📊</span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">No output files found</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Process input files to generate results</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Main Content Panel */}
        <div className="flex-1 overflow-hidden bg-gradient-to-br from-white/50 to-slate-50/50 dark:from-slate-900/50 dark:to-slate-800/50">
          {activeTab === 'custom' && (
            <div className="h-full flex flex-col">
              {/* Custom Prompt Form */}
              <div className="p-8 border-b border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
                <div className="max-w-3xl space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                      <span className="text-white text-xl">✏️</span>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                        Custom Prompt
                      </h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Create custom AI interactions</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                        Session ID
                      </label>
                      <div className="flex gap-3">
                        <input
                          type="text"
                          value={formData.sessionId}
                          onChange={(e) => handleInputChange('sessionId', e.target.value)}
                          className="flex-1 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-300 dark:focus:border-blue-600 text-sm font-medium shadow-sm transition-all duration-200"
                          placeholder="unique-session-id"
                        />
                        <button
                          type="button"
                          onClick={() => handleInputChange('sessionId', uuidv4())}
                          className="px-4 py-3 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 hover:from-slate-200 hover:to-slate-300 dark:hover:from-slate-600 dark:hover:to-slate-500 text-slate-600 dark:text-slate-300 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm"
                          title="Generate new session ID"
                        >
                          <span className="text-lg">🔄</span>
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                        Endpoint Name
                      </label>
                      <input
                        type="text"
                        value={formData.endpointName}
                        onChange={(e) => handleInputChange('endpointName', e.target.value)}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-300 dark:focus:border-blue-600 text-sm font-medium shadow-sm transition-all duration-200"
                        placeholder="DEFAULT"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                      Payload (JSON)
                    </label>
                    <textarea
                      value={formData.payload}
                      onChange={(e) => handleInputChange('payload', e.target.value)}
                      className="w-full px-4 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-300 dark:focus:border-blue-600 resize-none text-sm font-mono shadow-sm transition-all duration-200"
                      rows={5}
                      placeholder='{"prompt": "Hello, agent!"}'
                    />
                  </div>
                  
                  <div className="flex items-center gap-4 pt-2">
                    <button
                      onClick={handleStartStreaming}
                      disabled={isStreaming}
                      className="px-8 py-4 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 hover:from-blue-600 hover:via-indigo-600 hover:to-purple-700 disabled:from-slate-300 disabled:to-slate-400 text-white font-bold rounded-xl transition-all duration-300 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {isStreaming ? (
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Processing...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <span className="text-lg">⚡</span>
                          <span>Start Processing</span>
                        </div>
                      )}
                    </button>
                    
                    <button
                      onClick={clearData}
                      disabled={isStreaming}
                      className="px-6 py-4 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 hover:from-slate-200 hover:to-slate-300 dark:hover:from-slate-600 dark:hover:to-slate-500 disabled:from-slate-50 disabled:to-slate-100 disabled:dark:from-slate-800 disabled:dark:to-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl transition-all duration-200 disabled:cursor-not-allowed shadow-sm hover:shadow-md transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <div className="flex items-center gap-2">
                        <span>🗑️</span>
                        <span>Clear Data</span>
                      </div>
                    </button>
                  </div>
                  
                  {error && (
                    <div className="p-4 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                          <span className="text-red-500 text-lg">⚠️</span>
                        </div>
                        <div>
                          <span className="font-bold">Error:</span>
                          <span className="ml-2">{error}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Agent Canvases */}
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 h-full">
                  {Object.entries(agentData).map(([agentType, data]) => (
                    <AgentCanvas
                      key={agentType}
                      agentType={agentType as any}
                      data={data}
                      className="min-h-[400px]"
                    />
                  ))}
                </div>
                {Object.keys(agentData).length === 0 && (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <span className="text-3xl text-slate-400">🤖</span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-600 dark:text-slate-400 mb-2">Ready to Process</h3>
                      <p className="text-slate-500 dark:text-slate-500">Enter a prompt above and click "Start Processing" to begin</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'input-files' && (
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="p-8 border-b border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                      <span className="text-white text-xl">📁</span>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                        Input Files Processing
                      </h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">AI analysis results and insights</p>
                    </div>
                  </div>
                  <button
                    onClick={clearData}
                    disabled={isStreaming}
                    className="px-6 py-3 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 hover:from-slate-200 hover:to-slate-300 dark:hover:from-slate-600 dark:hover:to-slate-500 disabled:from-slate-50 disabled:to-slate-100 disabled:dark:from-slate-800 disabled:dark:to-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl transition-all duration-200 disabled:cursor-not-allowed shadow-sm hover:shadow-md transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-2">
                      <span>🗑️</span>
                      <span>Clear Data</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Agent Canvases */}
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 h-full">
                  {Object.entries(agentData).map(([agentType, data]) => (
                    <AgentCanvas
                      key={agentType}
                      agentType={agentType as any}
                      data={data}
                      className="min-h-[400px]"
                    />
                  ))}
                </div>
                {Object.keys(agentData).length === 0 && (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <span className="text-3xl text-blue-500">📄</span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-600 dark:text-slate-400 mb-2">No Processing Results</h3>
                      <p className="text-slate-500 dark:text-slate-500">Select an input file from the sidebar to start processing</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'output-files' && (
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="p-8 border-b border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/25">
                    <span className="text-white text-xl">📊</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                      {selectedFile ? `Viewing: ${selectedFile.displayName}` : 'Output Files Viewer'}
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                      {selectedFile ? 'JSON analysis results' : 'Select a file to view detailed results'}
                    </p>
                  </div>
                </div>
              </div>

              {/* JSON Viewer */}
              <div className="flex-1 overflow-hidden">
                {selectedFile && fileContent ? (
                  <JsonViewer 
                    content={fileContent} 
                    filename={selectedFile.displayName}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400">
                    <div className="text-center">
                      <div className="text-4xl mb-4">📄</div>
                      <div className="text-lg font-medium mb-2">No file selected</div>
                      <div className="text-sm">Select a file from the sidebar to view its contents</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}