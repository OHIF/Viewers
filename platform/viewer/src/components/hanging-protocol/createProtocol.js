import cornerstone from 'cornerstone-core';
import { commandsManager } from '../../App';
import { hangingProtocols } from '@ohif/core';

export function createProto(viewports, studies) {
  const {
    Protocol,
    Rule,
    Stage,
    Viewport,
    ViewportStructure,
  } = hangingProtocols.classes;

  const proto = new Protocol('a proto');

  const study = studies[0];
  const studyMetadata = study.metadata;
  const studyAttrs = metadataAttrs(studyMetadata.getData());

  const rulesFromAttrs = attrs =>
    Object.entries(attrs).map(
      ([key, value]) => new Rule(key, { equals: { value } })
    );

  rulesFromAttrs(studyAttrs).forEach(rule =>
    proto.addProtocolMatchingRule(rule)
  );

  const layout = new ViewportStructure('grid', {
    Rows: viewports.numRows,
    Columns: viewports.numColumns,
  });

  const stage = new Stage(layout, 'stageName');
  Object.values(viewports.viewportSpecificData).map(
    (viewportSpecificData, viewportIndex) => {
      const viewport = new Viewport();

      // Series matching rules
      const SeriesInstanceUID = viewportSpecificData.SeriesInstanceUID;
      const seriesMetadata = studyMetadata.getSeriesByUID(SeriesInstanceUID);
      const seriesAttrs = metadataAttrs(seriesMetadata.getData());
      viewport.seriesMatchingRules = rulesFromAttrs(seriesAttrs);

      // Image mathcing rules
      function getDistinctiveImageAttributes(seriesMetadata) {
        let counts = {};
        seriesMetadata.forEachInstance(instance => {
          let instanceAttrs = metadataAttrs(instance.getData().metadata);
          Object.entries(instanceAttrs).forEach(([key, value]) => {
            counts[key] = counts[key] || {};
            counts[key][value] = counts[key][value] || 0;
            counts[key][value]++;
          });
        });
        let distinctiveAttrs = Object.keys(counts).filter(
          key =>
            Object.values(counts[key])[0] !== seriesMetadata.getInstanceCount()
        );
        if (distinctiveAttrs.length === 0) {
          distinctiveAttrs = ['InstanceNumber'];
        }
        return distinctiveAttrs;
      }
      const distinctiveAttributes = getDistinctiveImageAttributes(
        seriesMetadata
      );

      function getCurrentInstanceAndViewportSettings() {
        let ee = commandsManager.runCommand('getViewportEnabledElement', {
          viewportIndex,
        });

        // Ideally, only modified settings should be stored
        let viewportSettings = cornerstone.getViewport(ee);
        ee = cornerstone.getEnabledElement(ee);
        // let defaultViewportSettings = cornerstone.getDefaultViewport(ee);
        const imageId = ee.image.imageId;
        const SOPInstanceUID = cornerstone.metaData.get(
          'SOPInstanceUID',
          imageId
        );
        let instance = seriesMetadata.getInstanceByUID(SOPInstanceUID);
        return { instance, viewportSettings };
      }
      const {
        instance,
        viewportSettings,
      } = getCurrentInstanceAndViewportSettings();
      viewport.viewportSettings = viewportSettings;

      const instanceAttrs = metadataAttrs(
        instance.getData().metadata,
        distinctiveAttributes
      );
      viewport.imageMatchingRules = rulesFromAttrs(instanceAttrs);

      stage.viewports.push(viewport);
    }
  );
  proto.stages.push(stage);
  return proto;
}

function metadataAttrs(metadata, keys) {
  return Object.fromEntries(
    Object.entries(metadata).filter(
      ([key, value]) =>
        !(
          (keys && !keys.includes(key)) ||
          value === undefined ||
          typeof value === 'object' ||
          key.endsWith('Date') ||
          key.endsWith('Time') ||
          value.toString().startsWith('http')
        )
    )
  );
}
