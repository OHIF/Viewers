import React from 'react';
import { useToolbar } from '@ohif/core';
import PropTypes from 'prop-types';

export function Toolbar({ servicesManager, buttonSection = 'primary' }) {
  const { toolbarButtons, onInteraction } = useToolbar({
    servicesManager,
    buttonSection,
  });

  const { rbacService } = servicesManager.services;

  if (!toolbarButtons.length) {
    return null;
  }

  return (
    <>
      {toolbarButtons
        .filter(toolDef => toolDef && !rbacService.hasAccess(toolDef.id))
        .map(toolDef => {
          if (!toolDef) {
            return null;
          }

          const { id, Component, componentProps } = toolDef;
          const tool = (
            <Component
              key={id}
              id={id}
              onInteraction={onInteraction}
              servicesManager={servicesManager}
              {...componentProps}
            />
          );

          return <div key={id}>{tool}</div>;
        })}
    </>
  );
}

Toolbar.propTypes = {
  servicesManager: PropTypes.shape({
    services: PropTypes.shape({
      rbacService: PropTypes.shape({
        hasAccess: PropTypes.func.isRequired,
      }).isRequired,
    }).isRequired,
  }).isRequired,
  buttonSection: PropTypes.string,
};
