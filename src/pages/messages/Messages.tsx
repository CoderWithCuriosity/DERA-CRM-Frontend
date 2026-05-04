import  { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Mail, Send, Plus, Search, Inbox, Send as SendIcon, 
   Trash2, MessageSquare, Users, Reply, X, Loader
} from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { messagesApi } from '../../api/messages';
import { usersApi } from '../../api/users';
import type { Message, CreateMessageData } from '../../types/message';
import type { User } from '../../types/user';
import { useToast } from '../../hooks/useToast';
import { formatDate } from '../../utils/formatters';
import { useAuth } from '../../hooks/useAuth';

export function Messages() {
  const navigate = useNavigate();
  void navigate;
  const toast = useToast();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [folder, setFolder] = useState<'inbox' | 'sent' | 'all'>('inbox');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showCompose, setShowCompose] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<number[]>([]);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyBody, setReplyBody] = useState('');
  const [replying, setReplying] = useState(false);

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      const response = await messagesApi.getMessages({ page, limit: 20, folder });
      setMessages(response.data.data);
      setTotalPages(response.data.totalPages);
      setUnreadCount(response.data.unread_count);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [page, folder]);

  const fetchUsers = async () => {
    try {
      const response = await usersApi.getUsers({ limit: 100 });
      // Filter out current user
      const otherUsers = response.data.data.filter(u => u.id !== user?.id);
      setUsers(otherUsers);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  useEffect(() => {
    fetchMessages();
    fetchUsers();
  }, [fetchMessages]);

  const handleSendMessage = async () => {
    if (selectedRecipients.length === 0) {
      toast.error('Please select at least one recipient');
      return;
    }
    if (!body.trim()) {
      toast.error('Message body is required');
      return;
    }

    setSending(true);
    try {
      const data: CreateMessageData = {
        recipient_ids: selectedRecipients,
        body: body.trim(),
        subject: subject.trim() || undefined,
      };
      await messagesApi.sendMessage(data);
      toast.success('Message sent successfully');
      setShowCompose(false);
      setSelectedRecipients([]);
      setSubject('');
      setBody('');
      fetchMessages();
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleReply = async (messageId: number) => {
    if (!replyBody.trim()) {
      toast.error('Reply body is required');
      return;
    }

    setReplying(true);
    try {
      await messagesApi.replyToMessage(messageId, { body: replyBody.trim() });
      toast.success('Reply sent successfully');
      setReplyBody('');
      setSelectedMessage(null);
      fetchMessages();
    } catch (error) {
      console.error('Failed to send reply:', error);
      toast.error('Failed to send reply');
    } finally {
      setReplying(false);
    }
  };

  const handleHideMessage = async (messageId: number) => {
    try {
      await messagesApi.hideMessage(messageId);
      toast.success('Message moved to trash');
      fetchMessages();
    } catch (error) {
      console.error('Failed to hide message:', error);
      toast.error('Failed to delete message');
    }
  };

  const toggleRecipient = (userId: number) => {
    setSelectedRecipients(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const filteredMessages = messages?.filter(msg => 
    msg.subject?.toLowerCase().includes(search.toLowerCase()) ||
    msg.body.toLowerCase().includes(search.toLowerCase()) ||
    msg.sender?.first_name?.toLowerCase().includes(search.toLowerCase()) ||
    msg.sender?.last_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-deep-ink">Messages</h1>
          <p className="text-gray-600 mt-1">Communicate with your team</p>
        </div>
        <Button onClick={() => setShowCompose(true)}>
          <Plus size={18} className="mr-2" />
          New Message
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <div className="md:w-64 shrink-0">
          <GlassCard className="p-4">
            <div className="space-y-1">
              <button
                onClick={() => setFolder('inbox')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  folder === 'inbox' ? 'bg-primary/10 text-primary' : 'hover:bg-blue-50'
                }`}
              >
                <Inbox size={18} />
                <span className="flex-1 text-left">Inbox</span>
                {unreadCount > 0 && (
                  <Badge variant="accent" size="sm">{unreadCount}</Badge>
                )}
              </button>
              <button
                onClick={() => setFolder('sent')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  folder === 'sent' ? 'bg-primary/10 text-primary' : 'hover:bg-blue-50'
                }`}
              >
                <SendIcon size={18} />
                <span className="flex-1 text-left">Sent</span>
              </button>
              <button
                onClick={() => setFolder('all')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  folder === 'all' ? 'bg-primary/10 text-primary' : 'hover:bg-blue-50'
                }`}
              >
                <MessageSquare size={18} />
                <span className="flex-1 text-left">All Messages</span>
              </button>
            </div>
          </GlassCard>
        </div>

        {/* Messages List */}
        <div className="flex-1">
          <GlassCard className="overflow-hidden">
            {/* Search Bar */}
            <div className="p-4 border-b border-blue-100">
              <Input
                placeholder="Search messages..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={<Search size={18} />}
                className='pl-8'
              />
            </div>

            {/* Messages */}
            <div className="divide-y divide-blue-100 max-h-[calc(100vh-300px)] overflow-y-auto">
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader className="animate-spin text-primary" size={32} />
                </div>
              ) : filteredMessages?.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Mail size={48} className="mx-auto mb-3 opacity-50" />
                  <p>No messages found</p>
                </div>
              ) : (
                filteredMessages?.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`p-4 hover:bg-blue-50/50 transition-colors cursor-pointer ${
                      !message.is_read && folder === 'inbox' ? 'bg-blue-50/30' : ''
                    }`}
                    onClick={() => setSelectedMessage(message)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 rounded-full bg-linear-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-medium shrink-0">
                            {message.sender?.first_name?.[0]}{message.sender?.last_name?.[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {message.sender ? `${message.sender.first_name} ${message.sender.last_name}` : 'Unknown'}
                            </p>
                            {message.subject && (
                              <p className="text-sm font-medium text-deep-ink truncate">
                                {message.subject}
                              </p>
                            )}
                            <p className="text-sm text-gray-600 truncate">{message.body}</p>
                            <p className="text-xs text-gray-400 mt-1">{formatDate(message.created_at)}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        {!message.is_read && folder === 'inbox' && (
                          <div className="w-2 h-2 bg-primary rounded-full" />
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleHideMessage(message.id);
                          }}
                          className="p-1.5 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          <Trash2 size={14} className="text-red-500" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-blue-100">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </GlassCard>
        </div>
      </div>

      {/* Compose Modal */}
      <Modal isOpen={showCompose} onClose={() => setShowCompose(false)} maxWidth="lg">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-deep-ink">New Message</h2>
            <button onClick={() => setShowCompose(false)}>
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Recipients */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedRecipients.map(recipientId => {
                  const recipient = users.find(u => u.id === recipientId);
                  return recipient ? (
                    <span key={recipientId} className="inline-flex items-center px-2 py-1 rounded-full text-sm bg-primary/10 text-primary">
                      {recipient.first_name} {recipient.last_name}
                      <button onClick={() => toggleRecipient(recipientId)} className="ml-1">
                        <X size={12} />
                      </button>
                    </span>
                  ) : null;
                })}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 bg-gray-50 rounded-lg">
                {users.map(u => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => toggleRecipient(u.id)}
                    className={`flex items-center space-x-2 px-2 py-1 rounded-lg text-sm transition-colors ${
                      selectedRecipients.includes(u.id)
                        ? 'bg-primary text-white'
                        : 'hover:bg-gray-200'
                    }`}
                  >
                    <Users size={12} />
                    <span>{u.first_name} {u.last_name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Subject */}
            <Input
              label="Subject (optional)"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="What's this about?"
            />

            {/* Body */}
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 bg-white/70 border border-blue-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              placeholder="Write your message here..."
            />

            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="outline" onClick={() => setShowCompose(false)}>
                Cancel
              </Button>
              <Button onClick={handleSendMessage} disabled={sending}>
                {sending ? <Loader size={16} className="mr-2 animate-spin" /> : <Send size={16} className="mr-2" />}
                Send Message
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* View/Reply Modal */}
      {selectedMessage && (
        <Modal isOpen={!!selectedMessage} onClose={() => setSelectedMessage(null)} maxWidth="lg">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-deep-ink">
                {selectedMessage.subject || 'Message'}
              </h2>
              <button onClick={() => setSelectedMessage(null)}>
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Message Header */}
            <div className="flex items-center space-x-3 mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-linear-to-br from-primary to-accent flex items-center justify-center text-white">
                {selectedMessage.sender?.first_name?.[0]}{selectedMessage.sender?.last_name?.[0]}
              </div>
              <div className="flex-1">
                <p className="font-medium">
                  {selectedMessage.sender?.first_name} {selectedMessage.sender?.last_name}
                </p>
                <p className="text-sm text-gray-500">{formatDate(selectedMessage.created_at)}</p>
              </div>
              <div className="flex items-center space-x-2">
                {selectedMessage.participants && (
                  <span className="text-xs text-gray-500">
                    To: {selectedMessage.participants.filter(p => p.user_id !== selectedMessage.sent_by).length} recipients
                  </span>
                )}
              </div>
            </div>

            {/* Message Body */}
            <div className="prose max-w-none mb-6 p-4 bg-white rounded-lg border border-blue-100">
              <p className="whitespace-pre-wrap">{selectedMessage.body}</p>
            </div>

            {/* Reply Section */}
            <div className="border-t border-blue-100 pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Reply</label>
              <textarea
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-white/70 border border-blue-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                placeholder="Write your reply..."
              />
              <div className="flex justify-end mt-3">
                <Button onClick={() => handleReply(selectedMessage.id)} disabled={replying}>
                  {replying ? <Loader size={16} className="mr-2 animate-spin" /> : <Reply size={16} className="mr-2" />}
                  Send Reply
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}