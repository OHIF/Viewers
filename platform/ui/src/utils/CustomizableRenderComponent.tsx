import React from 'react';
import { useServices } from '@ohif/ui';

interface ICustomizableRenderComponent {
  customizationId: string;
  [key: string]: any;
}

export default function CustomizableRenderComponent(props: ICustomizableRenderComponent) {
  const { customizationId, ...rest } = props;
  const { services } = useServices();
  const Component = services.customizationService.getCustomization(customizationId);
  return <Component {...rest} />;
}
