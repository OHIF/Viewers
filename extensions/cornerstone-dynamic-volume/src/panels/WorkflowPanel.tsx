import React, { useEffect, useState, useCallback } from 'react';

const workflowStages = [
  { id: 0, name: 'Data Preparation', hpStageId: 'dataPreparation' },
  { id: 1, name: 'Registration', hpStageId: 'registration' },
  { id: 2, name: 'Review', hpStageId: 'review' },
  { id: 3, name: 'ROI Quantification', hpStageId: 'roiQuantification' },
  { id: 4, name: 'Kinectic Analysis', hpStageId: 'kinectAnalysis' },
];

const styles = {
  panel: {
    marginBottom: '10px'
  },
  title: {
  },
  container: {
    fontSize: '12px',
    padding: '10px',
  },
  listItem: {
    cursor: 'pointer',
  },
  listItemSelected: {
    cursor: 'pointer',
    color: '#0f0',
  },
}

function WorkflowPanel({ commandsManager }) {
  const [stageId, setStageId] = useState(0);

  const runCommand = useCallback(
    (commandName, commandOptions = {}) => {
      return commandsManager.runCommand(commandName, commandOptions);
    },
    [commandsManager]
  );

  function handleClick({ id, hpStageId }) {
    setStageId(id);
    console.log(id, hpStageId);

    runCommand('setHangingProtocol', {
      protocolId: 'default4D',
      stageId: hpStageId
    });
  }

  const stages = workflowStages.map(stage => {
    return (
      <div
        key={stage.id}
        onClick={() => handleClick(stage)}
        style={ stage.id === stageId ? styles.listItemSelected : styles.listItem }
      >
        { stage.id === stageId && '[' } { stage.name } { stage.id === stageId && ']' }
      </div>
    );
  })

  return (
    <div data-cy={'workflow-panel'} style={styles.panel}>
      <div style={styles.title}>Workflow</div>
      <div style={styles.container}>
        { stages }
      </div>
    </div>
  );
}

export default WorkflowPanel;
