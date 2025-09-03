import React, { useState } from 'react';

import { Icon } from '@ohif/ui';

import { useAuthenticationContext } from '../context';

export function UserInfo() {
  const { userInfo } = useAuthenticationContext();

  const [expanded, setExpanded] = useState(false);

  const handleOnClick = () => {
    setExpanded(!expanded);
  };

  const UpperCaseUserName = userInfo?.name?.toUpperCase();

  return (
    <div
      className="hover:bg-primary-dark flex cursor-pointer items-center justify-center gap-1 rounded-lg"
      onClick={handleOnClick}
    >
      <Icon
        name={'icon-patient'}
        className="text-primary-active mr-2"
      />
      <div className="flex flex-col justify-center">
        {expanded ? (
          <>
            <div className="self-start text-[13px] font-bold text-white">{UpperCaseUserName}</div>
            <div className="text-aqua-pale flex gap-2 text-[11px]">
              {userInfo?.email.length !== 0 ? <div>{userInfo?.email}</div> : <div>-</div>}
            </div>
          </>
        ) : (
          <div className="text-primary-active self-center text-[13px]">{UpperCaseUserName}</div>
        )}
      </div>
      <Icon
        name="icon-chevron-patient"
        className={`text-primary-active ${expanded ? 'rotate-180' : ''}`}
      />
    </div>
  );
}

export default UserInfo;
