import React from 'react';

interface OHIFStudySummaryProps {
  date: string;
  description: string;
}

/**
 * OHIFStudySummary component displays a summary of a study with its date and description.
 */
export function OHIFStudySummary({ date, description }: OHIFStudySummaryProps) {
  return (
    <div className="mx-2 my-0">
      <div className="text-foreground text-sm">{date}</div>
      <div className="text-muted-foreground pb-1 text-sm">{description}</div>
    </div>
  );
}