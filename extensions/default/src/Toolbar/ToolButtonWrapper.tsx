import React from 'react';
import { useIconPresentation, Icons, Button } from '@ohif/ui-next';

export default function ToolButtonWrapper(props) {
  const { IconContainer, containerProps } = useIconPresentation();

  const Icon = <Icons.ByName name={props.icon} />;

  return (
    <div>
      {IconContainer ? (
        <IconContainer
          disabled={props.disabled}
          {...props}
          {...containerProps}
        >
          {Icon}
        </IconContainer>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          disabled={props.disabled}
        >
          {Icon}
        </Button>
      )}
    </div>
  );
}

export { ToolButtonWrapper };
