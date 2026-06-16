import React from 'react';

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

export default function Section({ title, children }: SectionProps) {
  return (
    <div className="mb-10">
      <h2 className="text-highlight mb-4 text-2xl font-medium">{title}</h2>
      {children}
    </div>
  );
}
