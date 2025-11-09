import { ReactNode } from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AlertBannerProps {
  type: 'info' | 'warning' | 'success' | 'error';
  icon?: LucideIcon;
  title?: string;
  message: ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  onDismiss?: () => void;
}

const typeConfig = {
  info: {
    bgColor: 'bg-blue-50',
    borderColor: 'border-l-blue-500',
    iconColor: 'text-blue-600',
    textColor: 'text-blue-900',
    defaultIcon: Info
  },
  warning: {
    bgColor: 'bg-yellow-50',
    borderColor: 'border-l-yellow-500',
    iconColor: 'text-yellow-600',
    textColor: 'text-yellow-900',
    defaultIcon: AlertTriangle
  },
  success: {
    bgColor: 'bg-green-50',
    borderColor: 'border-l-green-500',
    iconColor: 'text-green-600',
    textColor: 'text-green-900',
    defaultIcon: CheckCircle
  },
  error: {
    bgColor: 'bg-red-50',
    borderColor: 'border-l-red-500',
    iconColor: 'text-red-600',
    textColor: 'text-red-900',
    defaultIcon: AlertCircle
  }
};

export function AlertBanner({
  type,
  icon,
  title,
  message,
  action,
  onDismiss
}: AlertBannerProps) {
  const config = typeConfig[type];
  const Icon = icon || config.defaultIcon;

  return (
    <div className={`${config.bgColor} border-l-4 ${config.borderColor} px-4 py-3`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <Icon className={`w-5 h-5 ${config.iconColor}`} />

          <div className="flex-1">
            {title && (
              <div className={`font-semibold ${config.textColor} text-sm mb-1`}>
                {title}
              </div>
            )}
            <div className={`${config.textColor} text-sm`}>
              {message}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {action && (
            <Button
              size="sm"
              variant="outline"
              onClick={action.onClick}
              className={`${config.textColor} border-current hover:bg-white/50`}
            >
              {action.label}
            </Button>
          )}

          {onDismiss && (
            <button
              onClick={onDismiss}
              className={`${config.iconColor} hover:opacity-70 transition-opacity`}
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
