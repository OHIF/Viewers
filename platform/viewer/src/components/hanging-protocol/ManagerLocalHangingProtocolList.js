/* eslint-disable react/prop-types */

import React from 'react';
// import produce from 'immer';

function Rules({ rules, title }) {
  return (
    <div>
      {title}
      <ul>
        {rules.map(rule =>
          Object.keys(rule.constraint).map(op => (
            <li key={`${rule.attribute}-${op}`}>
              {rule.attribute} {op} {rule.constraint[op].value}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

export function LocalHangingProtocolListModal({ protocolStore }) {
  const protocols = protocolStore.getProtocol();
  console.log('protocols =', protocols);

  const removeStage = (proto, stageId) => {
    proto.stages = proto.stages.filter(stage => stage.id != stageId);
    if (proto.stages.length === 0) {
      protocolStore.removeProtocol(proto.id);
    } else {
      protocolStore.updateProtocol(proto.id, proto);
    }
  };

  return (
    <ul>
      {protocols.map(proto => (
        <li key={proto.id}>
          <div>
            Protocol {proto.name || proto.id}{' '}
            <button onClick={() => protocolStore.removeProtocol(proto.id)}>
              remove
            </button>
          </div>
          <Rules rules={proto.protocolMatchingRules} title={'Matching Rules'} />
          <div>
            {proto.stages.map(stage => (
              <div key={stage.id}>
                <div>
                  Stage {stage.name || stage.id}{' '}
                  <button onClick={() => removeStage(proto, stage.id)}>
                    remove
                  </button>
                </div>
                <div>Layout: </div>
                <ul>
                  {stage.viewports.map((viewport, index) => (
                    <li key={index}>
                      <div>Viewport #{index + 1}</div>
                      <Rules
                        rules={viewport.seriesMatchingRules}
                        title={'Series Matching Rule'}
                      />
                      <Rules
                        rules={viewport.imageMatchingRules}
                        title={'Image Matching Rule'}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </li>
      ))}
    </ul>
  );
}
