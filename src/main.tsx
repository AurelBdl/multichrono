import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Fonction pour mettre à jour la couleur du theme-color
const updateThemeColor = () => {
  const themeColor = document.querySelector('meta[name="theme-color"]');
  if (!themeColor) return;

  // Vérifier si Tailwind a appliqué la classe "dark" sur <html>
  const isDarkMode = document.documentElement.classList.contains('dark');
  themeColor.setAttribute('content', isDarkMode ? '#101828' : '#f3f4f6');
};

// Mettre à jour au chargement
updateThemeColor();

// Observer les changements de classe "dark" sur <html>
const observer = new MutationObserver(updateThemeColor);
observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
