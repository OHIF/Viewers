import React from 'react';
import { useServices } from '@ohif/ui';

interface ICustomizableRenderComponent {
  customizationId: string;
  FallbackComponent: React.ElementType;
  [key: string]: any;
}

export default function CustomizableRenderComponent(props: ICustomizableRenderComponent) {
  const { customizationId, FallbackComponent, ...rest } = props;
  const { services } = useServices();
  const CustomizedComponent = services.customizationService.getCustomization(customizationId);
  return CustomizedComponent ? <CustomizedComponent {...rest} /> : <FallbackComponent {...rest} />;
}
