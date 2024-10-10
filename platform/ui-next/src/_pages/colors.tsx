import React from 'react';
import { createRoot } from 'react-dom/client';
import '../tailwind.css';

function Colors() {
  return <main></main>;
}

const container = document.getElementById('root');
const root = createRoot(container);
root.render(React.createElement(Colors));
