import React from 'react';
import { createRoot } from 'react-dom/client';
import '../tailwind.css';

function Colors() {
  return (
    <main>
      <h2>Primary color</h2>
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

      <h2>New colors</h2>
      <div className="row">
        <div className="example2">
          <div className="bg-highlight h-16 w-16 rounded"></div>
        </div>
        <div className="example2">
          <div className="bg-bkg-low h-16 w-16 rounded"></div>
        </div>
        <div className="example2">
          <div className="bg-bkg-med h-16 w-16 rounded"></div>
        </div>
        <div className="example2">
          <div className="bg-bkg-full h-16 w-16 rounded"></div>
        </div>
      </div>

      <h2>Core colors</h2>
      <div className="row">
        <div className="example2">
          <div className="bg-background h-16 w-16 rounded"></div>
        </div>
        <div className="example2">
          <div className="bg-foreground h-16 w-16 rounded"></div>
        </div>
        <div className="example2">
          <div className="bg-card h-16 w-16 rounded"></div>
        </div>
        <div className="example2">
          <div className="bg-card-foreground h-16 w-16 rounded"></div>
        </div>
        <div className="example2">
          <div className="bg-popover h-16 w-16 rounded"></div>
        </div>
        <div className="example2">
          <div className="bg-popover-foreground h-16 w-16 rounded"></div>
        </div>
        <div className="example2">
          <div className="bg-primary h-16 w-16 rounded"></div>
        </div>
        <div className="example2">
          <div className="bg-primary-foreground h-16 w-16 rounded"></div>
        </div>
        <div className="example2">
          <div className="bg-secondary h-16 w-16 rounded"></div>
        </div>
        <div className="example2">
          <div className="bg-secondary-foreground h-16 w-16 rounded"></div>
        </div>
        <div className="example2">
          <div className="bg-muted h-16 w-16 rounded"></div>
        </div>
        <div className="example2">
          <div className="bg-muted-foreground h-16 w-16 rounded"></div>
        </div>
        <div className="example2">
          <div className="bg-accent h-16 w-16 rounded"></div>
        </div>
        <div className="example2">
          <div className="bg-accent-foreground h-16 w-16 rounded"></div>
        </div>
        <div className="example2">
          <div className="destructive h-16 w-16 rounded"></div>
        </div>
        <div className="example2">
          <div className="destructive-foreground h-16 w-16 rounded"></div>
        </div>
        <div className="example2">
          <div className="bg-border h-16 w-16 rounded"></div>
        </div>
      </div>

      <h2>Borders</h2>
      <div className="row">
        <div className="example2">
          <div className="bg-border h-16 w-16 rounded"></div>
        </div>
        <div className="example2">
          <div className="bg-input h-16 w-16 rounded"></div>
        </div>
        <div className="example2">
          <div className="bg-ring h-16 w-16 rounded"></div>
        </div>
      </div>
    </main>
  );
}

const container = document.getElementById('root');
const root = createRoot(container);
root.render(React.createElement(Colors));
