import React from 'react';
import { Button } from '../Button/Button';
import { cn } from '../../lib/utils';

interface FooterActionProps {
  children: React.ReactNode;
  className?: string;
}

interface ActionProps extends FooterActionProps {
  onClick: () => void;
  className?: string;
}

type FooterActionComponent = React.FC<FooterActionProps> & {
  Left: React.FC<FooterActionProps>;
  Right: React.FC<FooterActionProps>;
  Primary: React.FC<ActionProps>;
  Secondary: React.FC<ActionProps>;
  Auxiliary: React.FC<ActionProps>;
};

export const FooterAction: FooterActionComponent = ({ children, className }: FooterActionProps) => {
  // Convert children to array for easier inspection
  const arrayChildren = React.Children.toArray(children);

  // Check if we have a <FooterAction.Left> or <FooterAction.Right> among children
  const hasLeft = arrayChildren.some(
    (child: any) => child.type?.displayName === 'FooterAction.Left'
  );
  const hasRight = arrayChildren.some(
    (child: any) => child.type?.displayName === 'FooterAction.Right'
  );

  // Decide on the justification class based on presence of Left/Right
  let justifyClass = 'justify-between'; // default
  if (hasLeft && !hasRight) {
    justifyClass = 'justify-start';
  } else if (!hasLeft && hasRight) {
    justifyClass = 'justify-end';
  }
  // If both or neither are present, keep justify-between (or adjust if you like)
  return (
    <div className={cn('flex w-full flex-shrink-0 items-center', justifyClass, className)}>
      {children}
    </div>
  );
};

FooterAction.displayName = 'FooterAction';

FooterAction.Left = ({ children }: FooterActionProps) => {
  return <div className="flex items-center">{children}</div>;
};
FooterAction.Left.displayName = 'FooterAction.Left';

FooterAction.Right = ({ children }: FooterActionProps) => {
  return <div className="flex items-center space-x-2">{children}</div>;
};
FooterAction.Right.displayName = 'FooterAction.Right';

// Primary action: Solid button (default)
FooterAction.Primary = ({ children, onClick, className = 'min-w-[80px]' }: ActionProps) => {
  return (
    <Button
      variant="default"
      onClick={onClick}
      className={className}
    >
      {children}
    </Button>
  );
};
FooterAction.Primary.displayName = 'FooterAction.Primary';

// Secondary action: Ghost button
FooterAction.Secondary = ({ children, onClick, className = 'min-w-[80px]' }: ActionProps) => {
  return (
    <Button
      variant="secondary"
      onClick={onClick}
      className={className}
    >
      {children}
    </Button>
  );
};
FooterAction.Secondary.displayName = 'FooterAction.Secondary';

// Tertiary action: Ghost button with different styling
FooterAction.Auxiliary = ({ children, onClick, className }: ActionProps) => {
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className={className}
    >
      {children}
    </Button>
  );
};
FooterAction.Auxiliary.displayName = 'FooterAction.Auxiliary';
