import { useState, useEffect, useRef } from 'react';
import { Bell, Check, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';
import { resolveApiUrl } from '@/lib/queryClient';
import { ENV_CONFIG } from '@/lib/environment';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface NotificationLog {
  id: string;
  title: string;
  body: string;
  isRead: boolean;
  sentAt: string;
  metadata: {
    ticker?: string;
    tradeType?: string;
  };
}

interface NotificationDropdownProps {
  onNavigateToNotifications?: () => void;
}

export function NotificationDropdown({ onNavigateToNotifications }: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  // Fetch recent notifications
  const { data } = useQuery<{ logs: NotificationLog[]; unreadCount: number }>({
    queryKey: ['/api/notifications/recent'],
    enabled: isAuthenticated,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const logs = data?.logs || [];
  const unreadCount = data?.unreadCount || 0;

  // Mark as read mutation
  const markReadMutation = useMutation({
    mutationFn: async (params: { notificationIds?: string[]; markAll?: boolean }) => {
      const token = localStorage.getItem('authToken');
      const response = await fetch(resolveApiUrl('/api/notifications/mark-read'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...(ENV_CONFIG.isAppintos && { 'x-appintos-env': 'true' }),
        },
        body: JSON.stringify(params),
      });
      if (!response.ok) throw new Error('Failed to mark as read');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/recent'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/history'] });
    },
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatTime = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ko });
  };

  const handleMarkAllRead = () => {
    markReadMutation.mutate({ markAll: true });
  };

  const handleNotificationClick = (log: NotificationLog) => {
    if (!log.isRead) {
      markReadMutation.mutate({ notificationIds: [log.id] });
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-neutral-400 hover:text-neutral-200 transition-colors"
        aria-label="알림"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full px-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-700">
            <span className="font-semibold text-sm text-neutral-200">알림</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-emerald-500 hover:text-emerald-400 flex items-center gap-1"
                disabled={markReadMutation.isPending}
              >
                <Check size={12} />
                모두 읽음
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="py-8 text-center text-neutral-500 text-sm">
                알림이 없습니다
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  onClick={() => handleNotificationClick(log)}
                  className={`px-4 py-3 border-b border-neutral-800 cursor-pointer transition-colors ${
                    log.isRead
                      ? 'bg-neutral-900'
                      : 'bg-neutral-800/50 hover:bg-neutral-800'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {!log.isRead && (
                      <span className="w-2 h-2 mt-1.5 rounded-full bg-red-500 flex-shrink-0" />
                    )}
                    <div className={`flex-1 ${log.isRead ? 'ml-5' : ''}`}>
                      <div className="flex items-center gap-2 mb-1">
                        {log.metadata?.ticker && (
                          <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                            log.metadata.tradeType === 'BUY'
                              ? 'bg-emerald-900/50 text-emerald-400'
                              : 'bg-red-900/50 text-red-400'
                          }`}>
                            {log.metadata.ticker}
                          </span>
                        )}
                        <span className="text-xs text-neutral-500">
                          {formatTime(log.sentAt)}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-300 font-medium line-clamp-1">
                        {log.title}
                      </p>
                      <p className="text-xs text-neutral-500 line-clamp-1 mt-0.5">
                        {log.body}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-neutral-700">
            <button
              onClick={() => {
                setIsOpen(false);
                onNavigateToNotifications?.();
              }}
              className="w-full text-center text-sm text-emerald-500 hover:text-emerald-400 font-medium"
            >
              알림센터로 이동
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
