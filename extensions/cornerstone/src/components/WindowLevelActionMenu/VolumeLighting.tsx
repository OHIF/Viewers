import React, { ReactElement, useState, useEffect, useCallback } from 'react';
import { VolumeLightingProps } from '../../types/ViewportPresets';
import { Numeric } from '@ohif/ui-next';
import { useSystem } from '@ohif/core';

export function VolumeLighting({ viewportId, hasShade }: VolumeLightingProps): ReactElement {
  const { servicesManager, commandsManager } = useSystem();
  const { cornerstoneViewportService } = servicesManager.services;
  const [lightingValues, setLightingValues] = useState({
    ambient: null,
    diffuse: null,
    specular: null,
  });

  // Single callback to handle all lighting property changes
  const onLightingChange = useCallback(
    (property, value) => {
      commandsManager.runCommand('setVolumeLighting', {
        viewportId,
        options: { [property]: value },
      });
      setLightingValues(prev => ({
        ...prev,
        [property]: value,
      }));
    },
    [commandsManager, viewportId]
  );

  useEffect(() => {
    const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);
    const { actor } = viewport.getActors()[0];
    const property = actor.getProperty();

    const values = {
      ambient: property.getAmbient(),
      diffuse: property.getDiffuse(),
      specular: property.getSpecular(),
    };

    setLightingValues(values);
  }, [viewportId, cornerstoneViewportService]);

  const disableOption = hasShade ? '' : 'ohif-disabled !opacity-40';

  // Configuration for our lighting properties
  const lightingProperties = [
    { key: 'ambient', label: 'Ambient' },
    { key: 'diffuse', label: 'Diffuse' },
    { key: 'specular', label: 'Specular' },
  ];

  return (
    <div className="my-1 mt-2 flex flex-col space-y-2">
      {lightingProperties.map(
        ({ key, label }) =>
          lightingValues[key] !== null && (
            <div
              key={key}
              className={`w-full pl-2 pr-1 ${disableOption}`}
            >
              <Numeric.Container
                mode="singleRange"
                min={0}
                max={1}
                step={0.1}
                value={lightingValues[key]}
                onChange={value => onLightingChange(key, value)}
              >
                <div className="flex flex-row items-center">
                  <Numeric.Label className="w-16">{label}</Numeric.Label>
                  <Numeric.SingleRange sliderClassName="mx-2 flex-grow" />
                </div>
              </Numeric.Container>
            </div>
          )
      )}
    </div>
  );
}
