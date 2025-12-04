import React from 'react';

const Version: React.FC = () => {
  return (
    <div className="text-md absolute top-7 right-9 z-10 text-red-500">
      v{process.env.VERSION_NUMBER}
    </div>
  );
};

export default Version;
