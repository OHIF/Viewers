import React from 'react';

import { useAuthenticationContext } from '@xylexa/xylexa-app';

export const ReportFooter = () => {
  const { userInfo } = useAuthenticationContext();

  return (
    <div className="p-4 text-center">
      <div className="w-80">
        <div className="mb-2 border-b border-black">
          <i>{userInfo?.name}</i>
        </div>
        <div className="mb-10 text-lg">E-signature</div>
      </div>
      <div className="text-justify text-sm">
        I confirm that I have independently interpreted the study cases in accordance with the
        protocol. By providing my e-signature, I certify the accuracy of my evaluations and their
        legal validity.
      </div>
    </div>
  );
};
