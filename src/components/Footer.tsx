import { Heart } from 'lucide-react';
import packageJson from '../../package.json';

export default function Footer() {
  return (
    <footer className="py-6 text-center text-xs text-gray-400 dark:text-gray-500 space-y-1">
      <p>v{packageJson.version}</p>
      <p>&copy; {new Date().getFullYear()} &mdash; All rights reserved.</p>
      <p className="inline-flex items-center gap-1">
        Made with <Heart className="w-3 h-3 text-red-500 fill-red-500" /> by{' '}
        <a
          href="https://ablondel.com"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          Aurel
        </a>
      </p>
    </footer>
  );
}
