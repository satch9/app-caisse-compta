import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import type { LucideIcon } from 'lucide-react';

interface OperationalPageLayoutProps {
  pageTitle: string;
  pageIcon: LucideIcon;
  borderColor: 'green' | 'blue' | 'purple' | 'orange' | 'indigo' | 'red';
  rightContent?: ReactNode;
  banner?: ReactNode;
  children: ReactNode;
  maxWidth?: 'full' | '7xl';
  backgroundColor?: 'background' | 'gray-50';
}

const borderColorClasses = {
  green: 'border-green-500',
  blue: 'border-blue-500',
  purple: 'border-purple-500',
  orange: 'border-orange-500',
  indigo: 'border-indigo-500',
  red: 'border-red-500'
};

const backgroundColorClasses = {
  background: 'bg-background',
  'gray-50': 'bg-gray-50 dark:bg-gray-900'
};

const maxWidthClasses = {
  full: 'w-full',
  '7xl': 'max-w-7xl mx-auto'
};

export function OperationalPageLayout({
  pageTitle,
  pageIcon: PageIcon,
  borderColor,
  rightContent,
  banner,
  children,
  maxWidth = '7xl',
  backgroundColor = 'background'
}: OperationalPageLayoutProps) {
  return (
    <div className={`min-h-screen ${backgroundColorClasses[backgroundColor]} flex flex-col`}>
      {/* Header */}
      <header className={`bg-card shadow-sm border-b-2 ${borderColorClasses[borderColor]}`}>
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left side: Home + Title */}
            <div className="flex items-center gap-4">
              <Link to="/dashboard">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  <span className="hidden sm:inline">Accueil</span>
                </Button>
              </Link>

              <div className="hidden sm:block h-8 w-px bg-border" />

              <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
                <PageIcon className="w-6 h-6 sm:w-7 sm:h-7" />
                {pageTitle}
              </h1>
            </div>

            {/* Right side: Custom content */}
            <div className="flex items-center gap-3">
              {rightContent}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Banner (optional) */}
      {banner && banner}

      {/* Main content */}
      <main className={`flex-1 ${maxWidthClasses[maxWidth]} ${maxWidth === '7xl' ? 'px-4 sm:px-6 lg:px-8 py-6' : ''}`}>
        {children}
      </main>
    </div>
  );
}
