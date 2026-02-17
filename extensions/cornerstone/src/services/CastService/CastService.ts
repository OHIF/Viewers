import { PubSubService, ServicesManager, CommandsManager, ExtensionManager, DicomMetadataStore } from '@ohif/core';
import createMeasurementUpdate from './utils/createMeasurementUpdate';
import createAnnotationUpdate from './utils/createAnnotationUpdate';
import { applySceneViewToViewports } from './utils/applySceneViewToViewports';
import { CastClient } from './network/CastClient';
import { CastMessageHandler } from './handlers/CastMessageHandler';
import type { HubConfig } from './network/types';

const LOG_PREFIX = 'CastService';

export default class CastService extends PubSubService {
  private _extensionManager: ExtensionManager;
  private _servicesManager: ServicesManager;
  private _commandsManager: CommandsManager;
  private _client: CastClient;
  private _handler: CastMessageHandler;

  private _lastMeasurementStates: Map<string, unknown> = new Map();
  private _lastMeasurementUpdateTimes: Map<string, number> = new Map();
  private _measurementsFromCast: Set<string> = new Set();
  private _annotationsFromCast: Set<string> = new Set();
  private _lastAnnotationStates: Map<string, unknown> = new Map();
  private _lastAnnotationUpdateTimes: Map<string, number> = new Map();

  public static REGISTRATION = {
    name: 'castService',
    altName: 'CastService',
    create: ({ configuration = {}, extensionManager, commandsManager, servicesManager }) => {
      return new CastService(extensionManager, commandsManager, servicesManager);
    },
  };

  public conferenceApproved = false;
  public conferenceDeclined = false;

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
      annotationsFromCast: this._annotationsFromCast,
      measurementsFromCast: this._measurementsFromCast,
    });

    this._client.onMessage((msg) => this._handler.handle(msg));

    console.log(LOG_PREFIX + ': Config loaded:', {
      hasCastConfig: !!this.castConfig,
      defaultHub: this.castConfig?.defaultHub,
      autoStart: this.castConfig?.autoStart,
    });

    if (this.castConfig?.defaultHub) {
      const result = this.setHub(this.castConfig.defaultHub);
      console.log(LOG_PREFIX + ': Hub set result:', result, 'Hub:', this.hub.name);
      if (this.castConfig.autoStart) {
        this.getToken();
      }
    }

    const { MeasurementService } = servicesManager.services;
    MeasurementService.setPublishOptions(servicesManager, {
      measurementsFromCast: this._measurementsFromCast,
      lastMeasurementStates: this._lastMeasurementStates,
      lastMeasurementUpdateTimes: this._lastMeasurementUpdateTimes,
      createMeasurementUpdate,
    });

    const { MEASUREMENT_REMOVED } = MeasurementService.EVENTS;
    MeasurementService.subscribe(MEASUREMENT_REMOVED, ({ measurement }) => {
      if (measurement?.uid) {
        this._lastMeasurementStates.delete(measurement.uid);
        this._lastMeasurementUpdateTimes.delete(measurement.uid);
        this._measurementsFromCast.delete(measurement.uid);
      }
    });

    this._subscribeToAnnotationEvents();
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
      console.debug(LOG_PREFIX + ': Cornerstone Tools not available for annotation events:', error);
    }
  }

  private _handleAnnotationEvent(action: string, eventDetail: { annotation?: { annotationUID?: string; metadata?: { toolName?: string }; data?: unknown; metadata?: unknown } }): void {
    const annotation = eventDetail?.annotation;
    if (!annotation?.annotationUID) return;
    if (annotation.metadata?.toolName !== 'ArrowAnnotate') return;

    const annotationUID = annotation.annotationUID;

    if (action === 'removed') {
      this._publishAnnotationUpdate(annotation, null, action);
      this._lastAnnotationStates.delete(annotationUID);
      this._lastAnnotationUpdateTimes.delete(annotationUID);
      return;
    }

    const lastUpdateTime = this._lastAnnotationUpdateTimes.get(annotationUID) ?? 0;
    const now = Date.now();
    if (now - lastUpdateTime < 1000 && action === 'updated') return;

    let measurement = null;
    try {
      const { MeasurementService } = this._servicesManager.services;
      measurement = MeasurementService?.getMeasurement(annotationUID) ?? null;
    } catch {
      // ignore
    }

    this._publishAnnotationUpdate(annotation, measurement, action);
    this._lastAnnotationStates.set(annotationUID, this._getAnnotationState(annotation));
    this._lastAnnotationUpdateTimes.set(annotationUID, now);
  }

  private _publishAnnotationUpdate(annotation: { annotationUID: string; data?: unknown; metadata?: unknown }, measurement: unknown, action: string): void {
    const hub = this._client.getHub();
    if (!hub?.subscribed || !hub?.name) return;

    const studyMeta = measurement && typeof measurement === 'object' && 'referenceStudyUID' in measurement
      ? DicomMetadataStore.getStudy((measurement as { referenceStudyUID: string }).referenceStudyUID)
      : null;

    const castMessage = createAnnotationUpdate(annotation, measurement, studyMeta);
    if (!castMessage) return;

    if (action === 'removed' && castMessage.event?.context?.[0]?.resource) {
      (castMessage.event.context[0].resource as Record<string, string>).action = 'removed';
    }

    this._client.publish(castMessage, hub).catch((err) => {
      console.warn(LOG_PREFIX + ': Failed to publish annotation-update event:', err);
    });
  }

  private _getAnnotationState(annotation: { annotationUID?: string; uid?: string; data?: unknown; metadata?: unknown }): unknown {
    return {
      uid: annotation.annotationUID ?? annotation.uid,
      data: annotation.data ? JSON.stringify(annotation.data) : null,
      metadata: annotation.metadata ? JSON.stringify(annotation.metadata) : null,
    };
  }
}
