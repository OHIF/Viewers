import React from 'react';
import { createRoot } from 'react-dom/client';
import '../tailwind.css';

function Colors() {
  return (
    <main>
      <h2>Color swatches</h2>
      <div className="row">
        <div className="example2">
          <div className="bg-primary h-16 w-16 rounded"></div>
        </div>
        <div className="example2">
          <div className="bg-primary/80 h-16 w-16 rounded"></div>
        </div>
        <div className="example2">
          <div className="bg-primary/60 h-16 w-16 rounded"></div>
        </div>
        <div className="example2">
          <div className="bg-primary/40 h-16 w-16 rounded"></div>
        </div>
        <div className="example2">
          <div className="bg-primary/20 h-16 w-16 rounded"></div>
        </div>
        <div className="example2">
          <div className="bg-infosecondary h-16 w-16 rounded"></div>
        </div>
        <div className="example2">
          <div className="bg-highlight h-16 w-16 rounded"></div>
        </div>
        <div className="example2">
          <div className="bg-highlight h-16 w-16 rounded"></div>
        </div>
        <div className="example2">
          <div className="h-16 w-16 rounded bg-white"></div>
        </div>
        <div className="example2">
          <div className="h-16 w-16 rounded bg-white"></div>
        </div>
        <div className="example2">
          <div className="h-16 w-16 rounded bg-white"></div>
        </div>
      </div>
    </main>
  );
}

const container = document.getElementById('root');
const root = createRoot(container);
root.render(React.createElement(Colors));
