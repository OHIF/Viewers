import React, { ReactElement } from 'react';

export function VolumeLighting(): ReactElement {
  return (
    <>
      <div className="pb-1 text-[14px]">Lighting</div>
      <label
        className="text-aqua-pale block  text-sm font-medium"
        htmlFor="ambient"
      >
        Ambient
      </label>
      <input
        className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-700 dark:bg-gray-700"
        defaultValue={2}
        id="ambient"
        max={0}
        min={0}
        type="range"
        step={0}
      />
      <label
        className="text-aqua-pale block  text-sm font-medium"
        htmlFor="diffuse"
      >
        Diffuse
      </label>
      <input
        className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-700 dark:bg-gray-700"
        defaultValue={2}
        id="diffuse"
        max={0}
        min={0}
        type="range"
        step={0}
      />
      <label
        className="text-aqua-pale block  text-sm font-medium"
        htmlFor="specular"
      >
        Specular
      </label>
      <input
        className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-700 dark:bg-gray-700"
        defaultValue={2}
        id="specular"
        max={0}
        min={0}
        type="range"
        step={0}
      />
    </>
  );
}
