import type { CommandsManager, ServicesManager } from '@ohif/core';
import type { CastTransport } from '../network/CastClient';
import type {
  CastMessage,
  AnnotationResource,
  MeasurementResource,
  ConferenceResource,
  PatientContextResource,
  StudyContextResource,
} from '../network/types';
import type { CastLogger } from '../logger';
import { annotation as csAnnotation } from '@cornerstonejs/tools';
import { triggerAnnotationRenderForViewportIds } from '@cornerstonejs/tools/utilities';
import { applySceneViewToViewports } from '../utils/applySceneViewToViewports';
import { getContextResource } from '../utils/getContextResource';

export interface CastMessageHandlerDeps {
  commandsManager: CommandsManager;
  servicesManager: ServicesManager;
  transport: CastTransport;
  annotationsFromCast: Set<string>;
  measurementsFromCast: Set<string>;
  logger?: CastLogger;
}

export interface HandlerContext {
  currentLocation: string;
}

type HandlerFn = (
  castMessage: CastMessage & Record<string, unknown>,
  event: Record<string, unknown>,
  ctx: HandlerContext
) => void | Promise<void>;

export class CastMessageHandler {
  private _commandsManager: CommandsManager;
  private _servicesManager: ServicesManager;
  private _transport: CastTransport;
  private _annotationsFromCast: Set<string>;
  private _measurementsFromCast: Set<string>;
  private _logger: CastLogger | undefined;
  private _eventHandlers: Map<string, HandlerFn>;

  constructor(deps: CastMessageHandlerDeps) {
    this._commandsManager = deps.commandsManager;
    this._servicesManager = deps.servicesManager;
    this._transport = deps.transport;
    this._annotationsFromCast = deps.annotationsFromCast;
    this._measurementsFromCast = deps.measurementsFromCast;
    this._logger = deps.logger;
    this._eventHandlers = new Map([
      ['get-request', (msg, _ev, _ctx) => this._handleGetRequest(msg)],
      ['patient-open', (_msg, ev) => this._handlePatientOpen(ev)],
      ['patient-close', () => this._handleNavigateAway('/')],
      ['imagingstudy-open', (_msg, ev, ctx) => this._handleImagingStudyOpen(ev, ctx.currentLocation)],
      ['imagingstudy-close', () => this._handleNavigateAway('/')],
      ['diagnosticreport-close', () => this._handleNavigateAway('/')],
      ['annotation-delete', (_msg, ev) => this._handleAnnotationDelete(ev)],
      ['annotation-update', (_msg, ev) => this._handleAnnotationUpdate(ev)],
      ['measurement-update', (_msg, ev) => this._handleMeasurementUpdate(ev)],
      ['conference-start', (_msg, ev) => this._handleConferenceStart(ev)],
    ]);
  }

  async handle(castMessage: CastMessage & Record<string, unknown>): Promise<void> {
    const event = castMessage.event;
    if (!event) return;

    const hubEvent = (event['hub.event'] as string)?.toLowerCase();
    if (!hubEvent) return;

    const currentLocation = typeof window !== 'undefined' ? window.location.search : '';
    const ctx: HandlerContext = { currentLocation };

    if (
      currentLocation &&
      (hubEvent === 'patient-close' || hubEvent === 'imagingstudy-close' || hubEvent === 'diagnosticreport-close')
    ) {
      this._commandsManager.runCommand('navigateHistory', { to: '/' });
      return;
    }

    const handler = this._eventHandlers.get(hubEvent);
    if (!handler) return;

    await Promise.resolve(handler(castMessage, event, ctx));
  }

  applySceneView(sceneViewData: Parameters<typeof applySceneViewToViewports>[1]): void {
    applySceneViewToViewports(this._servicesManager, sceneViewData);
  }

  private _handleNavigateAway(to: string): void {
    this._commandsManager.runCommand('navigateHistory', { to });
  }

  private _handleConferenceStart(event: Record<string, unknown>): void {
    const context = event.context as Array<{ key: string; resource: ConferenceResource }> | undefined;
    const conference = getContextResource<ConferenceResource>(context, 'conference');
    if (!conference) return;

    const title = conference.title ?? 'Conference started';
    const participants = Array.isArray(conference.participants) ? conference.participants : [];

    const castService = this._servicesManager.services?.castService as { setConferenceStarted: (title: string, participants: string[]) => void } | undefined;
    if (castService?.setConferenceStarted) {
      castService.setConferenceStarted(title, participants);
    }

    const uiNotificationService = this._servicesManager.services?.uiNotificationService as { show: (opts: { title?: string; message?: string; type?: string }) => unknown } | undefined;
    if (uiNotificationService?.show) {
      const message = participants.length > 0 ? `${title} (${participants.length} participants)` : title;
      uiNotificationService.show({ title: 'Conference', message, type: 'info' });
    }
  }

  private _handleGetRequest(castMessage: CastMessage & Record<string, unknown>): void {
    const context = castMessage.event?.context as { dataType?: string; requestId?: string } | undefined;
    if (!context || context.dataType !== 'SCENEVIEW') return;
    const requestId = context.requestId;
    if (!requestId) return;

    const hub = this._transport.getHub();
    if (!hub.websocket || (hub.websocket as WebSocket).readyState !== WebSocket.OPEN) return;

    const topic = (castMessage.event as Record<string, string>)?.['hub.topic'] ?? hub.topic;
    this._transport.sendGetResponse(
      requestId,
      { 'SCENEVIEW RESPONSE TBD': 'SCENEVIEW RESPONSE TBD' },
      topic
    );
  }

  private _handlePatientOpen(event: Record<string, unknown>, _currentLocation?: string): void {
    const context = event.context as Array<{ key: string; resource: PatientContextResource }> | undefined;
    const patientResource = getContextResource<PatientContextResource>(context, 'patient');
    const mrn = patientResource?.identifier?.[0]?.value ?? null;
    if (mrn) {
      this._commandsManager.runCommand('navigateHistory', { to: '/?mrn=' + mrn });
    }
  }

  private _handleImagingStudyOpen(event: Record<string, unknown>, currentLocation: string): void {
    const context = event.context as Array<{ key: string; resource: StudyContextResource }> | undefined;
    const studyResource = getContextResource<StudyContextResource>(context, 'study');
    const studyUID = studyResource?.uid?.replaceAll('urn:oid:', '') ?? null;
    if (studyUID && !currentLocation.includes(studyUID)) {
      this._commandsManager.runCommand('navigateHistory', {
        to: '/viewer?StudyInstanceUIDs=' + studyUID + '&Cast',
      });
    }
  }

  private _handleAnnotationDelete(event: Record<string, unknown>): void {
    const context = event.context as Array<{ key: string; resource: AnnotationResource }> | undefined;
    const annotationResource = getContextResource<AnnotationResource>(context, 'annotation');
    if (!annotationResource?.uid) return;
    void this._handleAnnotationRemoved(annotationResource);
  }

  private _handleAnnotationUpdate(event: Record<string, unknown>): void {
    const context = event.context as Array<{ key: string; resource: AnnotationResource }> | undefined;
    const annotationResource = getContextResource<AnnotationResource>(context, 'annotation');
    if (!annotationResource?.uid) return;
    this._annotationsFromCast.add(annotationResource.uid);

    const measurement = annotationResource.measurement as MeasurementResource | undefined;
    if (measurement) {
      this._resolveLocalDisplaySetUIDOnResource(measurement);
    }

    void this._handleAnnotationAddedOrUpdated(annotationResource);
  }

  private _handleAnnotationRemoved(annotationResource: AnnotationResource): void {
    const { MeasurementService } = this._servicesManager.services;
    const annotationUID = annotationResource.uid;

    const measurement = MeasurementService?.getMeasurement(annotationUID);
    if (measurement) {
      MeasurementService.remove(annotationUID, measurement.source);
    }

    csAnnotation.state.removeAnnotation(annotationUID);
    this._annotationsFromCast.delete(annotationUID);
  }

  private _handleAnnotationAddedOrUpdated(annotationResource: AnnotationResource): void {
    const annotationUID = annotationResource.uid;
    const { MeasurementService } = this._servicesManager.services;
    const measurement = annotationResource.measurement as MeasurementResource | undefined;

    const existingAnnotation = csAnnotation.state.getAnnotation(annotationUID) as Record<string, unknown> | undefined;
    const existingMeasurement = MeasurementService?.getMeasurement(annotationUID);

    this._logger?.debug('annotation-update received', {
      uid: annotationUID,
      hasExistingAnnotation: !!existingAnnotation,
      hasExistingMeasurement: !!existingMeasurement,
    });

    if (existingAnnotation) {
      this._updateAnnotation(existingAnnotation, annotationResource, measurement);
    } else if (existingMeasurement) {
      this._updateMeasurementOnly(annotationResource, measurement);
    } else {
      this._createAnnotation(annotationResource, measurement);
    }
  }

  private _updateAnnotation(
    existingAnnotation: Record<string, unknown>,
    annotationResource: AnnotationResource,
    measurement: MeasurementResource | undefined
  ): void {
    const { MeasurementService } = this._servicesManager.services;
    const annotationUID = annotationResource.uid;

    try {
      if (annotationResource.data) {
        Object.assign((existingAnnotation.data as Record<string, unknown>) ?? {}, annotationResource.data);
      }
      if (annotationResource.metadata) {
        Object.assign((existingAnnotation.metadata as Record<string, unknown>) ?? {}, annotationResource.metadata);
      }
      if (annotationResource.metadata?.isLocked !== undefined) {
        csAnnotation.locking.setAnnotationLocked(annotationUID, annotationResource.metadata.isLocked as boolean);
      }
      if (annotationResource.metadata?.isVisible !== undefined) {
        csAnnotation.visibility.setAnnotationVisibility(annotationUID, annotationResource.metadata.isVisible as boolean);
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
            {
              ...measurement,
              source,
              modifiedTimestamp: measurement.modifiedTimestamp ?? Math.floor(Date.now() / 1000),
            },
            false
          );
        }
      }
    } catch (err) {
      this._logger?.warn('Failed to update annotation:', err);
    }
  }

  private _updateMeasurementOnly(
    annotationResource: AnnotationResource,
    measurement: MeasurementResource | undefined
  ): void {
    if (!measurement) return;
    const { MeasurementService } = this._servicesManager.services;
    const annotationUID = annotationResource.uid;
    const existingMeasurement = MeasurementService?.getMeasurement(annotationUID);
    if (!existingMeasurement) return;
    this._measurementsFromCast.add(annotationUID);
    let source = existingMeasurement.source;
    if (!source || (source.name !== 'Cornerstone3DTools' && source.name !== 'CornerstoneTools')) {
      source =
        MeasurementService.getSource('Cornerstone3DTools', '0.1') ||
        MeasurementService.getSource('CornerstoneTools', '4.0');
    }
    MeasurementService.update(
      annotationUID,
      {
        ...measurement,
        source,
        modifiedTimestamp: measurement.modifiedTimestamp ?? Math.floor(Date.now() / 1000),
      },
      false
    );
  }

  /**
   * Resolve the local displaySetInstanceUID for a series. The sender's
   * displaySetInstanceUID is session-specific and won't match the receiver's.
   */
  private _resolveLocalDisplaySetUID(
    referenceSeriesUID: string | undefined
  ): string | null {
    if (!referenceSeriesUID) return null;
    try {
      const { displaySetService } = this._servicesManager.services;
      const displaySets = displaySetService.getDisplaySetsForSeries(referenceSeriesUID);
      return displaySets?.[0]?.displaySetInstanceUID ?? null;
    } catch {
      return null;
    }
  }

  /**
   * Patch a resource's displaySetInstanceUID in-place so it references
   * the receiver's local display set instead of the sender's.
   */
  private _resolveLocalDisplaySetUIDOnResource(
    resource: { referenceSeriesUID?: string; displaySetInstanceUID?: string }
  ): void {
    const localUID = this._resolveLocalDisplaySetUID(resource.referenceSeriesUID);
    if (localUID) {
      resource.displaySetInstanceUID = localUID;
    }
  }

  private _createAnnotation(
    annotationResource: AnnotationResource,
    measurement: MeasurementResource | undefined
  ): void {
    const { MeasurementService, displaySetService } = this._servicesManager.services;
    const annotationUID = annotationResource.uid;

    let source =
      MeasurementService.getSource('Cornerstone3DTools', '0.1') ||
      MeasurementService.getSource('CornerstoneTools', '4.0');
    if (!source) {
      this._logger?.warn('No Cornerstone source available, cannot create annotation');
      return;
    }

    const annotationObj = {
      annotationUID,
      highlighted: false,
      isLocked: (annotationResource.metadata as Record<string, boolean>)?.isLocked ?? false,
      invalidated: false,
      metadata: { ...(annotationResource.metadata as Record<string, unknown>) },
      data: { ...(annotationResource.data as Record<string, unknown>) },
    };

    if (measurement?.toolName) {
      try {
        const toolName = measurement.toolName as string;
        const dataSource = {
          getImageIdsForInstance: ({ instance }: { instance?: unknown }) => {
            if (measurement.referencedImageId) return measurement.referencedImageId;
            if (displaySetService && instance) {
              const displaySets = displaySetService.getDisplaySetsForSeries(
                measurement.referenceSeriesUID ?? ''
              );
              if (displaySets?.length) {
                const ds = displaySets[0];
                const imageIds = displaySetService.getImageIdsForDisplaySet(ds.displaySetInstanceUID);
                const frameNumber = (measurement.frameNumber ?? 1) - 1;
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
          { id: annotationUID, uid: annotationUID, annotation: annotationObj },
          matchingMapping.toMeasurementSchema,
          dataSource
        );

        // addRawMeasurement creates a measurement but may not add the annotation
        // to cornerstone's annotation state. Ensure it exists so subsequent
        // updates can find it via csAnnotation.state.getAnnotation().
        if (!csAnnotation.state.getAnnotation(annotationUID)) {
          csAnnotation.state.getAnnotationManager().addAnnotation(annotationObj);
        }
      } catch (err) {
        this._logger?.warn('Failed to use addRawMeasurement, falling back to direct creation:', err);
        this._createAnnotationDirectly(annotationObj);
      }
    } else {
      this._createAnnotationDirectly(annotationObj);
    }
  }

  private _createAnnotationDirectly(annotationObj: Record<string, unknown>): void {
    try {
      csAnnotation.state.getAnnotationManager().addAnnotation(annotationObj);
    } catch (err) {
      this._logger?.warn('Failed to create annotation directly:', err);
    }
  }

  private _handleMeasurementUpdate(event: Record<string, unknown>): void {
    const context = event.context as Array<{ key: string; resource: MeasurementResource }> | undefined;
    const measurementResource = getContextResource<MeasurementResource>(context, 'measurement');
    if (!measurementResource?.uid) return;

    this._resolveLocalDisplaySetUIDOnResource(measurementResource);

    const { MeasurementService, displaySetService } = this._servicesManager.services;
    const existingMeasurement = MeasurementService.getMeasurement(measurementResource.uid);

    try {
      if (existingMeasurement) {
        this._measurementsFromCast.add(measurementResource.uid);
        let source = existingMeasurement.source;
        if (!source || (source.name !== 'Cornerstone3DTools' && source.name !== 'CornerstoneTools')) {
          source =
            MeasurementService.getSource('Cornerstone3DTools', '0.1') ||
            MeasurementService.getSource('CornerstoneTools', '4.0');
        }
        MeasurementService.update(
          measurementResource.uid,
          {
            ...measurementResource,
            source,
            modifiedTimestamp:
              measurementResource.modifiedTimestamp ?? Math.floor(Date.now() / 1000),
          },
          false
        );
      } else {
        this._createMeasurementFromCast(measurementResource, MeasurementService, displaySetService);
      }
    } catch (err) {
      this._logger?.warn('Failed to process measurement from hub:', err);
    }
  }

  private _createMeasurementFromCast(
    measurementResource: MeasurementResource,
    MeasurementService: {
      getSource: (a: string, b: string) => unknown;
      createSource: (a: string, b: string) => unknown;
      getSourceMappings: (a: string, b: string) => unknown[];
      addRawMeasurement: (...args: unknown[]) => void;
      measurements?: Map<string, unknown>;
      EVENTS?: { MEASUREMENT_ADDED: string };
      _broadcastEvent?: (a: string, b: unknown) => void;
    },
    displaySetService: {
      getDisplaySetsForSeries: (seriesInstanceUID: string) => unknown[];
      getImageIdsForDisplaySet: (a: string) => string[];
    }
  ): void {
    this._measurementsFromCast.add(measurementResource.uid);
    let source =
      MeasurementService.getSource('Cornerstone3DTools', '0.1') ||
      MeasurementService.getSource('CornerstoneTools', '4.0');
    if (!source) {
      source = MeasurementService.createSource('Cast', '1.0.0');
    }

    const annotationData = measurementResource.annotation;
    if (annotationData?.data && source) {
      try {
        const toolName = measurementResource.toolName as string;
        if (!toolName) throw new Error('toolName required');

        const dataSource = {
          getImageIdsForInstance: () => {
            if (measurementResource.referencedImageId) return measurementResource.referencedImageId;
            if (displaySetService) {
              const displaySets = displaySetService.getDisplaySetsForSeries(
                measurementResource.referenceSeriesUID ?? ''
              ) as Array<{ displaySetInstanceUID: string }>;
              if (displaySets?.length) {
                const ds = displaySets[0];
                const imageIds = displaySetService.getImageIdsForDisplaySet(ds.displaySetInstanceUID);
                const fn = (measurementResource.frameNumber ?? 1) - 1;
                return imageIds[fn] ?? imageIds[0];
              }
            }
            return null;
          },
        };
        const mappings = MeasurementService.getSourceMappings(
          (source as { name: string }).name,
          (source as { version: string }).version
        );
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
            frameNumber:
              (annotationData.data as Record<string, number>)?.frameNumber ??
              measurementResource.frameNumber ??
              1,
          },
        };

        MeasurementService.addRawMeasurement(
          source,
          toolName,
          { id: measurementResource.uid, uid: measurementResource.uid, annotation: annotationObj },
          matchingMapping.toMeasurementSchema,
          dataSource
        );
      } catch (err) {
        this._logger?.warn('Failed to use addRawMeasurement, falling back to direct creation:', err);
        this._createMeasurementDirectly(measurementResource, source, MeasurementService);
      }
    } else {
      this._createMeasurementDirectly(measurementResource, source, MeasurementService);
    }
  }

  private _createMeasurementDirectly(
    measurementResource: MeasurementResource,
    source: unknown,
    MeasurementService: { getSource: (a: string, b: string) => unknown }
  ): void {
    const newMeasurement = {
      ...measurementResource,
      source,
      modifiedTimestamp:
        measurementResource.modifiedTimestamp ?? Math.floor(Date.now() / 1000),
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
