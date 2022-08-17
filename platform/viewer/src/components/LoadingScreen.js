import { NProgress } from '@tanem/react-nprogress';
import React from 'react';
import { Bar, Container } from './LoadingBar';

const LoadingScreen = () => {
  useEffect(() => {
    NProgress.start();

    return () => {
      NProgress.done();
    };
  }, []);

  const { isFinished, progress, animationDuration } = useNProgress({});

  return (
    <div>
      <Container isFinished={isFinished} animationDuration={animationDuration}>
        <Bar progress={progress} animationDuration={animationDuration} />
      </Container>
    </div>
  );
};

export default LoadingScreen;
