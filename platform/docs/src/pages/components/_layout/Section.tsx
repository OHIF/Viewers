import React from 'react';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

export default function Section({ title, children }: SectionProps) {
  const id = slugify(title);

  return (
    <div className="mb-10">
      <h2
        id={id}
        className="text-highlight mb-4 scroll-mt-20 text-2xl font-medium"
      >
        {title}
      </h2>
      {children}
    </div>
  );
}
