/*
CastService

  public async castPublish(castMessage) -returns response.status

  processEvent

  public async getToken()
  public async castSubscribe()
  public async castUnsubscribe()

  public setHub(hubName: string) : boolean
  public getHub() : returns the hub object if set.
  public setTopic(topic: string)
  public getTopic(topic: string) :string

*/
import { PubSubService, ServicesManager, CommandsManager, ExtensionManager, DicomMetadataStore } from '@ohif/core';
import { ConferenceModal } from './conferenceModal';
import createMeasurementUpdate from './utils/createMeasurementUpdate';
import createAnnotationUpdate from './utils/createAnnotationUpdate';
import createImagingStudyOpen from './utils/createImagingStudyOpen';
import createImagingStudyClose from './utils/createImagingStudyClose';


export default class CastService extends PubSubService {
  private _extensionManager: ExtensionManager;
  private _servicesManager: ServicesManager;
  private _commandsManager: CommandsManager;

  // Add tracking fields from SlicerService
  private _publishedStudies: Set<string> = new Set(); // Track which studies we've already published
  private _lastMeasurementStates: Map<string, any> = new Map(); // Track last published measurement state
  private _lastMeasurementUpdateTimes: Map<string, number> = new Map(); // Track last update publish time (timestamp in ms)
  private _measurementsFromCast: Set<string> = new Set(); // Track measurement UIDs received from Cast to prevent republishing
  private _annotationsFromCast: Set<string> = new Set(); // Track annotation UIDs received from Cast to prevent republishing
  private _lastAnnotationStates: Map<string, any> = new Map(); // Track last published annotation state
  private _lastAnnotationUpdateTimes: Map<string, number> = new Map(); // Track last annotation update publish time (timestamp in ms)

  public static EVENTS = {
    CAST_MESSAGE: 'event::castMessage',
    HUB_SUBSCRIBED: 'event::hubSubscribed',
    HUB_UNSUBSCRIBED: 'event::hubUnsubscribed',
    WEBSOCKET_CLOSE: 'event::websocketClose',
    TOKEN_ACQUIRED: 'event::tokenAcquired',
    STUDY_CLOSE: 'event::studyClose',
  };



  public static REGISTRATION = {
    name: 'castService',
    altName: 'CastService',
    create: ({ configuration = {}, extensionManager, commandsManager, servicesManager }) => {
      return new CastService(extensionManager, commandsManager, servicesManager);
    },
  };

  public hub = {
    name: '',
    friendlyName: '',
    productName: '',
    enabled: false,
    events: [],
    lease: 999,
    hub_endpoint: '',
    authorization_endpoint: '',
    token_endpoint: '',
    token: '',
    subscriberName: '',
    topic: '',
    lastPublishedMessageID: '', // to filter event echo
    subscribed: false,
    resubscribeRequested: false,
    websocket: null,
  };

  public conferenceApproved = false;
  public conferenceDeclined = false;

  public castConfig: any;

  constructor(
    extensionManager: ExtensionManager,
    commandsManager: CommandsManager,
    servicesManager: ServicesManager
  ) {
    console.debug('CastService: creating service ');

    super(CastService.EVENTS);
    this._extensionManager = extensionManager;
    this._commandsManager = commandsManager;
    this._servicesManager = servicesManager;
    this.castConfig = extensionManager.appConfig.cast || extensionManager.appConfig.fhircast;
    console.log('CastService: Config loaded:', {
      hasCastConfig: !!this.castConfig,
      defaultHub: this.castConfig?.defaultHub,
      autoStart: this.castConfig?.autoStart
    });

    if (this.castConfig && this.castConfig.defaultHub) {
      console.log('CastService: Setting default hub:', this.castConfig.defaultHub);
     const result = this.setHub(this.castConfig.defaultHub);
      console.log('CastService: Hub set result:', result, 'Hub:', this.hub.name, 'Token endpoint:', this.hub.token_endpoint);

      if (this.castConfig.autoStart) {
        console.log('CastService: autoStart is true, calling getToken()');
        this.getToken();
      } else {
        console.log('CastService: autoStart is false, not calling getToken()');
      }
    } else {
      console.warn('CastService: No cast config or defaultHub configured');
    }
    const interval = setInterval(() => {
      this.checkWebsocket(interval);
    }, 10000);

    // Add MeasurementService setup from SlicerService
    const { MeasurementService } = servicesManager.services;

    // Set publish options in MeasurementService so it can publish updates
    MeasurementService.setPublishOptions(servicesManager, {
      measurementsFromCast: this._measurementsFromCast,
      lastMeasurementStates: this._lastMeasurementStates,
      lastMeasurementUpdateTimes: this._lastMeasurementUpdateTimes,
      createMeasurementUpdate: createMeasurementUpdate, // Pass the function to use
    });

    const {
      MEASUREMENT_ADDED,
      MEASUREMENT_REMOVED,
      MEASUREMENTS_CLEARED,
      RAW_MEASUREMENT_ADDED,
    } = MeasurementService.EVENTS;

    MeasurementService.subscribe(MEASUREMENT_REMOVED, ({ measurement }) => {
      // Clean up stored state when measurement is removed
      if (measurement && measurement.uid) {
        this._lastMeasurementStates.delete(measurement.uid);
        this._lastMeasurementUpdateTimes.delete(measurement.uid);
        this._measurementsFromCast.delete(measurement.uid);
      }
    });

    // Subscribe to our own CAST_MESSAGE event to handle incoming messages
    this.subscribe(CastService.EVENTS.CAST_MESSAGE, ({ castMessage }) => {
      this._handleCastMessage(castMessage);
    });

    // Subscribe to Cornerstone Tools annotation events directly
    this._subscribeToAnnotationEvents();
  }

  private async _subscribeToAnnotationEvents() {
    try {
      // Dynamic import to avoid circular dependencies
      const { Enums, annotation } = await import('@cornerstonejs/tools');
      const { eventTarget } = await import('@cornerstonejs/core');

      const csToolsEvents = Enums.Events;

      // Listen to annotation events
      eventTarget.addEventListener(csToolsEvents.ANNOTATION_ADDED, (evt) => {
        this._handleAnnotationEvent('added', evt.detail);
      });

      eventTarget.addEventListener(csToolsEvents.ANNOTATION_COMPLETED, (evt) => {
        this._handleAnnotationEvent('added', evt.detail);
      });

      eventTarget.addEventListener(csToolsEvents.ANNOTATION_MODIFIED, (evt) => {
        this._handleAnnotationEvent('updated', evt.detail);
      });

      eventTarget.addEventListener(csToolsEvents.ANNOTATION_REMOVED, (evt) => {
        this._handleAnnotationEvent('removed', evt.detail);
      });

      console.debug('CastService: Subscribed to Cornerstone Tools annotation events');
    } catch (error) {
      // Cornerstone Tools may not be available, that's okay
      console.debug('CastService: Cornerstone Tools not available for annotation events: ', error);
    }
  }

  private _handleAnnotationEvent(action: string, eventDetail: any) {
    try {
      const annotation = eventDetail.annotation;
      if (!annotation || !annotation.annotationUID) {
        console.debug('CastService: Invalid annotation in event detail');
        return;
      }

      // Filter: Only process ArrowAnnotate annotations
      const toolName = annotation.metadata?.toolName;
      if (toolName !== 'ArrowAnnotate') {
        console.debug('CastService: Skipping annotation-update for non-arrow annotation:', toolName);
        return;
      }

      const annotationUID = annotation.annotationUID;

    //   // Skip publishing if this annotation came from Cast (prevent loop)
    //   if (this._annotationsFromCast.has(annotationUID)) {
    //     console.debug('CastService: Skipping publish for annotation received from Cast:', annotationUID);
    //     this._annotationsFromCast.delete(annotationUID);
    //     return;
    //   }

      // For removed events, just publish and return
      if (action === 'removed') {
        this._publishAnnotationUpdate(annotation, null, action);
        // Clean up tracking
        this._lastAnnotationStates.delete(annotationUID);
        this._lastAnnotationUpdateTimes.delete(annotationUID);
        return;
      }

      // Check rate limiting: only send if at least 1 second has passed since last update
      const lastUpdateTime = this._lastAnnotationUpdateTimes.get(annotationUID) || 0;
      const currentTime = Date.now();
      const timeSinceLastUpdate = currentTime - lastUpdateTime;

      if (timeSinceLastUpdate < 1000 && action === 'updated') {
        console.debug('CastService: rate limiting - only ' + timeSinceLastUpdate + 'ms since last annotation update for uid:', annotationUID);
        return;
      }

      // Try to get associated measurement if available
      let measurement = null;
      try {
        const { MeasurementService } = this._servicesManager.services;
        if (MeasurementService) {
          measurement = MeasurementService.getMeasurement(annotationUID);
        }
      } catch (error) {
        // Measurement may not exist, that's okay
        console.debug('CastService: Could not get measurement for annotation:', error);
      }

      // Publish the annotation update
      this._publishAnnotationUpdate(annotation, measurement, action);

      // Store the current state for future comparison
      this._lastAnnotationStates.set(annotationUID, this._getAnnotationState(annotation));
      this._lastAnnotationUpdateTimes.set(annotationUID, currentTime);
    } catch (error) {
      console.warn('CastService: Failed to handle annotation event:', error);
    }
  }

  private _publishAnnotationUpdate(annotation: any, measurement: any, action: string) {
    try {
      if (!this.hub || !this.hub.subscribed || !this.hub.name) {
        console.debug('CastService: Hub not configured or not subscribed, skipping annotation-update');
        return;
      }

      const studyMeta = measurement?.referenceStudyUID
        ? DicomMetadataStore.getStudy(measurement.referenceStudyUID)
        : null;

      // Create the cast message
      const castMessage = createAnnotationUpdate(annotation, measurement, studyMeta);
      if (!castMessage) {
        console.warn('CastService: Failed to create annotation-update message');
        return;
      }

      // Add action to the message if needed
      if (action === 'removed') {
        castMessage.event.context[0].resource.action = 'removed';
      }

      console.debug('CastService: Publishing annotation-update for annotation:', annotation.annotationUID, 'action:', action);
      this.castPublish(castMessage, this.hub).catch(err => {
        console.warn('CastService: Failed to publish annotation-update event:', err);
      });
    } catch (error) {
      console.warn('CastService: Error publishing annotation-update event:', error);
    }
  }

  private _getAnnotationState(annotation: any): any {
    if (!annotation) {
      return null;
    }

    return {
      uid: annotation.annotationUID || annotation.uid,
      data: annotation.data ? JSON.stringify(annotation.data) : null,
      metadata: annotation.metadata ? JSON.stringify(annotation.metadata) : null,
    };
  }

  private checkWebsocket = async interval => {
    // resubscribe every 10secs if the websocket disconnects
    //console.debug('CastService: checking websocket '  );

    if (this.hub.resubscribeRequested && this.hub.subscribed && this.castConfig && this.castConfig.autoReconnect) {
      console.debug('CastService: Try to resubscribe ');
      this.hub.resubscribeRequested = false;
      const response = await this.castSubscribe();
      if (response == 202) {
        this.hub.resubscribeRequested = false;
      } else {
        this.hub.resubscribeRequested = true;
      }
    } else if (!this.hub.subscribed && this.hub.resubscribeRequested) {
      this.hub.resubscribeRequested = false;
    }
  };


  public setHub(hubName: string): boolean {
    if (hubName === this.hub.name) {
      console.debug('CastService: setHub: hub already set to ' + hubName);
      return true;
    }
    console.debug('CastService: setting hub to ' + hubName);
    try {
      if (this.castConfig && this.castConfig.hubs) {
        this.castConfig.hubs.forEach(hubconfig => {
          if (hubconfig.enabled && hubconfig.name === hubName) {
            if (this.hub.subscribed) {
              this.castUnsubscribe();
            }
            this.hub = hubconfig;
            this.hub.subscribed = false;
            return true;
          }
        });
        return true;
      } else {
        console.debug('CastService: hub not found in configuration ' + hubName);
        return false;
      }
    } catch (err) {
      console.warn('CastService: Unable to set the hub to  ' + hubName);
      return false;
    }
  }

  public getHub() {
    console.debug('CastService: getHub: hub is ' + this.hub.name);
    return this.hub;
  }

  public getTopic(topic: string): string {
    console.debug('CastService: getTopic called.');
    return this.hub.topic;
  }

  public setTopic(topic: string) {
    console.debug('CastService: setting topic to ' + topic);
    this.hub.topic = topic;
  //  this.hub.subscriberName = 'OHIF-'+ Math.random().toString(36).substring(2, 5);
  }
  public setConferenceApproved(request: boolean) {}

  public async getToken() {
    console.log('CastService: Getting token from:', this.hub.token_endpoint);

    const tokenFormData = new URLSearchParams();
    tokenFormData.append('grant_type', 'client_credentials');

    // Use hub client_id and client_secret (set from config via setHub)
    const hub = this.hub as any;
    const clientId = hub.client_id;
    const clientSecret = hub.client_secret;

    // if (!clientId || !clientSecret) {
    //   console.error('CastService: Missing client_id or client_secret for token request');
    //   return false;
    // }

    tokenFormData.append('client_id', clientId);
    tokenFormData.append('client_secret', clientSecret);
    tokenFormData.append('client_product_name', 'OHIF');

    console.log('CastService: OAuth Token Request:', {
      url: this.hub.token_endpoint,
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: '***',
      product_name: 'OHIF'
    });

    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenFormData,
    };
    try {
      console.log('CastService: Sending OAuth token request to:', this.hub.token_endpoint);
      const response = await fetch(this.hub.token_endpoint, requestOptions);
      console.log('CastService: OAuth token response status:', response.status);
      if (response.status == 200) {
        const config = await response.json();
        if (config.access_token) {
          console.log('CastService: Token received successfully (length:', config.access_token.length, ')');
          this.hub.token = config.access_token;
          this._broadcastEvent(CastService.EVENTS.TOKEN_ACQUIRED, {});
        } else {
          console.warn('CastService: Token response missing access_token:', config);
        }
        // if (this.hub.productName === 'RAD-AI'|| this.hub.productName === 'SLICER-HUB') {
        //   config.topic = 'PW44conf';
        //   this.setTopic('PW44conf');
        // }
        this.hub.subscriberName = config.subscriber_name;
        if (config.topic) {
          console.debug('CastService:  Topic received: ', config.topic);
          this.setTopic(config.topic);
          if (this.castConfig && this.castConfig.autoStart) {
            this.castSubscribe();
          }
        }
        return true;
      } else {
        const errorText = await response.text();
        console.error('CastService: Error getting token. Status:', response.status, 'Response:', errorText);
        return false;
      }
    } catch (err) {
      console.error('CastService: Exception getting token:', err.message, err);
      return false;
    }
  }

  public async castUnsubscribe() {
    this.hub.subscribed = false;
    this.hub.resubscribeRequested = false;
    const subscribeFormData = new URLSearchParams();
    subscribeFormData.append('hub.mode', 'unsubscribe');
    subscribeFormData.append('hub.channel.type', 'websocket');
    subscribeFormData.append('hub.callback', window.location.origin + '/castCallback');
    subscribeFormData.append('hub.events', this.hub.events.toString());
    subscribeFormData.append('hub.topic', this.hub.topic);
    subscribeFormData.append('hub.lease', this.hub.lease.toString());
    subscribeFormData.append('subscriber.name', this.hub.subscriberName);
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: 'Bearer ' + this.hub.token,
      },
      body: subscribeFormData,
      signal: AbortSignal.timeout(5000),
    };
    try {
      const response = await fetch(this.hub.hub_endpoint, requestOptions);
      if (response.status == 202) {
        const subscriptionResponse = await response.json();
        console.debug('CastService: Unsubscribe successfully from hub ' + this.hub.name);
        this._broadcastEvent(CastService.EVENTS.HUB_UNSUBSCRIBED, {});
      } else {
        console.debug('CastService: Unsubscribe refused by the hub. ');
      }
    } catch (err) {
      console.warn('CastService: Error unsubscribing from the hub.', err.message);
    }
    if (this.hub.websocket) {
      this.hub.websocket.close();
    }
  }

  private processEvent(eventData) {
    try {
      const castMessage = JSON.parse(eventData);
      if (castMessage['hub.mode']) {
        console.debug('CastService: Subscription acknowledged on the websocket.');
      }
      if (castMessage.event) {
        if (castMessage.event['hub.event'] === 'heartbeat') {
          console.debug('CastService: Received websocket heartbeat from hub ' + this.hub.name);
        } else if (castMessage.id === this.hub.lastPublishedMessageID) {
          console.debug(
            'CastService: Received echo of event ' +
              castMessage.event['hub.event'] +
              ', id:' +
              castMessage.id
          );
        } else if (castMessage.event) {

          console.debug('CastService: websocket received data: ', castMessage);
          this._broadcastEvent(CastService.EVENTS.CAST_MESSAGE, {castMessage});

          // Check if the topic is different.  This means we are entering a conference
          if (castMessage.event['hub.topic'].toLowerCase() !== this.hub.topic.toLowerCase()) {
            console.debug('CastService:  Conference starting');
            const { UIModalService } = this._servicesManager.services;
            if (!this.conferenceApproved && !this.conferenceDeclined) {
              UIModalService.show({
                content: ConferenceModal,
                containerDimensions: 'h-[125px] w-[300px]',
                title: castMessage.event['hub.topic'] + ' conference starting!',
                contentProps: {
                  onClose: UIModalService.hide,
                },
              });
            }
            this.conferenceApproved = true;
          }

        }
      }
    } catch (err) {
      console.warn('CastService: websocket processing error: ', err);
    }
  }

  private websocketClose() {
    console.debug('CastService: websocket is closed.');
    this.hub.resubscribeRequested = true;
    this._broadcastEvent(CastService.EVENTS.WEBSOCKET_CLOSE, {});
  }

  public async castSubscribe() {
    if (this.hub.topic === undefined) {
      console.warn('CastService: Error. subscription not sent. No topic defined.');
      return 'error: topic not defined';
    }

    if (!this.hub.token) {
      console.warn('CastService: Error. subscription not sent. No token available.');
      return 'error: no token';
    }

    console.log('CastService: Subscribing to hub:', this.hub.hub_endpoint);

    const subscribeFormData = new URLSearchParams();
    subscribeFormData.append('hub.mode', 'subscribe');
    subscribeFormData.append('hub.channel.type', 'websocket');
    subscribeFormData.append('hub.callback', window.location.origin + '/castCallback');
    subscribeFormData.append('hub.events', this.hub.events.toString());
    subscribeFormData.append('hub.topic', this.hub.topic);
    subscribeFormData.append('hub.lease', this.hub.lease.toString());
    subscribeFormData.append('subscriber.name', this.hub.subscriberName);

    console.log('CastService: Subscription Request:', {
      url: this.hub.hub_endpoint,
      hub_mode: 'subscribe',
      hub_channel_type: 'websocket',
      hub_callback: window.location.origin + '/castCallback',
      hub_events: this.hub.events.toString(),
      hub_topic: this.hub.topic,
      hub_lease: this.hub.lease.toString(),
      subscriber_name: this.hub.subscriberName,
      token: 'Bearer ' + (this.hub.token ? '***' : 'MISSING')
    });

    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: 'Bearer ' + this.hub.token,
      },
      body: subscribeFormData,
      signal: AbortSignal.timeout(5000),
    };
    try {
      console.log('CastService: Sending subscription request to:', this.hub.hub_endpoint);
      const response = await fetch(this.hub.hub_endpoint, requestOptions);
      console.log('CastService: Subscription response status:', response.status);
      if (response.status == 202) {
        this.hub.subscribed = true;
        this.hub.resubscribeRequested = false;
        const subscriptionResponse = await response.json();
        console.log('CastService: Subscription successful. Response:', JSON.stringify(subscriptionResponse));
        const websocket_url = subscriptionResponse['hub.channel.endpoint'];

        // Convert WebSocket URL to use the correct domain from hub_endpoint
        let normalizedWebsocketUrl = websocket_url;
        try {
          const hubEndpointUrl = new URL(this.hub.hub_endpoint);
          const websocketUrl = new URL(websocket_url);

          // Replace the domain/host with the one from hub_endpoint
          // Convert http/https to ws/wss
          const wsProtocol = hubEndpointUrl.protocol === 'https:' ? 'wss:' : 'ws:';
          normalizedWebsocketUrl = websocket_url.replace(
            websocketUrl.origin,
            `${wsProtocol}//${hubEndpointUrl.host}`
          );
        } catch (err) {
          console.warn('CastService: Could not normalize WebSocket URL, using original:', err);
        }

        this.hub.websocket = new WebSocket(normalizedWebsocketUrl); //  open websocket
        this.hub.websocket.onopen = function () {
          console.debug('CastService: websocket is connected.'); // Nuance wants the endpoint back after connection I think
          this.send('{"hub.channel.endpoint":"' + normalizedWebsocketUrl + '"}');
        };
        this.hub.websocket.addEventListener('message', ev => this.processEvent(ev.data));
        this.hub.websocket.addEventListener('close', () => this.websocketClose());
        this.hub.websocket.onerror = function () {
          console.warn('CastService: Error reported on websocket:');
        };

        this._broadcastEvent(CastService.EVENTS.HUB_SUBSCRIBED, {});
      } else if (response.status == 401) {
        console.warn('CastService: Subscription response 401 - Token refresh needed.');
        this.getToken();
      } else {
        const errorText = await response.text();
        console.error('CastService: Subscription rejected by hub. Status:', response.status, 'Response:', errorText);
      }
      return response.status;
    } catch (err) {
      console.error('CastService: Exception subscribing to the hub:', err.message, err);
      return 0;
    }
  }

  public async castPublish(castMessage,hub) {

    const timestamp = new Date();
    castMessage.timestamp = timestamp.toJSON();
    castMessage.id = 'OHIF-' + Math.random().toString(36).substring(2, 16);
    // Set on the hub parameter to ensure echo detection works correctly
    hub.lastPublishedMessageID = castMessage.id; // to filter event echo from the hub
    //castMessage.event['hub.topic'] = this.hub.topic;
    castMessage.event['hub.topic'] = hub.topic;
    const message = JSON.stringify(castMessage);
    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + hub.token },
      body: message,
    };
    try {
      console.debug('CastService: Publishing message to Cast hub: ' + message);
     // let hubEndpoint = this.hub.hub_endpoint + '/' + this.hub.topic;
     let hubEndpoint = hub.hub_endpoint + '/' + hub.topic;

     if (hub.productName === 'PHILIPS') {
        hubEndpoint = hub.hub_endpoint;
      }
      const response = await fetch(hubEndpoint, requestOptions);
      return response;
    } catch (err) {
      console.debug(err.message);
      return null;
    }
  }

  private _handleCastMessage(castMessage: any) {
    console.log('CastService: cast message received :', castMessage);

    const currentLocation = window.location.search;
    if (castMessage.event['hub.event'].toLowerCase() === 'patient-open') {
      if (castMessage.event.context) {
        let mrn = null;
        castMessage.event.context.forEach(contextResource => {
          if (contextResource.key.toLowerCase() === 'patient') {
            mrn = contextResource.resource.identifier[0].value;
          }
        });
        console.debug('CastService: patient-open for mrn:' + mrn);
        this._commandsManager.runCommand('navigateHistory', { to: '/?mrn=' + mrn });
      } else {
        console.warn('CastService: mrn not found in  patient-open message.');
      }
    }
    if (
      currentLocation != '' &&
      castMessage.event['hub.event'].toLowerCase() === 'patient-close'
    ) {
      this._commandsManager.runCommand('navigateHistory', { to: '/' });
    }
    if (castMessage.event['hub.event'].toLowerCase() === 'imagingstudy-open') {
      let studyUID = null;
      castMessage.event.context.forEach(contextResource => {
        if (contextResource.key.toLowerCase() === 'study') {
          studyUID = contextResource.resource.uid.replaceAll('urn:oid:', '');
        }
      });
      if (studyUID !== null && !currentLocation.includes(studyUID)) {
        console.debug('CastService:  imagingstudy-open, opening ' + studyUID);
        this._commandsManager.runCommand('navigateHistory', {
          to: '/viewer?StudyInstanceUIDs=' + studyUID + '&FHIRcast',
        });
      } else if (studyUID === null) {
        console.debug('CastService:  imagingstudy-open, studyUID not found in message');
      } else if (currentLocation.includes(studyUID)) {
        console.debug('CastService:  imagingstudy-open, studyUID already open');
      }
    }
    if (
      currentLocation != '' &&
      castMessage.event['hub.event'].toLowerCase() === 'imagingstudy-close'
    ) {
      this._commandsManager.runCommand('navigateHistory', { to: '/' });
    }
    if (
      currentLocation != '' &&
      castMessage.event['hub.event'].toLowerCase() === 'diagnosticreport-close'
    ) {
      console.debug('CastService:  Closing viewer');
      this._commandsManager.runCommand('navigateHistory', { to: '/' });
    }

    if (castMessage.event['hub.event'].toLowerCase().includes('diagnosticreport-select')) {
      // Handled elsewhere if needed
    }

    if (castMessage.event['hub.event'].toLowerCase() === 'annotation-update') {
      console.log('CastService: annotation-update received from hub');

      if (castMessage.event.context) {
        let annotationResource: any = null;
        castMessage.event.context.forEach(contextResource => {
          if (contextResource.key.toLowerCase() === 'annotation') {
            annotationResource = contextResource.resource;
          }
        });

        if (annotationResource && annotationResource.uid) {
          // Track that this annotation came from Cast to prevent republishing
          this._annotationsFromCast.add(annotationResource.uid);

          // Handle removed action
          if (annotationResource.action === 'removed') {
            this._handleAnnotationRemoved(annotationResource).catch(err => {
              console.warn('CastService: Error handling annotation removal:', err);
            });
            return;
          }

          // Handle added/updated actions
          this._handleAnnotationAddedOrUpdated(annotationResource).catch(err => {
            console.warn('CastService: Error handling annotation add/update:', err);
          });
        } else {
          console.warn('CastService: annotation resource not found or missing uid in annotation-update message.');
        }
      } else {
        console.warn('CastService: context not found in annotation-update message.');
      }
    } else if (castMessage.event['hub.event'].toLowerCase() === 'measurement-update') {
      // Legacy support for measurement-update events
      console.log('CastService: measurement-update received from hub (legacy)');

      if (castMessage.event.context) {
        let measurementResource: any = null;
        castMessage.event.context.forEach(contextResource => {
          if (contextResource.key.toLowerCase() === 'measurement') {
            measurementResource = contextResource.resource;
          }
        });

        if (measurementResource && measurementResource.uid) {
          const { MeasurementService, displaySetService } = this._servicesManager.services;
          const existingMeasurement = MeasurementService.getMeasurement(measurementResource.uid);

          try {
            if (existingMeasurement) {
              // Measurement exists, update it
              console.debug('CastService: updating existing measurement with uid:', measurementResource.uid);
              // Track that this measurement came from Cast to prevent republishing
              this._measurementsFromCast.add(measurementResource.uid);
              // Use Cornerstone source so annotations can be created/updated
              let source = existingMeasurement.source;
              if (!source || (source.name !== 'Cornerstone3DTools' && source.name !== 'CornerstoneTools')) {
                source = MeasurementService.getSource('Cornerstone3DTools', '0.1') ||
                         MeasurementService.getSource('CornerstoneTools', '4.0');
              }
              const measurementToUpdate = {
                ...measurementResource,
                source: source,
                modifiedTimestamp: measurementResource.modifiedTimestamp || Math.floor(Date.now() / 1000),
              };
              MeasurementService.update(measurementResource.uid, measurementToUpdate, false);
            } else {
              // Measurement doesn't exist, create it using addRawMeasurement if we have annotation data
              console.debug('CastService: creating new measurement with uid:', measurementResource.uid);

              // Track that this measurement came from Cast to prevent republishing
              this._measurementsFromCast.add(measurementResource.uid);
              // Get or create source - use Cornerstone source so annotations can be created
              let source = MeasurementService.getSource('Cornerstone3DTools', '0.1') ||
                         MeasurementService.getSource('CornerstoneTools', '4.0');
              if (!source) {
                // If no Cornerstone source exists, we can't create annotations
                // But we'll still create the measurement
                source = MeasurementService.createSource('Cast', '1.0.0');
              }

              // Check if we have annotation data in the message
              if (measurementResource.annotation && measurementResource.annotation.data && source) {
                // Use addRawMeasurement which will trigger RAW_MEASUREMENT_ADDED
                // This will automatically create both the measurement and annotation
                try {
                  const toolName = measurementResource.toolName;
                  if (!toolName) {
                    throw new Error('toolName is required for addRawMeasurement');
                  }

                  // Create dataSource object for addRawMeasurement
                  const dataSource = {
                    getImageIdsForInstance: ({ instance }) => {
                      if (measurementResource.referencedImageId) {
                        return measurementResource.referencedImageId;
                      }
                      // Try to get from displaySetService
                      if (displaySetService && instance) {
                        const displaySets = displaySetService.getDisplaySetsForSeries(
                          measurementResource.referenceStudyUID,
                          measurementResource.referenceSeriesUID
                        );
                        if (displaySets && displaySets.length > 0) {
                          const displaySet = displaySets.find(ds =>
                            ds.displaySetInstanceUID === measurementResource.displaySetInstanceUID
                          ) || displaySets[0];
                          const imageIds = displaySetService.getImageIdsForDisplaySet(displaySet.displaySetInstanceUID);
                          const frameNumber = measurementResource.frameNumber || 1;
                          return imageIds[frameNumber - 1] || imageIds[0];
                        }
                      }
                      return null;
                    },
                  };

                  // Get the mapping to find toMeasurementSchema
                  const mappings = MeasurementService.getSourceMappings(source.name, source.version);
                  if (!mappings || mappings.length === 0) {
                    throw new Error(`No mappings found for source ${source.name}@${source.version}`);
                  }

                  // Find the mapping for this tool type
                  const matchingMapping = mappings.find(m => m.annotationType === toolName);
                  if (!matchingMapping) {
                    throw new Error(`No mapping found for toolName ${toolName} in source ${source.name}@${source.version}`);
                  }

                  // Create annotation object in the format expected by addRawMeasurement
                  const annotationObj = {
                    annotationUID: measurementResource.uid,
                    highlighted: false,
                    isLocked: measurementResource.isLocked || false,
                    invalidated: false,
                    metadata: {
                      toolName: toolName,
                      FrameOfReferenceUID: measurementResource.FrameOfReferenceUID,
                      referencedImageId: measurementResource.referencedImageId,
                      ...(measurementResource.annotation.metadata || {}),
                    },
                    data: {
                      ...measurementResource.annotation.data,
                      label: measurementResource.annotation.data.label || measurementResource.label,
                      text: measurementResource.annotation.data.text || measurementResource.label,
                      frameNumber: measurementResource.annotation.data.frameNumber || measurementResource.frameNumber || 1,
                    },
                  };

                  // Use addRawMeasurement - this will create the measurement and trigger RAW_MEASUREMENT_ADDED
                  // which will automatically create the annotation
                  // IMPORTANT: Set data.id to ensure the correct UID is used (prevents duplicate measurements)
                  MeasurementService.addRawMeasurement(
                    source,
                    toolName,
                    {
                      id: measurementResource.uid,  // This ensures the correct UID is used
                      annotation: annotationObj
                    },
                    matchingMapping.toMeasurementSchema,
                    dataSource
                  );

                  console.debug('CastService: Successfully created measurement and annotation using addRawMeasurement');
                } catch (error) {
                  console.warn('CastService: Failed to use addRawMeasurement, falling back to direct creation:', error);

                  // Fallback to direct creation if addRawMeasurement fails
                  const newMeasurement = {
                    ...measurementResource,
                    source: source,
                    modifiedTimestamp: measurementResource.modifiedTimestamp || Math.floor(Date.now() / 1000),
                    uid: measurementResource.uid,
                  };

                  (MeasurementService as any).measurements.set(newMeasurement.uid, newMeasurement);
                  (MeasurementService as any)._broadcastEvent(MeasurementService.EVENTS.MEASUREMENT_ADDED, {
                    source: source,
                    measurement: newMeasurement,
                  });
                }
              } else {
                // No annotation data, fall back to direct measurement creation
                console.debug('CastService: No annotation data in message, creating measurement only');
                const newMeasurement = {
                  ...measurementResource,
                  source: source,
                  modifiedTimestamp: measurementResource.modifiedTimestamp || Math.floor(Date.now() / 1000),
                  uid: measurementResource.uid,
                };

                (MeasurementService as any).measurements.set(newMeasurement.uid, newMeasurement);
                (MeasurementService as any)._broadcastEvent(MeasurementService.EVENTS.MEASUREMENT_ADDED, {
                  source: source,
                  measurement: newMeasurement,
                });
              }
            }
          } catch (error) {
            console.warn('CastService: Failed to process measurement from hub:', error);
          }
        } else {
          console.warn('CastService: measurement resource not found or missing uid in measurement-update message.');
        }
      } else {
        console.warn('CastService: context not found in measurement-update message.');
      }
    }
  }

  private async _handleAnnotationRemoved(annotationResource: any) {
    try {
      const { MeasurementService } = this._servicesManager.services;
      const annotationUID = annotationResource.uid;

      // Try to remove from MeasurementService if it exists
      const measurement = MeasurementService?.getMeasurement(annotationUID);
      if (measurement) {
        MeasurementService.remove(annotationUID, measurement.source);
      }

      // Try to remove from Cornerstone Tools annotation state
      try {
        const { annotation } = await import('@cornerstonejs/tools');
        annotation.state.removeAnnotation(annotationUID);
        console.debug('CastService: Removed annotation from Cornerstone Tools:', annotationUID);
      } catch (error) {
        console.debug('CastService: Could not remove annotation from Cornerstone Tools:', error);
      }

      // Clean up tracking
      this._lastAnnotationStates.delete(annotationUID);
      this._lastAnnotationUpdateTimes.delete(annotationUID);
      this._annotationsFromCast.delete(annotationUID);
    } catch (error) {
      console.warn('CastService: Failed to handle annotation removal:', error);
    }
  }

  private async _handleAnnotationAddedOrUpdated(annotationResource: any) {
    try {
      const annotationUID = annotationResource.uid;
      const { MeasurementService, displaySetService } = this._servicesManager.services;

      // Try to get existing annotation from Cornerstone Tools
      let existingAnnotation = null;
      try {
        const { annotation } = await import('@cornerstonejs/tools');
        existingAnnotation = annotation.state.getAnnotation(annotationUID);
      } catch (error) {
        // Annotation may not exist yet
      }

      const measurement = annotationResource.measurement;

      if (existingAnnotation) {
        // Annotation exists, update it
        console.debug('CastService: updating existing annotation with uid:', annotationUID);
        await this._updateAnnotation(existingAnnotation, annotationResource, measurement);
      } else {
        // Annotation doesn't exist, create it
        console.debug('CastService: creating new annotation with uid:', annotationUID);
        await this._createAnnotation(annotationResource, measurement);
      }
    } catch (error) {
      console.warn('CastService: Failed to handle annotation add/update:', error);
    }
  }

  private async _updateAnnotation(existingAnnotation: any, annotationResource: any, measurement: any) {
    try {
      const { annotation } = await import('@cornerstonejs/tools');
      const { triggerAnnotationRenderForViewportIds } = await import('@cornerstonejs/tools/utilities');
      const annotationUID = annotationResource.uid;

      // Update annotation data directly (modify the existing annotation object)
      // The annotation object is already in the state, so modifying it directly updates it
      if (annotationResource.data) {
        Object.assign(existingAnnotation.data, annotationResource.data);
      }

      // Update annotation metadata directly
      if (annotationResource.metadata) {
        Object.assign(existingAnnotation.metadata, annotationResource.metadata);
      }

      // Update locked state if provided
      if (annotationResource.metadata?.isLocked !== undefined) {
        annotation.locking.setAnnotationLocked(annotationUID, annotationResource.metadata.isLocked);
      }

      // Update visible state if provided
      if (annotationResource.metadata?.isVisible !== undefined) {
        annotation.visibility.setAnnotationVisibility(annotationUID, annotationResource.metadata.isVisible);
      }

      // Trigger render for all viewports
      try {
        const { cornerstoneViewportService } = this._servicesManager.services;
        if (cornerstoneViewportService) {
          const renderingEngine = cornerstoneViewportService.getRenderingEngine();
          if (renderingEngine) {
            const viewportIds = renderingEngine.getViewports().map(viewport => viewport.id);
            triggerAnnotationRenderForViewportIds(viewportIds);
          }
        }
      } catch (error) {
        console.debug('CastService: Could not trigger annotation render:', error);
      }

      // If there's a measurement, update it too
      if (measurement) {
        const { MeasurementService } = this._servicesManager.services;
        const existingMeasurement = MeasurementService.getMeasurement(annotationUID);

        if (existingMeasurement) {
          // Track that this measurement came from Cast to prevent republishing
          this._measurementsFromCast.add(annotationUID);

          let source = existingMeasurement.source;
          if (!source || (source.name !== 'Cornerstone3DTools' && source.name !== 'CornerstoneTools')) {
            source = MeasurementService.getSource('Cornerstone3DTools', '0.1') ||
                     MeasurementService.getSource('CornerstoneTools', '4.0');
          }

          const measurementToUpdate = {
            ...measurement,
            source: source,
            modifiedTimestamp: measurement.modifiedTimestamp || Math.floor(Date.now() / 1000),
          };

          MeasurementService.update(annotationUID, measurementToUpdate, false);
        }
      }

      console.debug('CastService: Successfully updated annotation:', annotationUID);
    } catch (error) {
      console.warn('CastService: Failed to update annotation:', error);
    }
  }

  private async _createAnnotation(annotationResource: any, measurement: any) {
    try {
      const { MeasurementService, displaySetService } = this._servicesManager.services;
      const annotationUID = annotationResource.uid;

      // Get or create source - use Cornerstone source so annotations can be created
      let source = MeasurementService.getSource('Cornerstone3DTools', '0.1') ||
                   MeasurementService.getSource('CornerstoneTools', '4.0');
      if (!source) {
        console.warn('CastService: No Cornerstone source available, cannot create annotation');
        return;
      }

      // Create annotation object
      const annotationObj = {
        annotationUID: annotationUID,
        highlighted: false,
        isLocked: annotationResource.metadata?.isLocked || false,
        invalidated: false,
        metadata: {
          ...annotationResource.metadata,
        },
        data: {
          ...annotationResource.data,
        },
      };

      // If we have measurement data, use addRawMeasurement which will create both annotation and measurement
      if (measurement && measurement.toolName) {
        try {
          const toolName = measurement.toolName;

          // Create dataSource object for addRawMeasurement
          const dataSource = {
            getImageIdsForInstance: ({ instance }) => {
              if (measurement.referencedImageId) {
                return measurement.referencedImageId;
              }
              // Try to get from displaySetService
              if (displaySetService && instance) {
                const displaySets = displaySetService.getDisplaySetsForSeries(
                  measurement.referenceStudyUID,
                  measurement.referenceSeriesUID
                );
                if (displaySets && displaySets.length > 0) {
                  const displaySet = displaySets.find(ds =>
                    ds.displaySetInstanceUID === measurement.displaySetInstanceUID
                  ) || displaySets[0];
                  const imageIds = displaySetService.getImageIdsForDisplaySet(displaySet.displaySetInstanceUID);
                  const frameNumber = measurement.frameNumber || 1;
                  return imageIds[frameNumber - 1] || imageIds[0];
                }
              }
              return null;
            },
          };

          // Get the mapping to find toMeasurementSchema
          const mappings = MeasurementService.getSourceMappings(source.name, source.version);
          if (!mappings || mappings.length === 0) {
            throw new Error(`No mappings found for source ${source.name}@${source.version}`);
          }

          // Find the mapping for this tool type
          const matchingMapping = mappings.find(m => m.annotationType === toolName);
          if (!matchingMapping) {
            throw new Error(`No mapping found for toolName ${toolName} in source ${source.name}@${source.version}`);
          }

          // Track that this measurement came from Cast to prevent republishing
          this._measurementsFromCast.add(annotationUID);

          // Use addRawMeasurement - this will create both the measurement and annotation
          MeasurementService.addRawMeasurement(
            source,
            toolName,
            {
              id: annotationUID,  // This ensures the correct UID is used
              annotation: annotationObj
            },
            matchingMapping.toMeasurementSchema,
            dataSource
          );

          console.debug('CastService: Successfully created annotation and measurement using addRawMeasurement');
        } catch (error) {
          console.warn('CastService: Failed to use addRawMeasurement, falling back to direct annotation creation:', error);
          this._createAnnotationDirectly(annotationObj);
        }
      } else {
        // No measurement data, create annotation directly
        this._createAnnotationDirectly(annotationObj);
      }
    } catch (error) {
      console.warn('CastService: Failed to create annotation:', error);
    }
  }

  private async _createAnnotationDirectly(annotationObj: any) {
    try {
      const { annotation } = await import('@cornerstonejs/tools');
      const annotationManager = annotation.state.getAnnotationManager();

      annotationManager.addAnnotation(annotationObj);
      console.debug('CastService: Successfully created annotation directly:', annotationObj.annotationUID);
    } catch (error) {
      console.warn('CastService: Failed to create annotation directly:', error);
    }
  }

  /**
   * Helper function to publish imagingstudy-open event
   * @param {string} studyInstanceUID - The DICOM Study Instance UID
   */
  public publishImagingStudyOpen(studyInstanceUID: string) {
    try {
      if (!this.hub || !this.hub.subscribed || !this.hub.name) {
        console.debug('CastService: Hub not configured or not subscribed, skipping imagingstudy-open');
        return;
      }

      // Create the cast message
      const castMessage = createImagingStudyOpen(studyInstanceUID);
      if (!castMessage) {
        console.warn('CastService: Failed to create imagingstudy-open message for study:', studyInstanceUID);
        return;
      }

      console.debug('CastService: Publishing imagingstudy-open for study:', studyInstanceUID);
      this.castPublish(castMessage, this.hub).catch(err => {
        console.warn('CastService: Failed to publish imagingstudy-open event:', err);
      });
    } catch (error) {
      console.warn('CastService: Error publishing imagingstudy-open event:', error);
    }
  }

  /**
   * Helper function to publish imagingstudy-close event
   * @param {string} studyInstanceUID - The DICOM Study Instance UID
   */
  public publishImagingStudyClose(studyInstanceUID: string) {
    try {
      if (!this.hub || !this.hub.subscribed || !this.hub.name) {
        console.debug('CastService: Hub not configured or not subscribed, skipping imagingstudy-close');
        return;
      }

      // Create the cast message
      const castMessage = createImagingStudyClose(studyInstanceUID);
      if (!castMessage) {
        console.warn('CastService: Failed to create imagingstudy-close message for study:', studyInstanceUID);
        return;
      }

      console.debug('CastService: Publishing imagingstudy-close for study:', studyInstanceUID);
      this.castPublish(castMessage, this.hub).catch(err => {
        console.warn('CastService: Failed to publish imagingstudy-close event:', err);
      });
    } catch (error) {
      console.warn('CastService: Error publishing imagingstudy-close event:', error);
    }
  }
}
