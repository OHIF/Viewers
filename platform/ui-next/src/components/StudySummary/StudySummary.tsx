import React from 'react';

interface StudySummaryProps {
  date: string;
  description: string;
}

/**
 * StudySummary component displays a summary of a study with its date and description.
 *
 * @param props - The properties for the StudySummary component
 * @param props.date - The date of the study
 * @param props.description - The description of the study
 */
const StudySummary: React.FC<StudySummaryProps> = ({ date, description }) => {
  return (
    <div
      className="mx-2 my-0"
      style={{ textAlign: 'left' }}
    >
      <div className="text-foreground text-sm">{date}</div>
      <div className="text-muted-foreground pb-1 text-sm">{description}</div>
    </div>
  );
};

export { StudySummary };
