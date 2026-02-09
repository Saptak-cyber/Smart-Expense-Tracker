'use client';

import React from 'react';
import { Alert } from '@/types';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';

interface AlertDropdownProps {
  alerts: Alert[];
  onMarkAsRead: (alertId: string) => void;
  onDelete: (alertId: string) => void;
  onClose: () => void;
}

export function AlertDropdown({ alerts, onMarkAsRead, onDelete, onClose }: AlertDropdownProps) {
  const getIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  if (alerts.length === 0) {
    return (
      <div className="p-8 text-center">
        <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">No notifications</p>
      </div>
    );
  }

  return (
    <div>
      <div className="p-4 border-b">
        <h3 className="font-semibold">Notifications</h3>
      </div>
      <ScrollArea className="h-96">
        <div className="divide-y">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 hover:bg-accent transition-colors ${
                !alert.is_read ? 'bg-accent/50' : ''
              }`}
            >
              <div className="flex gap-3">
                <div className="mt-0.5">{getIcon(alert.severity)}</div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-medium">{alert.title}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => onDelete(alert.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">{alert.message}</p>
                  <div className="flex items-center justify-between pt-1">
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                    </p>
                    {!alert.is_read && (
                      <button
                        onClick={() => onMarkAsRead(alert.id)}
                        className="text-xs text-primary hover:underline"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

function Bell({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}
