import React, { ReactElement, useState, useEffect, useCallback } from 'react';
import { VolumeLightingProps } from '../../types/ViewportPresets';

export function VolumeLighting({
  servicesManager,
  commandsManager,
  viewportId,
}: VolumeLightingProps): ReactElement {
  const { cornerstoneViewportService } = servicesManager.services;
  const [ambient, setAmbient] = useState(null);
  const [diffuse, setDiffuse] = useState(null);
  const [specular, setSpecular] = useState(null);

  const onAmbientChange = useCallback(() => {
    commandsManager.runCommand('setVolumeLighting', { viewportId, options: { ambient } });
  }, [ambient, commandsManager, viewportId]);

  const onDiffuseChange = useCallback(() => {
    commandsManager.runCommand('setVolumeLighting', { viewportId, options: { diffuse } });
  }, [diffuse, commandsManager, viewportId]);

  const onSpecularChange = useCallback(() => {
    commandsManager.runCommand('setVolumeLighting', { viewportId, options: { specular } });
  }, [specular, commandsManager, viewportId]);

  const calculateBackground = value => {
    const percentage = ((value - 0) / (1 - 0)) * 100;
    return `linear-gradient(to right, #5acce6 0%, #5acce6 ${percentage}%, #3a3f99 ${percentage}%, #3a3f99 100%)`;
  };

  useEffect(() => {
    const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);
    const { actor } = viewport.getActors()[0];
    const ambient = actor.getProperty().getAmbient();
    const diffuse = actor.getProperty().getDiffuse();
    const specular = actor.getProperty().getSpecular();
    setAmbient(ambient);
    setDiffuse(diffuse);
    setSpecular(specular);
  }, [viewportId, cornerstoneViewportService]);
  return (
    <>
      <div className="all-in-one-menu-item flex  w-full flex-row !items-center justify-between gap-[10px]">
        <label
          className="block  text-white"
          htmlFor="ambient"
        >
          Ambient
        </label>
        {ambient !== null && (
          <input
            className="bg-inputfield-main h-2 w-[120px] cursor-pointer appearance-none rounded-lg"
            value={ambient}
            onChange={e => {
              setAmbient(e.target.value);
              onAmbientChange();
            }}
            id="ambient"
            max={1}
            min={0}
            type="range"
            step={0.1}
            style={{
              background: calculateBackground(ambient),
              '--thumb-inner-color': '#5acce6',
              '--thumb-outer-color': '#090c29',
            }}
          />
        )}
      </div>
      <div className="all-in-one-menu-item flex  w-full flex-row !items-center justify-between gap-[10px]">
        <label
          className="block  text-white"
          htmlFor="diffuse"
        >
          Diffuse
        </label>
        {diffuse !== null && (
          <input
            className="bg-inputfield-main h-2 w-[120px] cursor-pointer appearance-none rounded-lg"
            value={diffuse}
            onChange={e => {
              setDiffuse(e.target.value);
              onDiffuseChange();
            }}
            id="diffuse"
            max={1}
            min={0}
            type="range"
            step={0.1}
            style={{
              background: calculateBackground(diffuse),
              '--thumb-inner-color': '#5acce6',
              '--thumb-outer-color': '#090c29',
            }}
          />
        )}
      </div>

      <div className="all-in-one-menu-item flex  w-full flex-row !items-center justify-between gap-[10px]">
        <label
          className="block  text-white"
          htmlFor="specular"
        >
          Specular
        </label>
        {specular !== null && (
          <input
            className="bg-inputfield-main h-2 w-[120px] cursor-pointer appearance-none rounded-lg"
            value={specular}
            onChange={e => {
              setSpecular(e.target.value);
              onSpecularChange();
            }}
            id="specular"
            max={1}
            min={0}
            type="range"
            step={0.1}
            style={{
              background: calculateBackground(specular),
              '--thumb-inner-color': '#5acce6',
              '--thumb-outer-color': '#090c29',
            }}
          />
        )}
      </div>
    </>
  );
}
