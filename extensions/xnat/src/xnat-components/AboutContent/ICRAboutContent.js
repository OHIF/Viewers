import React from 'react';
import { version } from '../../../package.json';

import './ICRAboutContent.styl';

export const ICRAboutContent = () => {
  return (
    <div className="icr-about">
      <h1>Integration of the OHIF viewer in XNAT - {version.toUpperCase()}</h1>
      <h2>Acknowledgements</h2>
      <h3>
        <span>Core viewer platform:</span> the Open Health Imaging Foundation
      </h3>
      <p>
        Ziegler E, Urban T, Brown D, Petts J, Pieper SD, Lewis R, Hafey C,
        Harris GJ. Open Health Imaging Foundation Viewer: An extensible
        open-source framework for building web-based imaging applications to
        support cancer research. JCO clinical cancer informatics.
        2020 Apr;4:336-45
      </p>
      <h3>
        <span>Initial integration work (v1.0 and 2.0):</span> Cancer Research
        UK Cancer Imaging Centre, Division of Radiotherapy and Imaging,
        The Institute of Cancer Research, London, UK.
      </h3>
      <p>
        This work was supported by Cancer Research UK (CRUK) and the
        Engineering and Physical Sciences Research Council, in association
        with Medical Research Council and UK Department of Health
        (C1060/A10334, C1060/A16464); and the National Cancer Institute
        (NCI 1U24CA204854-01)
      </p>
      <h3>
        <span>Version 3.0:</span> Repository Unit of the National Cancer
        Imaging Translational Accelerator (NCITA), UK
      </h3>
      <p>
        This work was supported by the Cancer Research UK National Cancer
        Imaging Translational Accelerator Award (C4278/A27066)
      </p>
      <h3>
        <span>AIAA experimental feature:</span> NVIDIA and NCITA
      </h3>
      <h3>
        <span>MONAILabel experimental feature:</span> NVIDIA and NCITA
      </h3>
    </div>
  );
};
