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
import { LOG_PREFIX, ANNOTATION_THROTTLE_MS } from './constants';
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
  private _annotationState: { getAnnotation: (id: string) => unknown } | null = null;
  /** Tracks annotations for which we have already published the initial 'added' event. */
  private _publishedAnnotations: Set<string> = new Set();
  /** Trailing-edge timers for throttled annotation updates, keyed by annotationUID. */
  private _pendingAnnotationUpdates: Map<string, ReturnType<typeof setTimeout>> = new Map();

  public static REGISTRATION = {
    name: 'castService',
    altName: 'CastService',
    create: ({ configuration = {}, extensionManager, commandsManager, servicesManager }) => {
      return new CastService(extensionManager, commandsManager, servicesManager);
    },
  };

  private _conferenceApproved = false;
  private _conferenceDeclined = false;
  private _conferenceTitle = '';
  private _conferenceParticipants: string[] = [];

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

  /** Title from the last conference-start event. */
  public get conferenceTitle(): string {
    return this._conferenceTitle;
  }

  /** Participants from the last conference-start event (e.g. for populating a list). */
  public get conferenceParticipants(): string[] {
    return [...this._conferenceParticipants];
  }

  /** Called when a conference-start cast event is received; stores title and participants. */
  public setConferenceStarted(title: string, participants: string[]): void {
    this._conferenceTitle = title;
    this._conferenceParticipants = Array.isArray(participants) ? participants : [];
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
    this._publishedAnnotations.clear();
    for (const timer of this._pendingAnnotationUpdates.values()) clearTimeout(timer);
    this._pendingAnnotationUpdates.clear();
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
      const tools = await import('@cornerstonejs/tools');
      const { eventTarget } = await import('@cornerstonejs/core');
      const csToolsEvents = tools.Enums.Events;
      this._annotationState = tools.annotation?.state ?? null;

      // Do not listen to ANNOTATION_ADDED: it fires when the arrow is first placed, before the label is set.
      // Only publish after COMPLETED (user finished text) or MODIFIED (user edited).
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
    const eventAnnotation = eventDetail?.annotation;
    if (!eventAnnotation?.annotationUID) return;
    if (eventAnnotation.metadata?.toolName !== 'ArrowAnnotate') return;

    const annotationUID = eventAnnotation.annotationUID ?? eventAnnotation.uid;

    if (action === 'removed') {
      const pending = this._pendingAnnotationUpdates.get(annotationUID);
      if (pending) {
        clearTimeout(pending);
        this._pendingAnnotationUpdates.delete(annotationUID);
      }
      this._castOrigin.removeAnnotation(annotationUID);
      this._publishAnnotationUpdate(eventAnnotation, null, action);
      this._lastAnnotationStates.delete(annotationUID);
      this._lastAnnotationUpdateTimes.delete(annotationUID);
      this._publishedAnnotations.delete(annotationUID);
      return;
    }

    // When we apply an incoming Cast message the annotation state changes,
    // which fires ANNOTATION_MODIFIED. Consume the flag and skip to avoid echo.
    // Also mark the annotation as "published" so future user-initiated
    // modifications on this (received) annotation will be sent out.
    if (this._castOrigin.hasAnnotation(annotationUID)) {
      this._castOrigin.removeAnnotation(annotationUID);
      this._publishedAnnotations.add(annotationUID);
      return;
    }

    // For locally-created annotations, ANNOTATION_MODIFIED fires before
    // ANNOTATION_COMPLETED. Skip 'updated' for annotations we haven't
    // published 'added' for yet AND that aren't known from Cast.
    if (action === 'updated' && !this._publishedAnnotations.has(annotationUID)) {
      return;
    }

    const now = Date.now();

    const annotation = this._getCurrentAnnotation(annotationUID) ?? eventAnnotation;
    if (!this._hasLabel(annotation)) {
      if (action === 'added') {
        // Label may not be set yet (text callback can run after COMPLETED). Re-check once after a short delay.
        setTimeout(() => {
          const current = this._getCurrentAnnotation(annotationUID) ?? eventAnnotation;
          if (!this._hasLabel(current)) return;
          this._doPublishAnnotation(annotationUID, current, 'added');
          this._publishedAnnotations.add(annotationUID);
        }, 100);
      }
      return;
    }

    // Throttle 'updated' to max 5/s per annotation, with trailing edge so the last state is always sent.
    if (action === 'updated') {
      const lastUpdateTime = this._lastAnnotationUpdateTimes.get(annotationUID) ?? 0;
      const elapsed = now - lastUpdateTime;

      if (elapsed < ANNOTATION_THROTTLE_MS) {
        const existing = this._pendingAnnotationUpdates.get(annotationUID);
        if (existing) clearTimeout(existing);

        const remaining = ANNOTATION_THROTTLE_MS - elapsed;
        this._pendingAnnotationUpdates.set(
          annotationUID,
          setTimeout(() => {
            this._pendingAnnotationUpdates.delete(annotationUID);
            const current = this._getCurrentAnnotation(annotationUID) ?? eventAnnotation;
            if (!this._hasLabel(current)) return;
            this._doPublishAnnotation(annotationUID, current, 'updated');
          }, remaining)
        );
        return;
      }
    }

    this._doPublishAnnotation(annotationUID, annotation, action);
    if (action === 'added') {
      this._publishedAnnotations.add(annotationUID);
    }
  }

  /** Publish an annotation update and record the timestamp. */
  private _doPublishAnnotation(
    annotationUID: string,
    annotation: { annotationUID?: string; uid?: string; data?: unknown; metadata?: unknown },
    action: string
  ): void {
    let measurement: Record<string, unknown> | null = null;
    try {
      const { MeasurementService } = this._servicesManager.services;
      measurement = (MeasurementService?.getMeasurement(annotationUID) ?? null) as Record<string, unknown> | null;
    } catch {
      // ignore
    }
    this._publishAnnotationUpdate(annotation, measurement, action);
    this._lastAnnotationStates.set(annotationUID, this._getAnnotationState(annotation));
    this._lastAnnotationUpdateTimes.set(annotationUID, Date.now());
  }

  /** Get the current annotation from the tool state (may have newer data than the event detail). */
  private _getCurrentAnnotation(
    annotationUID: string
  ): { annotationUID?: string; uid?: string; data?: unknown; metadata?: unknown } | null {
    const current = this._annotationState?.getAnnotation(annotationUID);
    return (current as { annotationUID?: string; uid?: string; data?: unknown; metadata?: unknown } | undefined) ?? null;
  }

  private _hasLabel(annotation: { data?: unknown }): boolean {
    const data = annotation.data as Record<string, unknown> | undefined;
    const label = data?.label ?? data?.text;
    return typeof label === 'string' && label.trim().length > 0;
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

    if (!this._hasLabel(annotation)) return;

    const studyMeta =
      measurement && typeof measurement === 'object' && 'referenceStudyUID' in measurement
        ? DicomMetadataStore.getStudy((measurement as { referenceStudyUID: string }).referenceStudyUID)
        : null;

    const measurementMeta = measurement && typeof measurement === 'object' && 'metadata' in measurement
      ? (measurement as { metadata?: Record<string, unknown> }).metadata
      : undefined;
    const enrichedAnnotation = {
      ...annotation,
      metadata: { ...(annotation.metadata as Record<string, unknown> ?? {}), ...(measurementMeta ?? {}) },
    };
    const castMessage = createAnnotationUpdate(enrichedAnnotation, measurement, studyMeta);
    const uid = annotation.annotationUID ?? annotation.uid;
    const data = annotation.data as Record<string, unknown> | undefined;
    const label = data?.label ?? data?.text;
    this._logger.info('Sending annotation-update', { uid, action, label: typeof label === 'string' ? label : String(label) });
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
