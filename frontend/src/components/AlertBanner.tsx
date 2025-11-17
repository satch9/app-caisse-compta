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
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    borderColor: 'border-l-4 border-l-blue-500 dark:border-l-blue-500',
    iconColor: 'text-white dark:text-blue-400',
    textColor: 'text-white dark:text-blue-200',
    defaultIcon: Info
  },
  warning: {
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/30',
    borderColor: 'border-l-4 border-l-yellow-500 dark:border-l-yellow-500',
    iconColor: 'text-yellow-600 dark:text-yellow-400',
    textColor: 'text-yellow-800 dark:text-yellow-200',
    defaultIcon: AlertTriangle
  },
  success: {
    bgColor: 'bg-green-50 dark:bg-green-950/30',
    borderColor: 'border-l-4 border-l-green-500 dark:border-l-green-500',
    iconColor: 'text-green-600 dark:text-green-400',
    textColor: 'text-green-800 dark:text-green-200',
    defaultIcon: CheckCircle
  },
  error: {
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    borderColor: 'border-l-4 border-l-red-500 dark:border-l-red-500',
    iconColor: 'text-red-600 dark:text-red-400',
    textColor: 'text-red-800 dark:text-red-200',
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
    <div className={`${config.bgColor} ${config.borderColor} px-4 py-3 rounded-md shadow-sm mt-4 w-full max-w-full sm:max-w-xl md:max-w-2xl mx-auto`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <Icon className={`w-5 h-5 ${config.iconColor} flex-shrink-0`} />

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
              className={`${config.textColor} border-current hover:bg-background/50 dark:hover:bg-background/20`}
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
