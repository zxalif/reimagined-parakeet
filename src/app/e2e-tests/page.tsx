'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiRequest } from '@/lib/api/client';
import { toast } from '@/components/ui/Toast';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { formatDateTime } from '@/lib/utils/date';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Play,
  RefreshCw,
  Clock,
  FileText,
  Eye,
  ChevronDown,
  ChevronUp,
  Trash2,
} from 'lucide-react';

interface TestStep {
  step: string;
  status: 'passed' | 'failed';
  duration_ms: number;
  details?: string;
  error?: string;
}

interface E2ETestResult {
  id: string;
  test_run_id: string;
  status: 'passed' | 'failed' | 'error' | 'running';
  triggered_by: string | null;
  test_user_email: string | null;
  test_user_id: string | null;
  duration_ms: number | null;
  steps: TestStep[] | null;
  error_message: string | null;
  screenshot_path: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

interface TestStats {
  total_runs: number;
  passed: number;
  failed: number;
  error: number;
  pass_rate: number;
  average_duration_ms: number;
  latest_test: {
    test_run_id: string | null;
    status: string | null;
    created_at: string | null;
  } | null;
}

const statusColors = {
  passed: 'bg-green-100 text-green-800 border-green-200',
  failed: 'bg-red-100 text-red-800 border-red-200',
  error: 'bg-orange-100 text-orange-800 border-orange-200',
  running: 'bg-blue-100 text-blue-800 border-blue-200',
};

const statusIcons = {
  passed: CheckCircle,
  failed: XCircle,
  error: AlertTriangle,
  running: RefreshCw,
};

export default function E2ETestsPage() {
  const [testResults, setTestResults] = useState<E2ETestResult[]>([]);
  const [stats, setStats] = useState<TestStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedTest, setExpandedTest] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
    isLoading?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    variant: 'info',
    onConfirm: () => {},
  });

  const fetchTestResults = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter) {
        params.append('status_filter', statusFilter);
      }
      params.append('limit', '50');
      
      const [resultsResponse, statsResponse] = await Promise.all([
        apiRequest<E2ETestResult[]>(`/api/v1/e2e-tests/results?${params.toString()}`),
        apiRequest<TestStats>('/api/v1/e2e-tests/stats'),
      ]);
      
      setTestResults(resultsResponse);
      setStats(statsResponse);
    } catch (err: any) {
      setError(err.detail || 'Failed to fetch test results');
      toast.error(err.detail || 'Failed to fetch test results');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchTestResults();
  }, [fetchTestResults]);

  // Separate effect for auto-refresh - only runs when autoRefresh is enabled
  useEffect(() => {
    if (!autoRefresh) {
      return; // Don't set up interval if auto-refresh is disabled
    }

    const interval = setInterval(() => {
      // Check current test results state first (no API call needed)
      // Only refresh if there are active/running tests (not failed or errored)
      const hasRunningTests = testResults.some(t => t.status === 'running');
      
      if (hasRunningTests) {
        // Only make API call if we have running tests in current state
        fetchTestResults();
      }
      // If no running tests, skip the refresh entirely (saves API calls)
    }, 10000); // Refresh every 10 seconds for running tests (reduces API calls)
    
    return () => clearInterval(interval);
  }, [autoRefresh, fetchTestResults, testResults]);

  const handleRunTest = async () => {
    setRunning(true);
    setError(null);
    try {
      const result = await apiRequest<{ message: string; triggered_by: string }>('/api/v1/e2e-tests/run', {
        method: 'POST',
        body: JSON.stringify({ triggered_by: 'manual' }),
      });
      
      toast.success(result.message || 'E2E test started in background!');
      // Refresh results after a short delay to see the test start
      setTimeout(() => {
        fetchTestResults();
      }, 2000);
    } catch (err: any) {
      setError(err.detail || 'Failed to run E2E test');
      toast.error(err.detail || 'Failed to run E2E test');
    } finally {
      setRunning(false);
    }
  };

  const handleClearTests = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Clear All E2E Tests',
      message: 'Are you sure you want to clear all E2E test results and remove all pending jobs from the queue? This action cannot be undone.',
      variant: 'danger',
      isLoading: clearing,
      onConfirm: async () => {
        setClearing(true);
        setConfirmModal(prev => ({ ...prev, isLoading: true }));
        setError(null);
        try {
          const result = await apiRequest<{ 
            message: string; 
            deleted_results: number; 
            queue_cleared: boolean; 
            queue_size_before_clear: number | null;
          }>('/api/v1/e2e-tests/clear?clear_queue=true', {
            method: 'DELETE',
          });
          
          toast.success(
            `Cleared ${result.deleted_results} test results${result.queue_cleared ? ` and ${result.queue_size_before_clear || 0} pending jobs` : ''}`
          );
          
          // Close modal
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          
          // Refresh results to show empty state
          await fetchTestResults();
        } catch (err: any) {
          setError(err.detail || 'Failed to clear E2E tests');
          toast.error(err.detail || 'Failed to clear E2E tests');
        } finally {
          setClearing(false);
          setConfirmModal(prev => ({ ...prev, isLoading: false }));
        }
      },
    });
  };

  const toggleExpand = (testRunId: string) => {
    setExpandedTest(expandedTest === testRunId ? null : testRunId);
  };

  const getStepStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'text-green-600';
      case 'failed': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">E2E Test Results</h1>
          <p className="text-gray-600 mt-1">Monitor end-to-end test execution and results</p>
        </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`inline-flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  autoRefresh 
                    ? 'border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100' 
                    : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                }`}
              >
                <RefreshCw className={`-ml-1 mr-2 h-5 w-5 ${autoRefresh ? 'animate-spin' : ''}`} aria-hidden="true" />
                Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
              </button>
              <button
                onClick={fetchTestResults}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={loading}
              >
                <RefreshCw className={`-ml-1 mr-2 h-5 w-5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
                Refresh Now
              </button>
              <button
                onClick={handleClearTests}
                className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                disabled={clearing || loading}
              >
                <Trash2 className={`-ml-1 mr-2 h-5 w-5 ${clearing ? 'animate-spin' : ''}`} aria-hidden="true" />
                {clearing ? 'Clearing...' : 'Clear All'}
              </button>
              <button
                onClick={handleRunTest}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={running || loading}
              >
                <Play className={`-ml-1 mr-2 h-5 w-5 ${running ? 'animate-spin' : ''}`} aria-hidden="true" />
                {running ? 'Running...' : 'Run Test'}
              </button>
            </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm font-medium text-gray-500">Total Runs</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900">{stats.total_runs}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm font-medium text-gray-500">Pass Rate</div>
            <div className="mt-1 text-2xl font-semibold text-green-600">{stats.pass_rate.toFixed(1)}%</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm font-medium text-gray-500">Average Duration</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900">
              {stats.average_duration_ms ? `${(stats.average_duration_ms / 1000).toFixed(1)}s` : 'N/A'}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm font-medium text-gray-500">Latest Status</div>
            <div className="mt-1">
              {stats.latest_test ? (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  statusColors[stats.latest_test.status as keyof typeof statusColors] || statusColors.error
                }`}>
                  {stats.latest_test.status || 'Unknown'}
                </span>
              ) : (
                <span className="text-gray-400">No tests yet</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
          <select
            value={statusFilter || ''}
            onChange={(e) => setStatusFilter(e.target.value || null)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All</option>
            <option value="passed">Passed</option>
            <option value="failed">Failed</option>
            <option value="error">Error</option>
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <XCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="mt-2 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && testResults.length === 0 && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Test Results List */}
      {!loading && testResults.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No test results</h3>
          <p className="mt-1 text-sm text-gray-500">Run your first E2E test to see results here.</p>
        </div>
      )}

      {/* Test Results */}
      {!loading && testResults.length > 0 && (
        <div className="space-y-4">
          {testResults.map((test) => {
            const StatusIcon = statusIcons[test.status as keyof typeof statusIcons] || AlertTriangle;
            const isExpanded = expandedTest === test.test_run_id;
            const passedSteps = test.steps?.filter(s => s.status === 'passed').length || 0;
            const totalSteps = test.steps?.length || 0;

            return (
              <div
                key={test.id}
                className={`bg-white rounded-lg shadow-sm border-2 ${
                  statusColors[test.status as keyof typeof statusColors] || statusColors.error
                }`}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <StatusIcon className={`h-6 w-6 ${
                        test.status === 'passed' ? 'text-green-600' :
                        test.status === 'failed' ? 'text-red-600' :
                        test.status === 'error' ? 'text-orange-600' :
                        'text-blue-600'
                      }`} />
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-medium text-gray-900">
                            Test Run: {test.test_run_id.substring(0, 8)}...
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            statusColors[test.status as keyof typeof statusColors] || statusColors.error
                          }`}>
                            {test.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {test.duration_ms ? `${(test.duration_ms / 1000).toFixed(1)}s` : 'N/A'}
                          </span>
                          <span>{formatDateTime(test.created_at)}</span>
                          {test.triggered_by && (
                            <span className="capitalize">Triggered: {test.triggered_by}</span>
                          )}
                          {totalSteps > 0 && (
                            <span>
                              Steps: {passedSteps}/{totalSteps} passed
                            </span>
                          )}
                          {test.status === 'running' && test.metadata?.current_step && (
                            <span className="flex items-center text-blue-600 font-medium">
                              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                              Current: {test.metadata.current_step.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleExpand(test.test_run_id)}
                      className="p-2 rounded-full hover:bg-gray-100"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-500" />
                      )}
                    </button>
                  </div>

                  {test.error_message && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-800">{test.error_message}</p>
                    </div>
                  )}

                  {/* Show steps summary for running tests (even when collapsed) */}
                  {test.status === 'running' && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-blue-900">Test Progress:</h4>
                        {test.metadata?.steps_completed !== undefined && test.metadata?.steps_total !== undefined && (
                          <span className="text-xs text-blue-700 font-medium">
                            {test.metadata.steps_completed} / {test.metadata.steps_total} steps completed
                          </span>
                        )}
                      </div>
                      {test.steps && test.steps.length > 0 ? (
                        <div className="space-y-1.5">
                          {test.steps.map((step, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-2 bg-white rounded border border-blue-100"
                            >
                              <div className="flex items-center space-x-2 flex-1">
                                {step.status === 'passed' ? (
                                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                                ) : step.status === 'failed' ? (
                                  <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                                ) : (
                                  <div className="h-4 w-4 rounded-full border-2 border-blue-400 border-t-transparent animate-spin flex-shrink-0" />
                                )}
                                <span className={`text-sm font-medium ${getStepStatusColor(step.status)}`}>
                                  {step.step.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                </span>
                                {step.details && (
                                  <span className="text-xs text-gray-600 truncate">- {step.details}</span>
                                )}
                              </div>
                              <div className="flex items-center space-x-2 text-xs text-gray-500 ml-2">
                                {step.duration_ms && <span>{step.duration_ms.toFixed(0)}ms</span>}
                              </div>
                            </div>
                          ))}
                          {/* Show current step if available */}
                          {test.metadata?.current_step && !test.steps.some(s => s.step === test.metadata?.current_step) && (
                            <div className="flex items-center space-x-2 p-2 bg-blue-100 rounded border border-blue-200">
                              <div className="h-4 w-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin flex-shrink-0" />
                              <span className="text-sm font-medium text-blue-900">
                                {test.metadata.current_step.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())} (in progress...)
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 p-2 bg-white rounded border border-blue-100">
                          <div className="h-4 w-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin flex-shrink-0" />
                          <span className="text-sm text-blue-700">
                            {test.metadata?.current_step 
                              ? `Starting: ${test.metadata.current_step.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}...`
                              : 'Initializing test...'}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      {/* Test Steps - Detailed View */}
                      {test.steps && test.steps.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-gray-900 mb-2">Test Steps:</h4>
                          <div className="space-y-2">
                            {test.steps.map((step, index) => (
                              <div
                                key={index}
                                className="flex items-start justify-between p-3 bg-gray-50 rounded-md border border-gray-200"
                              >
                                <div className="flex items-start space-x-2 flex-1">
                                  {step.status === 'passed' ? (
                                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                  ) : step.status === 'failed' ? (
                                    <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                                  ) : (
                                    <div className="h-5 w-5 rounded-full border-2 border-blue-400 border-t-transparent animate-spin flex-shrink-0 mt-0.5" />
                                  )}
                                  <div className="flex-1">
                                    <span className={`text-sm font-medium ${getStepStatusColor(step.status)}`}>
                                      {step.step.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                    </span>
                                    {step.details && (
                                      <p className="text-xs text-gray-600 mt-1">{step.details}</p>
                                    )}
                                    {step.error && (
                                      <p className="text-xs text-red-600 mt-1 font-medium">{step.error}</p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2 text-xs text-gray-500 ml-4">
                                  {step.duration_ms && <span>{step.duration_ms.toFixed(0)}ms</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Current Step Progress (for running tests) */}
                      {test.status === 'running' && test.metadata?.current_step && (
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                          <div className="flex items-center space-x-2">
                            <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
                            <div>
                              <h4 className="text-sm font-semibold text-blue-900">Current Step:</h4>
                              <p className="text-sm text-blue-700">
                                {test.metadata.current_step.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                {test.metadata.current_step_status && (
                                  <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                                    test.metadata.current_step_status === 'passed' 
                                      ? 'bg-green-100 text-green-800' 
                                      : test.metadata.current_step_status === 'failed'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {test.metadata.current_step_status}
                                  </span>
                                )}
                              </p>
                              {test.metadata.steps_completed !== undefined && test.metadata.steps_total !== undefined && (
                                <p className="text-xs text-blue-600 mt-1">
                                  Progress: {test.metadata.steps_completed} of {test.metadata.steps_total} steps completed
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Metadata */}
                      {test.metadata && (
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-gray-900 mb-2">Test Configuration:</h4>
                          <div className="text-xs text-gray-600 space-y-1">
                            {Object.entries(test.metadata)
                              .filter(([key]) => !['current_step', 'current_step_status', 'steps_completed', 'steps_total', 'steps_failed'].includes(key))
                              .map(([key, value]) => (
                                <div key={key}>
                                  <span className="font-medium">{key.replace(/_/g, ' ')}:</span> {String(value)}
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Test User Info */}
                      {test.test_user_email && (
                        <div className="text-xs text-gray-500">
                          Test User: {test.test_user_email} {test.test_user_id && `(${test.test_user_id.substring(0, 8)}...)`}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => {
          if (!confirmModal.isLoading) {
            setConfirmModal({ ...confirmModal, isOpen: false });
          }
        }}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
        isLoading={confirmModal.isLoading}
        confirmText="Clear All"
        cancelText="Cancel"
      />
    </div>
  );
}

