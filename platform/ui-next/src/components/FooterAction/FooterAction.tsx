import React from 'react';
import { Button } from '../Button/Button';

interface FooterActionProps {
  children: React.ReactNode;
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

export const FooterAction: FooterActionComponent = ({ children }: FooterActionProps) => {
  return <div className="flex w-full items-center justify-between">{children}</div>;
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
