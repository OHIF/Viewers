import React from 'react';

interface StudySummaryProps {
  date: string;
  modality: string;
  description?: string;
}

const StudySummary: React.FC<StudySummaryProps> = ({ date, modality, description }) => {
  return (
    <div className="p-2">
      <div className="leading-none">
        <span className="mr-2 text-base text-white">{date}</span>
        <span className="bg-common-bright rounded-sm px-1 text-base font-bold text-black">
          {modality}
        </span>
      </div>
      <div className="text-primary-light ellipse truncate pt-2 text-base leading-none">
        {description || ''}
      </div>
    </div>
  );
};

export default StudySummary;
