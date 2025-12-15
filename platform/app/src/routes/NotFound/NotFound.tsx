import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { Button, Icons } from '@ohif/ui-next';
import { useAppConfig } from '@state';

const NotFound = ({
  message = "We can't find the page you're looking for.",
  showGoBackButton = true,
}) => {
  const [appConfig] = useAppConfig();
  const { showStudyList } = appConfig;
  const navigate = useNavigate();

  return (
    <div className="absolute flex h-full w-full items-center justify-center bg-black">
      <div className="flex flex-col">
        <div className="bg-background flex items-center justify-center rounded-t-2xl p-6">
          <Icons.IllustrationNotFound />
        </div>
        <div className="bg-input h-px" />
        <div className="bg-muted flex flex-col items-center justify-center rounded-b-2xl p-8 text-center">
          <h1 className="text-foreground text-[22px] font-light">Error (404)</h1>
          <p className="text-muted-foreground mt-1 text-[16px] font-light">{message}</p>
          {showGoBackButton && showStudyList && (
            <Button
              className="mt-8 px-3 text-lg"
              onClick={() => navigate('/')}
            >
              Return to Study List
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

NotFound.propTypes = {
  message: PropTypes.string,
  showGoBackButton: PropTypes.bool,
};

export default NotFound;
