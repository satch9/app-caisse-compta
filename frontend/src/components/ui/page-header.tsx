import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks';
import { usePermissions } from '@/hooks';
import { ThemeToggle } from '../ThemeToggle';
import { motion } from 'framer-motion';

interface PageHeaderProps {
  title: string;
  icon?: LucideIcon;
  iconColor?: string;
  borderColor?: string;
  children?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  icon: Icon,
  iconColor = 'text-primary',
  borderColor = 'border-primary',
  children,
  className,
}: PageHeaderProps) {
  const { user } = useAuth();
  const { roles } = usePermissions();

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'bg-card shadow-sm border-b-2',
        borderColor,
        className
      )}
    >
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 hover:opacity-70 transition-opacity"
          >
            <Home className={cn('w-6 h-6', iconColor)} />
            <span className="font-bold text-lg">Retour</span>
          </Link>
          <div className="h-8 w-px bg-border"></div>
          <div className="flex items-center gap-3">
            {Icon && <Icon className={cn('w-7 h-7', iconColor)} />}
            <h1 className="text-2xl font-bold">{title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {children}
          <div className="flex flex-col items-end">
            <div className="font-semibold text-sm">
              {user?.prenom} {user?.nom}
            </div>
            <div className="text-xs text-muted-foreground">
              {roles.join(', ')}
            </div>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </motion.header>
  );
}
