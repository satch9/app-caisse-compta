import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/hooks';
import { Button } from './ui/button';
import { motion } from 'framer-motion';

export function ThemeToggle() {
  const { theme, setTheme, actualTheme } = useTheme();

  const toggleTheme = () => {
    console.log('🔄 Toggle theme clicked:', { currentTheme: theme, actualTheme });

    let newTheme: 'light' | 'dark';

    if (theme === 'system') {
      // Si en mode système, basculer vers le thème opposé à celui actuellement affiché
      newTheme = actualTheme === 'dark' ? 'light' : 'dark';
    } else if (theme === 'light') {
      newTheme = 'dark';
    } else {
      newTheme = 'light';
    }

    console.log('🔄 Setting new theme:', newTheme);
    setTheme(newTheme);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="relative w-10 h-10 rounded-full"
      aria-label="Toggle theme"
    >
      <motion.div
        initial={false}
        animate={{
          scale: actualTheme === 'dark' ? 0 : 1,
          rotate: actualTheme === 'dark' ? 90 : 0,
        }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <Sun className="h-5 w-5" />
      </motion.div>
      <motion.div
        initial={false}
        animate={{
          scale: actualTheme === 'dark' ? 1 : 0,
          rotate: actualTheme === 'dark' ? 0 : -90,
        }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <Moon className="h-5 w-5" />
      </motion.div>
    </Button>
  );
}
