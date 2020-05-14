import React from 'react';
import PropTypes from 'prop-types';
//
import { Toolbar } from '@ohif/ui';

function SecondaryToolbar({ tools }) {
  // const tools = [
  //   {
  //     id: 'Annotate',
  //     label: 'Annotate',
  //     icon: 'tool-annotate',
  //     type: null,
  //     commandName: 'setToolActive',
  //     commandOptions: { toolName: 'Annotate' },
  //     onClick: () => console.log('Activate Annotate'),
  //   },
  //   {
  //     id: 'Bidirectional',
  //     label: 'Bidirectional',
  //     icon: 'tool-bidirectional',
  //     type: null,
  //     commandName: 'setToolActive',
  //     commandOptions: { toolName: 'Bidirectional' },
  //     onClick: () => console.log('Activate Bidirectional'),
  //   },
  //   {
  //     id: 'Elipse',
  //     label: 'Elipse',
  //     icon: 'tool-elipse',
  //     type: null,
  //     commandName: 'setToolActive',
  //     commandOptions: { toolName: 'Elipse' },
  //     onClick: () => console.log('Activate Elipse'),
  //   },
  //   {
  //     id: 'Length',
  //     label: 'Length',
  //     icon: 'tool-length',
  //     type: null,
  //     commandName: 'setToolActive',
  //     commandOptions: { toolName: 'Length' },
  //     onClick: () => console.log('Activate Length'),
  //   },
  // ];
  return <Toolbar type="secondary" tools={tools} />;
}

SecondaryToolbar.propTypes = {
  tools: PropTypes.array.isRequired,
};

export default SecondaryToolbar;
