import React from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/anton/latin-400.css';
import '@fontsource-variable/archivo/wdth.css';
import '@fontsource/caveat/latin-400.css';
import '@fontsource/jetbrains-mono/latin-400.css';
import './styles/base.css';
import './styles/components.css';
import './styles/chapters.css';
import App from './App';

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

createRoot(document.getElementById('root')).render(<App />);
document.getElementById('boot')?.remove();
