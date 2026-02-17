import type { CommandsManager, ServicesManager } from '@ohif/core';
import type { CastTransport } from '../network/CastClient';
import type { CastMessage } from '../network/types';
import { applySceneViewToViewports } from '../utils/applySceneViewToViewports';

const LOG_PREFIX = 'CastService';

export interface CastMessageHandlerDeps {
  commandsManager: CommandsManager;
  servicesManager: ServicesManager;
  transport: CastTransport;
  annotationsFromCast: Set<string>;
  measurementsFromCast: Set<string>;
}

export class CastMessageHandler {
  private _commandsManager: CommandsManager;
  private _servicesManager: ServicesManager;
  private _transport: CastTransport;
  private _annotationsFromCast: Set<string>;
  private _measurementsFromCast: Set<string>;

  constructor(deps: CastMessageHandlerDeps) {
    this._commandsManager = deps.commandsManager;
    this._servicesManager = deps.servicesManager;
    this._transport = deps.transport;
    this._annotationsFromCast = deps.annotationsFromCast;
    this._measurementsFromCast = deps.measurementsFromCast;
  }

  handle(castMessage: CastMessage & Record<string, unknown>): void {
    const event = castMessage.event;
    if (!event) return;

    const hubEvent = (event['hub.event'] as string)?.toLowerCase();
    if (!hubEvent) return;

    if (hubEvent === 'get-request') {
      this._handleGetRequest(castMessage);
      return;
    }

    const currentLocation = typeof window !== 'undefined' ? window.location.search : '';

    if (hubEvent === 'patient-open') {
      this._handlePatientOpen(event, currentLocation);
      return;
    }
    if (currentLocation && hubEvent === 'patient-close') {
      this._commandsManager.runCommand('navigateHistory', { to: '/' });
      return;
    }
    if (hubEvent === 'imagingstudy-open') {
      this._handleImagingStudyOpen(event, currentLocation);
      return;
    }
    if (currentLocation && hubEvent === 'imagingstudy-close') {
      this._commandsManager.runCommand('navigateHistory', { to: '/' });
      return;
    }
    if (currentLocation && hubEvent === 'diagnosticreport-close') {
      this._commandsManager.runCommand('navigateHistory', { to: '/' });
      return;
    }
    if (hubEvent === 'annotation-update') {
      this._handleAnnotationUpdate(event);
      return;
    }
    if (hubEvent === 'measurement-update') {
      this._handleMeasurementUpdate(event);
    }
  }

  applySceneView(sceneViewData: Parameters<typeof applySceneViewToViewports>[1]): void {
    applySceneViewToViewports(this._servicesManager, sceneViewData);
  }

  private _handleGetRequest(castMessage: CastMessage & Record<string, unknown>): void {
    const context = castMessage.event?.context as { dataType?: string; requestId?: string } | undefined;
    if (!context || context.dataType !== 'SCENEVIEW') {
      return;
    }
    const requestId = context.requestId;
    if (!requestId) return;

    const hub = this._transport.getHub();
    if (!hub.websocket || (hub.websocket as WebSocket).readyState !== WebSocket.OPEN) {
      return;
    }

    const topic = (castMessage.event as Record<string, string>)?.['hub.topic'] ?? hub.topic;
    this._transport.sendGetResponse(
      requestId,
      { 'SCENEVIEW RESPONSE TBD': 'SCENEVIEW RESPONSE TBD' },
      topic
    );
  }

  private _handlePatientOpen(event: Record<string, unknown>, _currentLocation: string): void {
    const context = event.context as Array<{ key: string; resource: { identifier?: Array<{ value: string }> } }> | undefined;
    if (!context) return;
    let mrn: string | null = null;
    for (const cr of context) {
      if (cr.key?.toLowerCase() === 'patient' && cr.resource?.identifier?.[0]?.value) {
        mrn = cr.resource.identifier[0].value;
        break;
      }
    }
    if (mrn) {
      this._commandsManager.runCommand('navigateHistory', { to: '/?mrn=' + mrn });
    }
  }

  private _handleImagingStudyOpen(event: Record<string, unknown>, currentLocation: string): void {
    const context = event.context as Array<{ key: string; resource: { uid?: string } }> | undefined;
    if (!context) return;
    let studyUID: string | null = null;
    for (const cr of context) {
      if (cr.key?.toLowerCase() === 'study' && cr.resource?.uid) {
        studyUID = cr.resource.uid.replaceAll('urn:oid:', '');
        break;
      }
    }
    if (studyUID && !currentLocation.includes(studyUID)) {
      this._commandsManager.runCommand('navigateHistory', {
        to: '/viewer?StudyInstanceUIDs=' + studyUID + '&Cast',
      });
    }
  }

  private _handleAnnotationUpdate(event: Record<string, unknown>): void {
    const context = event.context as Array<{ key: string; resource: Record<string, unknown> }> | undefined;
    if (!context) return;

    let annotationResource: Record<string, unknown> | null = null;
    for (const cr of context) {
      if (cr.key?.toLowerCase() === 'annotation') {
        annotationResource = cr.resource;
        break;
      }
    }

    if (!annotationResource?.uid) return;

    this._annotationsFromCast.add(annotationResource.uid as string);

    if (annotationResource.action === 'removed') {
      this._handleAnnotationRemoved(annotationResource);
      return;
    }
    this._handleAnnotationAddedOrUpdated(annotationResource);
  }

  private async _handleAnnotationRemoved(annotationResource: Record<string, unknown>): Promise<void> {
    const { MeasurementService } = this._servicesManager.services;
    const annotationUID = annotationResource.uid as string;

    const measurement = MeasurementService?.getMeasurement(annotationUID);
    if (measurement) {
      MeasurementService.remove(annotationUID, measurement.source);
    }

    try {
      const { annotation } = await import('@cornerstonejs/tools');
      annotation.state.removeAnnotation(annotationUID);
    } catch {
      // Cornerstone tools may not be available
    }

    this._annotationsFromCast.delete(annotationUID);
  }

  private async _handleAnnotationAddedOrUpdated(annotationResource: Record<string, unknown>): Promise<void> {
    const annotationUID = annotationResource.uid as string;
    const { MeasurementService, displaySetService } = this._servicesManager.services;
    const measurement = annotationResource.measurement as Record<string, unknown> | undefined;

    let existingAnnotation: Record<string, unknown> | null = null;
    try {
      const { annotation } = await import('@cornerstonejs/tools');
      existingAnnotation = annotation.state.getAnnotation(annotationUID) as Record<string, unknown>;
    } catch {
      // Annotation may not exist yet
    }

    if (existingAnnotation) {
      await this._updateAnnotation(existingAnnotation, annotationResource, measurement);
    } else {
      await this._createAnnotation(annotationResource, measurement);
    }
  }

  private async _updateAnnotation(
    existingAnnotation: Record<string, unknown>,
    annotationResource: Record<string, unknown>,
    measurement: Record<string, unknown> | undefined
  ): Promise<void> {
    const { MeasurementService } = this._servicesManager.services;
    const annotationUID = annotationResource.uid as string;

    try {
      const { annotation } = await import('@cornerstonejs/tools');
      const { triggerAnnotationRenderForViewportIds } = await import('@cornerstonejs/tools/utilities');

      if (annotationResource.data) {
        Object.assign((existingAnnotation.data as Record<string, unknown>) ?? {}, annotationResource.data);
      }
      if (annotationResource.metadata) {
        Object.assign((existingAnnotation.metadata as Record<string, unknown>) ?? {}, annotationResource.metadata);
      }
      if ((annotationResource.metadata as Record<string, unknown>)?.isLocked !== undefined) {
        annotation.locking.setAnnotationLocked(
          annotationUID,
          (annotationResource.metadata as Record<string, boolean>).isLocked
        );
      }
      if ((annotationResource.metadata as Record<string, unknown>)?.isVisible !== undefined) {
        annotation.visibility.setAnnotationVisibility(
          annotationUID,
          (annotationResource.metadata as Record<string, boolean>).isVisible
        );
      }

      try {
        const { cornerstoneViewportService } = this._servicesManager.services;
        const renderingEngine = cornerstoneViewportService?.getRenderingEngine();
        if (renderingEngine) {
          triggerAnnotationRenderForViewportIds(renderingEngine.getViewports().map((v: { id: string }) => v.id));
        }
      } catch {
        // Ignore
      }

      if (measurement) {
        const existingMeasurement = MeasurementService.getMeasurement(annotationUID);
        if (existingMeasurement) {
          this._measurementsFromCast.add(annotationUID);
          let source = existingMeasurement.source;
          if (!source || (source.name !== 'Cornerstone3DTools' && source.name !== 'CornerstoneTools')) {
            source =
              MeasurementService.getSource('Cornerstone3DTools', '0.1') ||
              MeasurementService.getSource('CornerstoneTools', '4.0');
          }
          MeasurementService.update(
            annotationUID,
            { ...measurement, source, modifiedTimestamp: (measurement.modifiedTimestamp as number) || Math.floor(Date.now() / 1000) },
            false
          );
        }
      }
    } catch (err) {
      console.warn(LOG_PREFIX + ': Failed to update annotation:', err);
    }
  }

  private async _createAnnotation(
    annotationResource: Record<string, unknown>,
    measurement: Record<string, unknown> | undefined
  ): Promise<void> {
    const { MeasurementService, displaySetService } = this._servicesManager.services;
    const annotationUID = annotationResource.uid as string;

    let source =
      MeasurementService.getSource('Cornerstone3DTools', '0.1') ||
      MeasurementService.getSource('CornerstoneTools', '4.0');
    if (!source) {
      console.warn(LOG_PREFIX + ': No Cornerstone source available, cannot create annotation');
      return;
    }

    const annotationObj = {
      annotationUID,
      highlighted: false,
      isLocked: (annotationResource.metadata as Record<string, boolean>)?.isLocked || false,
      invalidated: false,
      metadata: { ...(annotationResource.metadata as Record<string, unknown>) },
      data: { ...(annotationResource.data as Record<string, unknown>) },
    };

    if (measurement?.toolName) {
      try {
        const toolName = measurement.toolName as string;
        const dataSource = {
          getImageIdsForInstance: ({ instance }: { instance?: unknown }) => {
            if ((measurement as Record<string, string>).referencedImageId) {
              return (measurement as Record<string, string>).referencedImageId;
            }
            if (displaySetService && instance) {
              const displaySets = displaySetService.getDisplaySetsForSeries(
                (measurement as Record<string, string>).referenceStudyUID,
                (measurement as Record<string, string>).referenceSeriesUID
              );
              if (displaySets?.length) {
                const ds =
                  displaySets.find(
                    (d: { displaySetInstanceUID: string }) =>
                      d.displaySetInstanceUID === (measurement as Record<string, string>).displaySetInstanceUID
                  ) ?? displaySets[0];
                const imageIds = displaySetService.getImageIdsForDisplaySet(ds.displaySetInstanceUID);
                const frameNumber = ((measurement as Record<string, number>).frameNumber ?? 1) - 1;
                return imageIds[frameNumber] ?? imageIds[0];
              }
            }
            return null;
          },
        };
        const mappings = MeasurementService.getSourceMappings(source.name, source.version);
        const matchingMapping = mappings?.find((m: { annotationType: string }) => m.annotationType === toolName);
        if (!matchingMapping) throw new Error('No mapping found');

        this._measurementsFromCast.add(annotationUID);
        MeasurementService.addRawMeasurement(
          source,
          toolName,
          { id: annotationUID, annotation: annotationObj },
          matchingMapping.toMeasurementSchema,
          dataSource
        );
      } catch (err) {
        console.warn(LOG_PREFIX + ': Failed to use addRawMeasurement, falling back to direct creation:', err);
        this._createAnnotationDirectly(annotationObj);
      }
    } else {
      this._createAnnotationDirectly(annotationObj);
    }
  }

  private async _createAnnotationDirectly(annotationObj: Record<string, unknown>): Promise<void> {
    try {
      const { annotation } = await import('@cornerstonejs/tools');
      annotation.state.getAnnotationManager().addAnnotation(annotationObj);
    } catch (err) {
      console.warn(LOG_PREFIX + ': Failed to create annotation directly:', err);
    }
  }

  private _handleMeasurementUpdate(event: Record<string, unknown>): void {
    const context = event.context as Array<{ key: string; resource: Record<string, unknown> }> | undefined;
    if (!context) return;

    let measurementResource: Record<string, unknown> | null = null;
    for (const cr of context) {
      if (cr.key?.toLowerCase() === 'measurement') {
        measurementResource = cr.resource;
        break;
      }
    }

    if (!measurementResource?.uid) return;

    const { MeasurementService, displaySetService } = this._servicesManager.services;
    const existingMeasurement = MeasurementService.getMeasurement(measurementResource.uid as string);

    try {
      if (existingMeasurement) {
        this._measurementsFromCast.add(measurementResource.uid as string);
        let source = existingMeasurement.source;
        if (!source || (source.name !== 'Cornerstone3DTools' && source.name !== 'CornerstoneTools')) {
          source =
            MeasurementService.getSource('Cornerstone3DTools', '0.1') ||
            MeasurementService.getSource('CornerstoneTools', '4.0');
        }
        MeasurementService.update(
          measurementResource.uid as string,
          {
            ...measurementResource,
            source,
            modifiedTimestamp: (measurementResource.modifiedTimestamp as number) || Math.floor(Date.now() / 1000),
          },
          false
        );
      } else {
        this._createMeasurementFromCast(measurementResource, MeasurementService, displaySetService);
      }
    } catch (err) {
      console.warn(LOG_PREFIX + ': Failed to process measurement from hub:', err);
    }
  }

  private _createMeasurementFromCast(
    measurementResource: Record<string, unknown>,
    MeasurementService: { getSource: (a: string, b: string) => unknown; createSource: (a: string, b: string) => unknown; getSourceMappings: (a: string, b: string) => unknown[]; addRawMeasurement: (...args: unknown[]) => void; measurements?: Map<string, unknown>; EVENTS?: { MEASUREMENT_ADDED: string }; _broadcastEvent?: (a: string, b: unknown) => void },
    displaySetService: { getDisplaySetsForSeries: (a: string, b: string) => unknown[]; getImageIdsForDisplaySet: (a: string) => string[] }
  ): void {
    this._measurementsFromCast.add(measurementResource.uid as string);
    let source =
      MeasurementService.getSource('Cornerstone3DTools', '0.1') ||
      MeasurementService.getSource('CornerstoneTools', '4.0');
    if (!source) {
      source = MeasurementService.createSource('Cast', '1.0.0');
    }

    const annotationData = measurementResource.annotation as Record<string, unknown> | undefined;
    if (annotationData?.data && source) {
      try {
        const toolName = measurementResource.toolName as string;
        if (!toolName) throw new Error('toolName required');

        const dataSource = {
          getImageIdsForInstance: () => {
            if (measurementResource.referencedImageId) return measurementResource.referencedImageId;
            if (displaySetService) {
              const displaySets = displaySetService.getDisplaySetsForSeries(
                measurementResource.referenceStudyUID as string,
                measurementResource.referenceSeriesUID as string
              ) as Array<{ displaySetInstanceUID: string }>;
              if (displaySets?.length) {
                const ds =
                  displaySets.find((d) => d.displaySetInstanceUID === measurementResource.displaySetInstanceUID) ??
                  displaySets[0];
                const imageIds = displaySetService.getImageIdsForDisplaySet(ds.displaySetInstanceUID);
                const fn = ((measurementResource.frameNumber as number) ?? 1) - 1;
                return imageIds[fn] ?? imageIds[0];
              }
            }
            return null;
          },
        };
        const mappings = MeasurementService.getSourceMappings((source as { name: string }).name, (source as { version: string }).version);
        const matchingMapping = mappings?.find((m: { annotationType: string }) => m.annotationType === toolName);
        if (!matchingMapping) throw new Error('No mapping found');

        const annotationObj = {
          annotationUID: measurementResource.uid,
          highlighted: false,
          isLocked: measurementResource.isLocked ?? false,
          invalidated: false,
          metadata: {
            toolName,
            FrameOfReferenceUID: measurementResource.FrameOfReferenceUID,
            referencedImageId: measurementResource.referencedImageId,
            ...(annotationData.metadata as Record<string, unknown>),
          },
          data: {
            ...(annotationData.data as Record<string, unknown>),
            label: (annotationData.data as Record<string, string>)?.label ?? measurementResource.label,
            text: (annotationData.data as Record<string, string>)?.text ?? measurementResource.label,
            frameNumber: (annotationData.data as Record<string, number>)?.frameNumber ?? measurementResource.frameNumber ?? 1,
          },
        };

        MeasurementService.addRawMeasurement(
          source,
          toolName,
          { id: measurementResource.uid, annotation: annotationObj },
          matchingMapping.toMeasurementSchema,
          dataSource
        );
      } catch (err) {
        console.warn(LOG_PREFIX + ': Failed to use addRawMeasurement, falling back to direct creation:', err);
        this._createMeasurementDirectly(measurementResource, source, MeasurementService);
      }
    } else {
      this._createMeasurementDirectly(measurementResource, source, MeasurementService);
    }
  }

  private _createMeasurementDirectly(
    measurementResource: Record<string, unknown>,
    source: unknown,
    MeasurementService: { getSource: (a: string, b: string) => unknown }
  ): void {
    const newMeasurement = {
      ...measurementResource,
      source,
      modifiedTimestamp: (measurementResource.modifiedTimestamp as number) || Math.floor(Date.now() / 1000),
      uid: measurementResource.uid,
    };
    const ms = MeasurementService as Record<string, unknown>;
    const measurements = ms.measurements as Map<string, unknown> | undefined;
    const broadcastEvent = ms._broadcastEvent as ((ev: string, payload: unknown) => void) | undefined;
    const events = ms.EVENTS as { MEASUREMENT_ADDED: string } | undefined;
    if (measurements) measurements.set(newMeasurement.uid as string, newMeasurement);
    if (broadcastEvent && events) broadcastEvent(events.MEASUREMENT_ADDED, { source, measurement: newMeasurement });
  }
}
