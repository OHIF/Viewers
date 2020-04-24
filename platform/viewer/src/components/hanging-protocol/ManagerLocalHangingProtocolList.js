/* eslint-disable react/prop-types */

import React from 'react';
import { Icon } from '@ohif/ui';
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
  const [protocols, setProtocols] = React.useState(protocolStore.getProtocol());

  const removeStage = (proto, stageId) => {
    proto.stages = proto.stages.filter(stage => stage.id != stageId);
    if (proto.stages.length === 0) {
      protocolStore.removeProtocol(proto.id);
    } else {
      protocolStore.updateProtocol(proto.id, proto);
    }
    setProtocols(protocolStore.getProtocol());
  };

  const removeProtocol = id => {
    protocolStore.removeProtocol(id);
    setProtocols(protocolStore.getProtocol());
  };

  return (
    <ul>
      {protocols.map(proto => (
        <li key={proto.id}>
          <div style={{ display: 'flex' }}>
            <div style={{ margin: 5 }}>Protocol {proto.name || proto.id}</div>
            <div style={{ margin: 5 }}>
              <div onClick={() => removeProtocol(proto.id)}>
                <Icon name="trash" />
              </div>
            </div>
          </div>
          {/* <Rules rules={proto.protocolMatchingRules} title={'Matching Rules'} /> */}
          <ul>
            {proto.stages.map(stage => (
              <li key={stage.id}>
                <div style={{ display: 'flex' }}>
                  <div style={{ margin: 5 }}>
                    Stage {stage.name || stage.id}
                  </div>
                  <div style={{ margin: 5 }}>
                    <div onClick={() => removeStage(proto, stage.id)}>
                      <Icon name="trash" />{' '}
                    </div>
                  </div>
                </div>
                {/* <div>Layout: </div> */}
                {/* <ul>
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
                </ul> */}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}
