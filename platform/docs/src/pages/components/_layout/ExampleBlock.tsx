import React from 'react';

interface ExampleBlockProps {
  title: string;
  children: React.ReactNode;
  last?: boolean;
}

export default function ExampleBlock({ title, children, last }: ExampleBlockProps) {
  return (
    <div className={last ? '' : 'mb-6'}>
      <h3 className="text-foreground mb-3 text-lg font-medium">{title}</h3>
      <div className="rounded-lg border border-input/50 bg-muted/30 p-6">{children}</div>
    </div>
  );
}
