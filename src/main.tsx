import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './services/api';
import './services/axiosBridge';
import App from './App.tsx';
import './index.css';
import { BRAND } from './config/brand';

document.title = `${BRAND.name} — Premium Collection`;
const setMeta = (name: string, content: string) => {
  let node = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!node) { node = document.createElement('meta'); node.name = name; document.head.appendChild(node); }
  node.content = content;
};
setMeta('description', `${BRAND.name} — premium fashion, curated collections and an elevated shopping experience.`);
setMeta('robots', 'index,follow');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
