'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { apiRequest } from '@/lib/api/client';
import { MessageSquare, Send, CheckCircle, XCircle, Clock } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sender: string;
  read: boolean;
  created_at: string;
}

interface Thread {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  subject: string;
  status: string;
  created_at: string;
  updated_at: string;
  messages: Message[];
}

export default function SupportThreadDetailPage() {
  const router = useRouter();
  const params = useParams();
  const threadId = params.threadId as string;
  
  const [thread, setThread] = useState<Thread | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (threadId) {
      fetchThread();
    }
  }, [threadId]);

  const fetchThread = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<Thread>(
        `/api/v1/admin/support/threads/${threadId}`
      );
      setThread(data);
    } catch (err: any) {
      setError(err.detail || 'Failed to load thread');
      console.error('Error fetching thread:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    try {
      setSending(true);
      await apiRequest(
        `/api/v1/admin/support/threads/${threadId}/reply`,
        {
          method: 'POST',
          body: JSON.stringify({ message: replyContent }),
        }
      );
      setReplyContent('');
      fetchThread(); // Refresh thread to show new message
    } catch (err: any) {
      alert(err.detail || 'Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await apiRequest(
        `/api/v1/admin/support/threads/${threadId}/status`,
        {
          method: 'PUT',
          body: JSON.stringify({ status: newStatus }),
        }
      );
      fetchThread(); // Refresh thread
    } catch (err: any) {
      alert(err.detail || 'Failed to update status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !thread) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error: {error || 'Thread not found'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-800 mb-2"
          >
            ← Back to threads
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{thread.subject}</h1>
          <p className="text-gray-600 mt-1">
            From: {thread.user_name} ({thread.user_email})
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={thread.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className={`px-4 py-2 rounded-lg border ${getStatusColor(thread.status)}`}
          >
            <option value="open">Open</option>
            <option value="pending">Pending</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="space-y-4">
          {thread.messages.map((message) => (
            <div
              key={message.id}
              className={`p-4 rounded-lg ${
                message.sender === 'support'
                  ? 'bg-blue-50 border border-blue-200 ml-12'
                  : 'bg-gray-50 border border-gray-200 mr-12'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">
                  {message.sender === 'support' ? 'Support Team' : thread.user_name}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(message.created_at).toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{message.content}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleReply} className="space-y-4">
          <div>
            <label htmlFor="reply" className="block text-sm font-medium text-gray-700 mb-2">
              Reply to thread
            </label>
            <textarea
              id="reply"
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Type your reply here..."
            />
          </div>
          <button
            type="submit"
            disabled={sending || !replyContent.trim()}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            <span>{sending ? 'Sending...' : 'Send Reply'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}

