import { PubSubService } from '../_shared/pubSubServiceInterface';
import * as cornerstone from '@cornerstonejs/core';
import * as cornerstoneTools from '@cornerstonejs/tools';

const EVENTS = {
  CONNECTED: 'event::collaboration_connected',
  DISCONNECTED: 'event::collaboration_disconnected',
  REMOTE_ACTION: 'event::collaboration_remote_action',
  REMOTE_CURSOR: 'event::collaboration_remote_cursor',
  REMOTE_HISTORY: 'event::collaboration_remote_history',
};

class CollaborationService extends PubSubService {
  public static REGISTRATION = {
    name: 'collaborationService',
    altName: 'CollaborationService',
    create: ({ configuration = {} }) => {
      return new CollaborationService();
    },
  };

  public static readonly EVENTS = EVENTS;

  public userId: string = 'Guest_' + Math.floor(Math.random() * 1000);

  private ws: WebSocket | null = null;
  private roomId: string | null = null;
  private followerMode: boolean = false;
  private lastCursorSendTime: number = 0;
  private lastActionSendTime: number = 0;
  private actionTimeout: any = null;
  private pendingAction: any = null;
  private throttleMs: number = 50;
  private servicesManager: any;
  private commandsManager: any;
  private reconnectTimeout: any;
  private lastRemoteLayout: any = null;
  private lastVoiState: Map<string, string> = new Map();

  constructor() {
    super(EVENTS);
  }

  private initialized = false;

  public init({ servicesManager, commandsManager }: any) {
    if (this.initialized) return;
    this.servicesManager = servicesManager;
    this.commandsManager = commandsManager;
    this._bindCornerstoneEvents();
    this.initialized = true;
  }

  public isRemoteUpdate: boolean = false;

  private _bindCornerstoneEvents() {
    // Handle incoming remote updates
    this.subscribe(EVENTS.REMOTE_ACTION, ({ action }) => {
      this._applyRemoteAction(action);
    });

    this.subscribe(EVENTS.REMOTE_HISTORY, ({ history }) => {
      this.isRemoteUpdate = true;
      try {
        const renderViewportIds = new Set<string>();
        for (const msg of history) {
          if (msg.type === 'action') {
            this._applyRemoteAction(msg, true);
            if (msg.viewportId) renderViewportIds.add(msg.viewportId);
          }
        }
        
        // Force re-render of all modified viewports
        const { cornerstoneViewportService } = this.servicesManager.services;
        for (const vid of renderViewportIds) {
          const viewportInfo = cornerstoneViewportService.getViewportInfo(vid);
          if (viewportInfo) {
            const renderingEngine = cornerstone.getRenderingEngine(viewportInfo.getRenderingEngineId());
            renderingEngine?.renderViewport(vid);
          }
        }
      } finally {
        this.isRemoteUpdate = false;
      }
    });

    const { viewportGridService } = this.servicesManager.services;
    if (viewportGridService) {
      viewportGridService.subscribe(viewportGridService.EVENTS.GRID_STATE_CHANGED, ({ state }) => {
        if (this.isRemoteUpdate || !this.followerMode) return;
        
        if (this.lastRemoteLayout &&
            this.lastRemoteLayout.numRows === state.layout.numRows &&
            this.lastRemoteLayout.numCols === state.layout.numCols) {
            // Consume it to prevent loops
            this.lastRemoteLayout = null;
            return;
        }
        
        // Convert Map to Array for JSON serialization
        const serializableState = {
          ...state,
          viewports: Array.from(state.viewports.entries())
        };
        
        console.log('[Collaboration] Broadcasting Layout change');
        this.sendAction({
          type: 'action',
          actionType: 'grid_state',
          state: serializableState
        }, true);
      });
    }
  }

  private _applyRemoteAction(action: any, isBatch: boolean = false) {
    this.isRemoteUpdate = true;
    console.log('[Collaboration] Applying remote action:', action.actionType, 'Batch:', isBatch);
    try {
      const { cornerstoneViewportService } = this.servicesManager.services;
      
      if (action.actionType === 'camera') {
        const viewportInfo = cornerstoneViewportService.getViewportInfo(action.viewportId);
        console.log('[Collaboration] _applyRemoteAction Camera -> ViewportInfo:', !!viewportInfo, 'ViewportID:', action.viewportId);
        if (viewportInfo) {
          const renderingEngine = cornerstone.getRenderingEngine(viewportInfo.getRenderingEngineId());
          console.log('[Collaboration] _applyRemoteAction Camera -> RenderingEngine:', !!renderingEngine, 'EngineID:', viewportInfo.getRenderingEngineId());
          const viewport = renderingEngine?.getViewport(action.viewportId);
          console.log('[Collaboration] _applyRemoteAction Camera -> Viewport extracted:', !!viewport);
          if (viewport) {
            
            if (action.zoom !== undefined) {
               console.log('[Collaboration] Applying zoom/pan override');
               viewport.setZoom(action.zoom);
               if (action.pan) {
                 viewport.setPan(action.pan);
               }
               
               if (action.camera?.flipHorizontal !== undefined || action.camera?.flipVertical !== undefined) {
                  viewport.setCamera({
                      flipHorizontal: action.camera.flipHorizontal,
                      flipVertical: action.camera.flipVertical,
                  });
               }
            } else if (action.camera) {
               viewport.setCamera(action.camera);
            }
            
            if (action.rotation !== undefined) {
               console.log('[Collaboration] Applying rotation override');
               (viewport as any).setRotation(action.rotation);
            }
            
            if (!isBatch) {
                console.log('[Collaboration] _applyRemoteAction Camera -> Firing render()');
                viewport.render();
            }
          }
        }
      } else if (action.actionType === 'voi') {
        const viewportInfo = cornerstoneViewportService.getViewportInfo(action.viewportId);
        if (viewportInfo) {
          const renderingEngine = cornerstone.getRenderingEngine(viewportInfo.getRenderingEngineId());
          const viewport = renderingEngine?.getViewport(action.viewportId);
          if (viewport) {
            console.log('[Collaboration] Applying VOI override');
            (viewport as any).setProperties({ voiRange: action.voiRange, invert: action.invert });
            if (!isBatch) {
              viewport.render();
            }
          }
        }
      } else if (action.actionType === 'annotation_added' || action.actionType === 'annotation_modified') {
        const annotationManager = cornerstoneTools.annotation.state.getAnnotationManager();

        let element = undefined;
        const viewportInfo = cornerstoneViewportService.getViewportInfo(action.viewportId);
        if (viewportInfo) {
          const renderingEngine = cornerstone.getRenderingEngine(viewportInfo.getRenderingEngineId());
          const viewport = renderingEngine?.getViewport(action.viewportId);
          if (viewport) {
             element = viewport.element;
          }
        }

        if (action.actionType === 'annotation_added') {
          const { measurementService } = this.servicesManager.services;
          const source = measurementService.getSource('Cornerstone3DTools', '0.1');
          
          if (source) {
              const csToolsEventDetail = {
                 annotation: action.annotation,
                 uid: action.annotation.annotationUID
              };
              
              const annotationManager = cornerstoneTools.annotation.state.getAnnotationManager();
              if (!annotationManager.getAnnotation(action.annotation.annotationUID)) {
                  if (element) {
                     cornerstoneTools.annotation.state.addAnnotation(action.annotation, element);
                     // triggerAnnotationAddedForElement(action.annotation, element);
                  } else {
                     cornerstoneTools.annotation.state.addAnnotation(action.annotation, action.annotation.metadata?.FrameOfReferenceUID || 'default');
                  }
              }
              
              // Force into OHIF MeasurementService directly
              try {
                  source.annotationToMeasurement(action.annotation.metadata.toolName, csToolsEventDetail);
              } catch (e) {
                 console.warn('[Collaboration] Measurement sync fallback failed', e);
              }
          }
        } else {
          const { measurementService } = this.servicesManager.services;
          const source = measurementService.getSource('Cornerstone3DTools', '0.1');

          const annotationManager = cornerstoneTools.annotation.state.getAnnotationManager();
          const existing = annotationManager.getAnnotation(action.annotation.annotationUID);
          if (existing) {
             Object.assign(existing.data, action.annotation.data);
             Object.assign(existing.metadata, action.annotation.metadata);
             // if (element) triggerAnnotationModified(existing, element);
          } else {
             if (element) {
                cornerstoneTools.annotation.state.addAnnotation(action.annotation, element);
                // triggerAnnotationAddedForElement(action.annotation, element);
             } else {
                cornerstoneTools.annotation.state.addAnnotation(action.annotation, action.annotation.metadata?.FrameOfReferenceUID || 'default');
             }
          }
          
          if (source) {
              const csToolsEventDetail = {
                 annotation: existing || action.annotation,
                 uid: action.annotation.annotationUID
              };
              try {
                 source.annotationToMeasurement(action.annotation.metadata.toolName, csToolsEventDetail, true);
              } catch (e) {
                 console.warn('[Collaboration] Measurement modify fallback failed', e);
              }
          }
        }
        
        
        if (!isBatch && viewportInfo) {
          const renderingEngine = cornerstone.getRenderingEngine(viewportInfo.getRenderingEngineId());
          renderingEngine?.renderViewport(action.viewportId);
        }
      } else if (action.actionType === 'annotation_removed') {
        const annotationManager = cornerstoneTools.annotation.state.getAnnotationManager();
        annotationManager.removeAnnotation(action.annotation.annotationUID);
        
        // Also remove from OHIF MeasurementService if possible
        const { measurementService } = this.servicesManager.services;
        const measurement = measurementService.getMeasurements().find(m => m.data?.annotation?.annotationUID === action.annotation.annotationUID || m.uid === action.annotation.annotationUID);
        if (measurement) {
           measurementService.remove(measurement.uid);
        }

        const viewportInfo = cornerstoneViewportService.getViewportInfo(action.viewportId);
        if (!isBatch && viewportInfo) {
           const renderingEngine = cornerstone.getRenderingEngine(viewportInfo.getRenderingEngineId());
           renderingEngine?.renderViewport(action.viewportId);
        }
      } else if (action.actionType === 'colormap') {
        const viewportInfo = cornerstoneViewportService.getViewportInfo(action.viewportId);
        if (viewportInfo) {
          const renderingEngine = cornerstone.getRenderingEngine(viewportInfo.getRenderingEngineId());
          const viewport = renderingEngine?.getViewport(action.viewportId);
          if (viewport) {
             (viewport as any).setProperties({ colormap: action.colormap });
             if (!isBatch) viewport.render();
          }
        }
      } else if (action.actionType === 'colorbar') {
        const { colorbarService } = this.servicesManager.services;
        if (colorbarService) {
           if (action.colorbar && action.colorbar.length > 0) {
              // Iterate through the remote colorbar state and apply it
              action.colorbar.forEach(item => {
                 colorbarService.addColorbar(action.viewportId, [item.displaySetInstanceUID], {
                    activeColormapName: item.colorbar.activeColormapName,
                    // Note: We might need more options here but this is a good start
                 });
              });
           } else {
              colorbarService.removeColorbar(action.viewportId);
           }
        }
      } else if (action.actionType === 'grid_state') {
        const { viewportGridService } = this.servicesManager.services;
        if (viewportGridService) {
          console.log('[Collaboration] Applying remote layout change natively via commandsManager');
          
          if (this.commandsManager) {
             this.lastRemoteLayout = {
               numRows: action.state.layout.numRows,
               numCols: action.state.layout.numCols
             };
             this.commandsManager.runCommand('setViewportGridLayout', {
               numRows: action.state.layout.numRows,
               numCols: action.state.layout.numCols,
             });
          } else {
             // Fallback
             const newState = {
               ...action.state,
               viewports: new Map(action.state.viewports)
             };
             viewportGridService.set(newState);
          }
        }
      }
    } finally {
      this.isRemoteUpdate = false;
    }
  }

  public connect(roomId: string, token?: string) {
    if (!token) {
      token = localStorage.getItem('ohif-jwt') || 'test-token';
    }

    if (this.roomId === roomId && (this.ws?.readyState === WebSocket.OPEN || this.ws?.readyState === WebSocket.CONNECTING)) {
      return;
    }

    if (this.ws) {
      this.disconnect();
    }
    
    this.roomId = roomId;
    // Using the specified URL from instructions
    const wsUrl = `wss://ws.smartcareplus.in/?roomId=${roomId}&token=${token}`;
    
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('Collaboration WS connected to room', roomId);
      this._broadcastEvent(EVENTS.CONNECTED, { roomId });
    };

    this.ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        this._handleMessage(parsed);
      } catch (e) {
        console.error('Failed to parse WS message', e);
      }
    };

    this.ws.onclose = () => {
      console.log('Collaboration WS disconnected');
      this._broadcastEvent(EVENTS.DISCONNECTED, {});
      // auto reconnect
      this.reconnectTimeout = setTimeout(() => {
        if (this.roomId) {
            this.connect(this.roomId, token);
        }
      }, 5000);
    };

    this.ws.onerror = (err) => {
      console.error('Collaboration WS error', err);
    };
  }

  public disconnect() {
    clearTimeout(this.reconnectTimeout);
    this.roomId = null;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  public toggleFollowMode(enabled?: boolean) {
    if (enabled !== undefined) {
      this.followerMode = enabled;
    } else {
      this.followerMode = !this.followerMode;
    }
    return this.followerMode;
  }

  public getFollowMode() {
    return this.followerMode;
  }

  public sendAction(action: any, force: boolean = false) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    if (action.actionType === 'voi') {
       const stateKey = `${action.viewportId}-${action.voiRange?.lower}-${action.voiRange?.upper}-${action.invert}`;
       if (this.lastVoiState.get(action.viewportId) === stateKey) {
          return;
       }
       this.lastVoiState.set(action.viewportId, stateKey);
    }

    const now = Date.now();

    if (action.type === 'cursor') {
      if (!force && now - this.lastCursorSendTime < this.throttleMs) {
        return; // throttled
      }
      this.lastCursorSendTime = now;
      this.ws.send(JSON.stringify(action));
    } else {
      // Handles camera and annotations
      if (force) {
        if (this.actionTimeout) {
          clearTimeout(this.actionTimeout);
          this.actionTimeout = null;
        }
        this.pendingAction = null;
        this.lastActionSendTime = now;
        
        try {
          const payload = JSON.stringify(action);
          console.log('[Collaboration] Transmitting forced action over WS:', payload);
          this.ws.send(payload);
        } catch (err) {
          console.error('[Collaboration] CRITICAL error stringifying forced action:', err, action);
        }
      } else {
        if (now - this.lastActionSendTime < this.throttleMs) {
          // Queue the latest action for the trailing edge
          this.pendingAction = action;
          if (!this.actionTimeout) {
            this.actionTimeout = setTimeout(() => {
              this.actionTimeout = null;
              if (this.pendingAction && this.ws?.readyState === WebSocket.OPEN) {
                console.log('[Collaboration] Transmitting trailing edge action:', this.pendingAction.actionType);
                this.lastActionSendTime = Date.now();
                try {
                  const payload = JSON.stringify(this.pendingAction);
                  console.log('[Collaboration] Transmitting trailing over WS:', payload);
                  this.ws.send(payload);
                } catch (err) {
                  console.error('[Collaboration] CRITICAL error stringifying trailing action payload:', err, this.pendingAction);
                }
                this.pendingAction = null;
              }
            }, this.throttleMs);
          }
        } else {
          console.log('[Collaboration] Transmitting instant action:', action.actionType);
          this.lastActionSendTime = now;
          try {
            const payload = JSON.stringify(action);
            console.log('[Collaboration] Transmitting instant over WS:', payload);
            this.ws.send(payload);
          } catch (err) {
            console.error('[Collaboration] CRITICAL error stringifying instant action payload:', err, action);
          }
        }
      }
    }
  }

  private _handleMessage(message: any) {
    console.log('[Collaboration] Received WS event:', message.type, message);

    if (message.type === 'history') {
      const history = message.payload || [];
      this._broadcastEvent(EVENTS.REMOTE_HISTORY, { history });
      return;
    }

    if (message.type === 'cursor') {
      this._broadcastEvent(EVENTS.REMOTE_CURSOR, { cursor: message });
      return;
    }

    // if it's camera sync, check follow mode
    if (message.type === 'sync' || message.type === 'action') {
      console.log(`[Collaboration] Processing Action ${message.actionType} | FollowerMode: ${this.followerMode}`);
      if (message.actionType === 'camera' && !this.followerMode) {
         console.log('[Collaboration] Ignoring camera sync due to Follower Mode OFF.');
         return;
      }
      
      console.log('[Collaboration] Directly invoking _applyRemoteAction bypass', message.actionType);
      this._applyRemoteAction(message);
    }
  }
}

export default CollaborationService;
