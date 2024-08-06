import React from 'react';
import { createRoot } from 'react-dom/client';

import '../tailwind.css';

const App: React.FC = () => (
  <div className="container mx-auto p-4">
    <h1 className="mb-4 text-2xl font-bold">Home Page</h1>
    <nav className="space-x-4">
      <a
        href="playground.html"
        className="text-blue-500 hover:text-blue-700"
      >
        Playground
      </a>
      <a
        href="viewer.html"
        className="text-blue-500 hover:text-blue-700"
      >
        Viewer
      </a>
      <a
        href="colors.html"
        className="text-blue-500 hover:text-blue-700"
      >
        Colors
      </a>
    </nav>
  </div>
);

const container = document.getElementById('root');
const root = createRoot(container);
root.render(React.createElement(App));
