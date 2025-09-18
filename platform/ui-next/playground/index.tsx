import React from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeWrapper } from '../src/components/ThemeWrapper';

const App = () => (
  <ThemeWrapper>
    <div className="min-h-screen bg-black" />
  </ThemeWrapper>
);

const container = document.getElementById('root');

if (!container) {
  throw new Error('Root element not found');
}

const root = createRoot(container);
root.render(<App />);
