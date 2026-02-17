import { PubSubService, ServicesManager, CommandsManager, ExtensionManager, DicomMetadataStore } from '@ohif/core';
import createMeasurementUpdate from './utils/createMeasurementUpdate';
import createAnnotationUpdate from './utils/createAnnotationUpdate';
import createAnnotationDelete from './utils/createAnnotationDelete';
import { applySceneViewToViewports } from './utils/applySceneViewToViewports';
import { CastClient } from './network/CastClient';
import { CastMessageHandler } from './handlers/CastMessageHandler';
import { CastOriginTracker } from './CastOriginTracker';
import { CastLogger } from './logger';
import { validateCastConfig } from './config/validateCastConfig';
import { LOG_PREFIX, ANNOTATION_DEBOUNCE_MS } from './constants';
import type { HubConfig } from './network/types';

export default class CastService extends PubSubService {
  private _extensionManager: ExtensionManager;
  private _servicesManager: ServicesManager;
  private _commandsManager: CommandsManager;
  private _client: CastClient;
  private _handler: CastMessageHandler;
  private _castOrigin: CastOriginTracker;
  private _logger: CastLogger;
  private _measurementUnsubscribe: { unsubscribe: () => void } | undefined;

  private _lastMeasurementStates: Map<string, unknown> = new Map();
  private _lastMeasurementUpdateTimes: Map<string, number> = new Map();
  private _lastAnnotationStates: Map<string, unknown> = new Map();
  private _lastAnnotationUpdateTimes: Map<string, number> = new Map();

  public static REGISTRATION = {
    name: 'castService',
    altName: 'CastService',
    create: ({ configuration = {}, extensionManager, commandsManager, servicesManager }) => {
      return new CastService(extensionManager, commandsManager, servicesManager);
    },
  };

  private _conferenceApproved = false;
  private _conferenceDeclined = false;

  /** Whether the user approved joining a conference (e.g. cast session). */
  public get conferenceApproved(): boolean {
    return this._conferenceApproved;
  }
  public set conferenceApproved(value: boolean) {
    this._conferenceApproved = value;
  }

  /** Whether the user declined joining a conference. */
  public get conferenceDeclined(): boolean {
    return this._conferenceDeclined;
  }
  public set conferenceDeclined(value: boolean) {
    this._conferenceDeclined = value;
  }

  public castConfig: ReturnType<ExtensionManager['appConfig']['cast']> | ReturnType<ExtensionManager['appConfig']['fhircast']>;

  constructor(
    extensionManager: ExtensionManager,
    commandsManager: CommandsManager,
    servicesManager: ServicesManager
  ) {
    super({});
    this._extensionManager = extensionManager;
    this._commandsManager = commandsManager;
    this._servicesManager = servicesManager;

    this.castConfig = extensionManager.appConfig.cast || extensionManager.appConfig.fhircast;
    const debug = !!(this.castConfig as { debug?: boolean } | undefined)?.debug;
    this._logger = new CastLogger({ prefix: LOG_PREFIX, debug });
    this._castOrigin = new CastOriginTracker();

    const validation = validateCastConfig(this.castConfig as { defaultHub?: string; hubs?: HubConfig[] });
    if (!validation.valid) {
      this._logger.warn('Cast config validation failed:', validation.error);
    }

    const callbackUrl = typeof window !== 'undefined' ? `${window.location.origin}/castCallback` : undefined;

    this._client = new CastClient({
      ...this.castConfig,
      productName: this.castConfig?.productName ?? 'OHIF',
      callbackUrl,
    });

    this._handler = new CastMessageHandler({
      commandsManager,
      servicesManager,
      transport: this._client,
      annotationsFromCast: this._castOrigin.getAnnotationsSet(),
      measurementsFromCast: this._castOrigin.getMeasurementsSet(),
      logger: this._logger,
    });

    this._client.onMessage((msg) => {
      void this._handler.handle(msg).catch((err) => {
        this._logger.warn('Handler error:', err);
      });
    });

    this._logger.info('Config loaded:', {
      hasCastConfig: !!this.castConfig,
      defaultHub: this.castConfig?.defaultHub,
      autoStart: this.castConfig?.autoStart,
    });

    if (this.castConfig?.defaultHub) {
      const result = this.setHub(this.castConfig.defaultHub);
      this._logger.info('Hub set result:', result, 'Hub:', this.hub.name);
      if (this.castConfig.autoStart) {
        this.getToken();
      }
    }

    const { MeasurementService } = servicesManager.services;
    MeasurementService.setPublishOptions(servicesManager, {
      measurementsFromCast: this._castOrigin.getMeasurementsSet(),
      lastMeasurementStates: this._lastMeasurementStates,
      lastMeasurementUpdateTimes: this._lastMeasurementUpdateTimes,
      createMeasurementUpdate,
    });

    const { MEASUREMENT_REMOVED } = MeasurementService.EVENTS;
    this._measurementUnsubscribe = MeasurementService.subscribe(MEASUREMENT_REMOVED, ({ measurement }) => {
      if (measurement?.uid) {
        this._lastMeasurementStates.delete(measurement.uid);
        this._lastMeasurementUpdateTimes.delete(measurement.uid);
        this._castOrigin.removeMeasurement(measurement.uid);
      }
    });

    this._subscribeToAnnotationEvents();
  }

  /**
   * Clean up subscriptions and client. Call when tearing down the viewer or extension.
   */
  public destroy(): void {
    this._measurementUnsubscribe?.unsubscribe();
    this._castOrigin.clear();
    this._client.destroy();
  }

  get hub(): HubConfig {
    return this._client.getHub();
  }

  public setHub(hubName: string): boolean {
    return this._client.setHub(hubName);
  }

  public getHub(): HubConfig {
    return this._client.getHub();
  }

  public setTopic(topic: string): void {
    this._client.setTopic(topic);
  }

  public async getToken(): Promise<boolean> {
    return this._client.getToken();
  }

  public async castSubscribe(): Promise<number | string> {
    return this._client.subscribe();
  }

  public async castUnsubscribe(): Promise<void> {
    return this._client.unsubscribe();
  }

  public async castPublish(castMessage: Record<string, unknown>, hub: HubConfig): Promise<Response | null> {
    return this._client.publish(castMessage, hub);
  }

  public applySceneView(sceneViewData: Parameters<typeof applySceneViewToViewports>[1]): void {
    this._handler.applySceneView(sceneViewData);
  }

  private async _subscribeToAnnotationEvents(): Promise<void> {
    try {
      const { Enums } = await import('@cornerstonejs/tools');
      const { eventTarget } = await import('@cornerstonejs/core');
      const csToolsEvents = Enums.Events;

      eventTarget.addEventListener(csToolsEvents.ANNOTATION_ADDED, (evt) =>
        this._handleAnnotationEvent('added', (evt as CustomEvent).detail)
      );
      eventTarget.addEventListener(csToolsEvents.ANNOTATION_COMPLETED, (evt) =>
        this._handleAnnotationEvent('added', (evt as CustomEvent).detail)
      );
      eventTarget.addEventListener(csToolsEvents.ANNOTATION_MODIFIED, (evt) =>
        this._handleAnnotationEvent('updated', (evt as CustomEvent).detail)
      );
      eventTarget.addEventListener(csToolsEvents.ANNOTATION_REMOVED, (evt) =>
        this._handleAnnotationEvent('removed', (evt as CustomEvent).detail)
      );
    } catch (error) {
      this._logger.debug('Cornerstone Tools not available for annotation events:', error);
    }
  }

  private _handleAnnotationEvent(
    action: string,
    eventDetail: {
      annotation?: {
        annotationUID?: string;
        uid?: string;
        metadata?: { toolName?: string };
        data?: unknown;
        metadata?: unknown;
      };
    }
  ): void {
    const annotation = eventDetail?.annotation;
    if (!annotation?.annotationUID) return;
    if (annotation.metadata?.toolName !== 'ArrowAnnotate') return;

    const annotationUID = annotation.annotationUID ?? annotation.uid;

    if (action === 'removed') {
      this._publishAnnotationUpdate(annotation, null, action);
      this._lastAnnotationStates.delete(annotationUID);
      this._lastAnnotationUpdateTimes.delete(annotationUID);
      this._castOrigin.removeAnnotation(annotationUID);
      return;
    }

    const lastUpdateTime = this._lastAnnotationUpdateTimes.get(annotationUID) ?? 0;
    const now = Date.now();
    if (now - lastUpdateTime < ANNOTATION_DEBOUNCE_MS && action === 'updated') return;

    let measurement: Record<string, unknown> | null = null;
    try {
      const { MeasurementService } = this._servicesManager.services;
      measurement = (MeasurementService?.getMeasurement(annotationUID) ?? null) as Record<string, unknown> | null;
    } catch {
      // ignore
    }

    this._publishAnnotationUpdate(annotation, measurement, action);
    this._lastAnnotationStates.set(annotationUID, this._getAnnotationState(annotation));
    this._lastAnnotationUpdateTimes.set(annotationUID, now);
  }

  private _publishAnnotationUpdate(
    annotation: { annotationUID?: string; uid?: string; data?: unknown; metadata?: unknown },
    measurement: Record<string, unknown> | null,
    action: string
  ): void {
    const hub = this._client.getHub();
    if (!hub?.subscribed || !hub?.name) return;

    if (action === 'removed') {
      const castMessage = createAnnotationDelete(annotation);
      if (!castMessage) return;
      this._client.publish(castMessage, hub).catch((err) => {
        this._logger.warn('Failed to publish annotation-delete event:', err);
      });
      return;
    }

    const studyMeta =
      measurement && typeof measurement === 'object' && 'referenceStudyUID' in measurement
        ? DicomMetadataStore.getStudy((measurement as { referenceStudyUID: string }).referenceStudyUID)
        : null;

    const castMessage = createAnnotationUpdate(annotation, measurement, studyMeta);
    this._client.publish(castMessage, hub).catch((err) => {
      this._logger.warn('Failed to publish annotation-update event:', err);
    });
  }

  private _getAnnotationState(annotation: {
    annotationUID?: string;
    uid?: string;
    data?: unknown;
    metadata?: unknown;
  }): unknown {
    return {
      uid: annotation.annotationUID ?? annotation.uid,
      data: annotation.data ? JSON.stringify(annotation.data) : null,
      metadata: annotation.metadata ? JSON.stringify(annotation.metadata) : null,
    };
  }
}
