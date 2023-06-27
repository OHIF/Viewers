import React from 'react';

export default function getWarningsContent(warnings): React.ReactNode {
  return (
    <>
      <div className="break-normal text-base text-blue-300 font-bold">
        Series Inconsistencies
      </div>
      <ol>
        {warnings.map((warn, index) => (
          <li key={index}>
            {index + 1}. {warn}
          </li>
        ))}
      </ol>
    </>
  );
}
