import React from 'react';

interface FormSectionProps {
  children: React.ReactNode;
}

export const FormSection: React.FC<FormSectionProps> = ({ children }) => {
  return <div className="grid grid-cols-2 gap-2">{children}</div>;
};
