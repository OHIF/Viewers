import React from 'react';
import { createRoot } from 'react-dom/client';
import '../tailwind.css';

// component imports

function Viewer() {
  return (
    <div className="h-full w-full">
      <div className="text-3xl"> Dan </div>
    </div>
  );
}

const container = document.getElementById('root');
const root = createRoot(container);
root.render(React.createElement(Viewer));
