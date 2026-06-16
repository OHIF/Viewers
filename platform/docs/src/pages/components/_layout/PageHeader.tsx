import React from 'react';

interface PageHeaderProps {
  title: string;
  description: string;
}

export default function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="mb-8">
      <h1 className="text-highlight mb-2 text-4xl font-medium">{title}</h1>
      <p className="text-muted-foreground text-xl">{description}</p>
    </div>
  );
}
