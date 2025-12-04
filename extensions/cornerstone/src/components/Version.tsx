import React from 'react';

const Version: React.FC = () => {
  return (
    <div className="text-md absolute top-5 right-9 z-50 text-red-500">
      v{process.env.VERSION_NUMBER}
    </div>
  );
};

export default Version;
