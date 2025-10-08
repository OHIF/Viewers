// commandsModule.js (drop-in replacement for your extension)
import OHIF from '@ohif/core';
import * as cs from '@cornerstonejs/core';
import * as csTools from '@cornerstonejs/tools';
import { useViewportGridStore } from '../../../extensions/default/src/stores/useViewportGridStore';
import { useViewportsByPositionStore } from '../../../extensions/default/src/stores/useViewportsByPositionStore';
import requestDisplaySetCreationForStudy from '../../../extensions/default/src/Panels/requestDisplaySetCreationForStudy';
import { ctMipProtocol } from './getHangingProtocolModule';
import React from 'react';
import { Enums } from '@cornerstonejs/tools';

export default function commandsModuleFactory({
  servicesManager,
  commandsManager,
  extensionManager,
} = {}) {
  const {
    viewportGridService,
    uiNotificationService,
    displaySetService,
    toolGroupService,
    cornerstoneViewportService,
    hangingProtocolService,
  } = servicesManager.services;

  // Near top of commands module (module closure)
  let _previousLayoutSnapshot = null;

  /**
   * Build a compact snapshot of the viewport grid state that we can use to restore later.
   * We capture: layout (numRows,numCols), and for each viewport: viewportId, viewportOptions, displaySetInstanceUIDs, displaySetOptions (if present).
   */
  function _captureViewportGridSnapshot() {
    try {
      const gridState = viewportGridService.getState?.() || {};
      const layout = gridState.layout || {};
      const viewports = gridState.viewports || {};

      const snapshot = {
        layout: {
          numRows: layout.numRows,
          numCols: layout.numCols,
          isHangingProtocolLayout: layout.isHangingProtocolLayout || false,
        },
        // For each viewport capture viewportId, displaySetInstanceUIDs array, and viewportOptions
        viewports: Object.keys(viewports).map(vpId => {
          const vp = viewports[vpId] || {};
          const dsIds =
            (vp.displaySets &&
              vp.displaySets.map(d => d.displaySetInstanceUID ?? d.id ?? d.seriesInstanceUID)) ||
            [];
          return {
            viewportId: vpId,
            displaySetInstanceUIDs: dsIds,
            // capture only a shallow copy of viewport options (avoid functions/huge objects)
            viewportOptions: vp.viewportOptions ? { ...vp.viewportOptions } : {},
          };
        }),
        timestamp: Date.now(),
      };

      return snapshot;
    } catch (e) {
      console.warn('_captureViewportGridSnapshot failed', e);
      return null;
    }
  }

  /**
   * Restore a previously captured snapshot.
   */
  async function _restoreViewportGridSnapshot(snapshot) {
    if (!snapshot) return false;
    try {
      const { layout, viewports } = snapshot;

      // 1) set layout first (if we have it)
      if (layout && (layout.numRows || layout.numCols)) {
        await commandsManager.run?.('setViewportGridLayout', {
          numRows: layout.numRows,
          numCols: layout.numCols,
          isHangingProtocolLayout: false,
        });
        // give layout a moment to settle
        await new Promise(r => setTimeout(r, 200));
      }

      // 2) Build viewportsToUpdate: only the properties the reducer expects
      const viewportsToUpdate = viewports.map(v => ({
        viewportId: v.viewportId,
        displaySetInstanceUIDs: Array.isArray(v.displaySetInstanceUIDs)
          ? v.displaySetInstanceUIDs
          : [],
        viewportOptions: v.viewportOptions || {},
      }));

      // 3) Call the command that the app expects
      if (viewportsToUpdate.length) {
        try {
          await commandsManager.run('setDisplaySetsForViewports', { viewportsToUpdate });
          // After conversion attempt succeeded, ensure the viewport has a single tool group: mipToolGroup
          try {
            _ensureViewportInOnlyOneGroup(viewportId, 'mipToolGroup');
          } catch (e) {}
        } catch (e) {
          // fallback: try per-viewport API (older shapes) - use only ids
          for (const vp of viewportsToUpdate) {
            try {
              await viewportGridService.setViewportDisplaySets?.(
                vp.viewportId,
                vp.displaySetInstanceUIDs.map(id => ({ id }))
              );
              if (vp.viewportOptions) {
                await viewportGridService.setViewportOptions?.(vp.viewportId, vp.viewportOptions);
              }
            } catch (err) {
              /* swallow fallback errors */
            }
          }
        }
      }

      // 4) small delay then repair stack scrolling on any stack viewports
      await new Promise(r => setTimeout(r, 180));
      const allIds =
        cornerstoneViewportService.getViewportIds?.() ||
        Object.keys((viewportGridService.getState?.() || {}).viewports || {});
      for (const id of allIds) {
        const wrapper = cornerstoneViewportService.getCornerstoneViewport?.(id);
        const type = wrapper?.type || '';
        if (!String(type).toLowerCase().includes('volume')) {
          // ensure stack scroll / tools are active so scrolling works immediately
          try {
            await repairStackScrollForViewport(id);
          } catch (e) {}
        }
      }

      return true;
    } catch (e) {
      console.warn('_restoreViewportGridSnapshot failed', e);
      return false;
    }
  }

  // -------------------- HELPERS (must be declared BEFORE actions) --------------------

  // Wait for a Cornerstone wrapper to exist for a viewportId (used by toggleMip)
  async function waitForCornerstoneWrapper(viewportId, { timeout = 6000, interval = 200 } = {}) {
    if (!viewportId) return null;
    const start = Date.now();
    let curInterval = interval;
    while (Date.now() - start < timeout) {
      try {
        const wrapper = cornerstoneViewportService.getCornerstoneViewport?.(viewportId);
        if (wrapper) return wrapper;
      } catch (e) {
        // ignore transient errors
      }
      // eslint-disable-next-line no-await-in-loop
      await new Promise(r => setTimeout(r, curInterval));
      curInterval = Math.min(800, Math.round(curInterval * 1.4));
    }
    return null;
  }
  // ---------------------- Tool-group helpers (defensive) ----------------------

  // Return a tool group object or null (supports various toolGroupService shapes)
  function _getToolGroup(toolGroupId) {
    try {
      if (!toolGroupService) return null;
      if (typeof toolGroupService.getToolGroup === 'function') {
        return toolGroupService.getToolGroup(toolGroupId) || null;
      }
      if (typeof toolGroupService.getToolGroups === 'function') {
        const all = toolGroupService.getToolGroups();
        return all?.[toolGroupId] ?? null;
      }
      // some services expose a map
      if (toolGroupService.toolGroups && toolGroupService.toolGroups[toolGroupId]) {
        return toolGroupService.toolGroups[toolGroupId];
      }
    } catch (e) {}
    return null;
  }

  // Get an array of tool group ids that currently contain this viewportId
  function _getToolGroupsContainingViewport(viewportId) {
    const result = [];
    try {
      if (!toolGroupService) return result;

      // 1) try getToolGroups() -> iterate
      if (typeof toolGroupService.getToolGroups === 'function') {
        const all = toolGroupService.getToolGroups() || {};
        for (const id of Object.keys(all)) {
          try {
            const tg = all[id];
            // various shapes: tg.getViewportIds(), tg.viewports, tg.viewportIds
            if (typeof tg.getViewportIds === 'function') {
              if ((tg.getViewportIds() || []).includes(viewportId)) result.push(id);
            } else if (Array.isArray(tg.viewportIds) && tg.viewportIds.includes(viewportId)) {
              result.push(id);
            } else if (Array.isArray(tg.viewports) && tg.viewports.includes(viewportId)) {
              result.push(id);
            } else if (tg.getViewportIds && Array.isArray(tg.getViewportIds)) {
              if (tg.getViewportIds.includes(viewportId)) result.push(id);
            }
          } catch (e) {}
        }
        return result;
      }

      // 2) try known API: toolGroupService.getToolGroupNames && toolGroupService.getToolGroup
      if (typeof toolGroupService.getToolGroupNames === 'function') {
        const names = toolGroupService.getToolGroupNames() || [];
        for (const id of names) {
          try {
            const tg = toolGroupService.getToolGroup(id);
            if (!tg) continue;
            if (typeof tg.getViewportIds === 'function') {
              if ((tg.getViewportIds() || []).includes(viewportId)) result.push(id);
            } else if (Array.isArray(tg.viewportIds) && tg.viewportIds.includes(viewportId)) {
              result.push(id);
            }
          } catch (e) {}
        }
        return result;
      }

      // 3) If service exposes each tool group by id property (best-effort)
      if (toolGroupService.getToolGroup && typeof toolGroupService.getToolGroup === 'function') {
        // we already handled single get above; as fallback try to enumerate a known list (not available)
      }
    } catch (e) {}
    return result;
  }

  // Remove viewportId from the named toolGroup if present
  function _removeViewportFromToolGroup(toolGroupId, viewportId) {
    try {
      if (!toolGroupService) return false;
      const tg = _getToolGroup(toolGroupId);
      if (!tg) return false;

      // try several common methods
      if (typeof tg.removeViewport === 'function') {
        tg.removeViewport(viewportId);
        return true;
      }
      if (typeof toolGroupService.removeViewport === 'function') {
        toolGroupService.removeViewport(toolGroupId, viewportId);
        return true;
      }
      if (typeof toolGroupService.removeViewports === 'function') {
        toolGroupService.removeViewports(toolGroupId, [viewportId]);
        return true;
      }
      // If tg has an array property we can mutate (best-effort)
      if (Array.isArray(tg.viewportIds)) {
        const i = tg.viewportIds.indexOf(viewportId);
        if (i >= 0) {
          tg.viewportIds.splice(i, 1);
          return true;
        }
      }
    } catch (e) {}
    return false;
  }

  // Add viewportId to toolGroupId only if not already in it; ensure toolGroup exists
  function _addViewportToToolGroup(toolGroupId, viewportId) {
    try {
      if (!toolGroupService) return false;

      // create group only if needed (defensive)
      try {
        if (typeof toolGroupService.getToolGroup === 'function') {
          if (!toolGroupService.getToolGroup(toolGroupId)) {
            if (typeof toolGroupService.createToolGroup === 'function') {
              toolGroupService.createToolGroup(toolGroupId);
            } else if (typeof toolGroupService.create === 'function') {
              toolGroupService.create(toolGroupId);
            }
          }
        } else if (typeof toolGroupService.getToolGroups === 'function') {
          const all = toolGroupService.getToolGroups() || {};
          if (!all[toolGroupId]) {
            if (typeof toolGroupService.createToolGroup === 'function') {
              toolGroupService.createToolGroup(toolGroupId);
            } else if (typeof toolGroupService.create === 'function') {
              toolGroupService.create(toolGroupId);
            }
          }
        }
      } catch (e) {
        // ignore creation errors (might already exist)
      }

      // Ensure viewport is not already in the group
      const tg = _getToolGroup(toolGroupId);
      if (tg) {
        // check common shapes
        if (typeof tg.getViewportIds === 'function') {
          if ((tg.getViewportIds() || []).includes(viewportId)) return true;
        } else if (Array.isArray(tg.viewportIds) && tg.viewportIds.includes(viewportId)) {
          return true;
        } else if (Array.isArray(tg.viewports) && tg.viewports.includes(viewportId)) {
          return true;
        }
      }

      // Try various add APIs
      if (typeof toolGroupService.addViewport === 'function') {
        // some signatures: addViewport(viewportId, toolGroupId) or addViewport(toolGroupId, viewportId)
        try {
          toolGroupService.addViewport(viewportId, toolGroupId);
        } catch (e) {
          try {
            toolGroupService.addViewport(toolGroupId, viewportId);
          } catch (e2) {}
        }
        return true;
      }
      if (typeof toolGroupService.addViewports === 'function') {
        try {
          toolGroupService.addViewports(toolGroupId, [viewportId]);
        } catch (e) {
          try {
            toolGroupService.addViewports([viewportId], toolGroupId);
          } catch (e2) {}
        }
        return true;
      }
      if (typeof toolGroupService.attachViewport === 'function') {
        try {
          toolGroupService.attachViewport(toolGroupId, viewportId);
          return true;
        } catch (e) {
          try {
            toolGroupService.attachViewport(viewportId, toolGroupId);
            return true;
          } catch (e2) {}
        }
      }
      // last resort: mutate tg arrays if writable
      if (tg) {
        if (Array.isArray(tg.viewportIds)) {
          tg.viewportIds.push(viewportId);
          return true;
        }
        if (Array.isArray(tg.viewports)) {
          tg.viewports.push(viewportId);
          return true;
        }
      }
    } catch (e) {}
    return false;
  }

  // Ensure this viewport is only in the desiredToolGroupId (remove it from any other groups)
  function _ensureViewportInOnlyOneGroup(viewportId, desiredToolGroupId) {
    try {
      const groups = _getToolGroupsContainingViewport(viewportId);
      for (const g of groups) {
        if (g !== desiredToolGroupId) {
          _removeViewportFromToolGroup(g, viewportId);
        }
      }
      // Finally add to desired (idempotent)
      if (desiredToolGroupId) {
        _addViewportToToolGroup(desiredToolGroupId, viewportId);
      }
    } catch (e) {}
  }

  // Ensure volume cached for a displaySetId (returns true if volume exists in cache)
  async function ensureVolumeCachedForDisplaySet(
    displaySetId,
    { timeoutMs = 10000, intervalMs = 300 } = {}
  ) {
    if (!displaySetId) return false;
    const allDS = displaySetService.getDisplaySets?.() || displaySetService.activeDisplaySets || [];
    const ds = allDS.find(
      d => (d.displaySetInstanceUID ?? d.id ?? d.seriesInstanceUID) === displaySetId
    );
    if (!ds) return false;

    const firstImageId = ds.imageIds?.[0] || ds.images?.[0]?.imageId || null;
    if (!firstImageId) return false;

    // Try to trigger creation if the app provides that helper
    try {
      const studyUID = ds.studyInstanceUID || ds.metadata?.StudyInstanceUID || null;
      if (typeof requestDisplaySetCreationForStudy === 'function' && studyUID) {
        try {
          requestDisplaySetCreationForStudy(studyUID);
        } catch (e) {}
      }
    } catch (e) {}

    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const volInfo = cs.cache.getVolumeContainingImageId?.(firstImageId);
      if (volInfo && volInfo.volume) return true;
      // eslint-disable-next-line no-await-in-loop
      await new Promise(r => setTimeout(r, intervalMs));
    }
    return false;
  }

  // Defensive: re-attach viewport to ctToolGroup and activate StackScroll tool
  async function repairStackScrollForViewport(viewportId) {
    if (!viewportId || !toolGroupService) return false;

    const stackScrollName = csTools.StackScrollTool?.toolName || 'StackScrollTool';
    try {
      // ensure group exists
      try {
        if (typeof toolGroupService.createToolGroup === 'function') {
          // toolGroupService.createToolGroup('ctToolGroup');
          if (!_getToolGroup('ctToolGroup')) {
            toolGroupService.createToolGroup('ctToolGroup');
          }
        } else if (typeof toolGroupService.create === 'function') {
          // toolGroupService.create('ctToolGroup');
          if (!_getToolGroup('ctToolGroup')) {
            toolGroupService.create('ctToolGroup');
          }
        }
      } catch (e) {}

      // Ensure the viewport is only in ctToolGroup (remove it from other groups)
      _ensureViewportInOnlyOneGroup(viewportId, 'ctToolGroup');

      // attach viewport to group - try common API shapes
      try {
        if (typeof toolGroupService.addViewport === 'function') {
          // common signature addViewport(viewportId, toolGroupId)
          try {
            toolGroupService.addViewport(viewportId, 'ctToolGroup');
          } catch (e) {
            // sometimes flipped
            try {
              toolGroupService.addViewport('ctToolGroup', viewportId);
            } catch (e2) {}
          }
        } else if (typeof toolGroupService.addViewports === 'function') {
          try {
            toolGroupService.addViewports('ctToolGroup', [viewportId]);
          } catch (e) {}
        } else if (typeof toolGroupService.addViewportToGroup === 'function') {
          try {
            toolGroupService.addViewportToGroup('ctToolGroup', viewportId);
          } catch (e) {}
        } else if (typeof toolGroupService.attachViewport === 'function') {
          try {
            toolGroupService.attachViewport('ctToolGroup', viewportId);
          } catch (e) {}
        } else if (typeof toolGroupService.getToolGroup === 'function') {
          const tg = toolGroupService.getToolGroup('ctToolGroup');
          if (tg && typeof tg.addViewport === 'function') {
            try {
              tg.addViewport(viewportId);
            } catch (e) {}
          }
        }
      } catch (e) {}

      // add tool if missing (defensive: only if not present)
      if (stackScrollName) {
        try {
          const tg = _getToolGroup('ctToolGroup');
          // Defensive: only add tool if it doesn't appear to be present
          let shouldAdd = true;
          try {
            if (tg) {
              if (typeof tg.getToolNames === 'function') {
                shouldAdd = !(tg.getToolNames() || []).includes(stackScrollName);
              } else if (Array.isArray(tg.tools)) {
                shouldAdd = !tg.tools.includes(stackScrollName);
              }
            }
          } catch (e) {}

          if (shouldAdd) {
            if (typeof toolGroupService.addTool === 'function') {
              try {
                toolGroupService.addTool('ctToolGroup', stackScrollName);
              } catch (e) {
                try {
                  toolGroupService.addTool(stackScrollName, 'ctToolGroup');
                } catch (e2) {}
              }
            } else if (typeof toolGroupService.addToolToGroup === 'function') {
              try {
                toolGroupService.addToolToGroup('ctToolGroup', stackScrollName);
              } catch (e) {}
            } else if (typeof toolGroupService.registerTool === 'function') {
              try {
                toolGroupService.registerTool(stackScrollName);
              } catch (e) {}
            }
          }
        } catch (e) {}
      }

      // set active
      try {
        if (typeof toolGroupService.setToolActive === 'function') {
          try {
            toolGroupService.setToolActive('ctToolGroup', stackScrollName, {
              bindings: [{ mouseButton: Enums.MouseBindings.Primary }],
            });
          } catch (e) {
            try {
              toolGroupService.setToolActive(stackScrollName, {
                bindings: [{ mouseButton: Enums.MouseBindings.Primary }],
              });
            } catch (e2) {}
          }
        } else if (typeof toolGroupService.activateTool === 'function') {
          try {
            toolGroupService.activateTool('ctToolGroup', stackScrollName, {
              bindings: [{ mouseButton: Enums.MouseBindings.Primary }],
            });
          } catch (e) {}
        }
      } catch (e) {}

      // small nudge: render viewport wrapper if present
      try {
        const wrapper = cornerstoneViewportService.getCornerstoneViewport?.(viewportId);
        if (wrapper) {
          if (typeof wrapper.render === 'function') wrapper.render();
          else if (wrapper.viewport && typeof wrapper.viewport.render === 'function')
            wrapper.viewport.render();
        }
      } catch (e) {}

      return true;
    } catch (err) {
      console.warn('repairStackScrollForViewport failed', err);
      return false;
    }
  }

  // Wait for HP to become active (optional helper used earlier)
  async function waitForHangingProtocolActive(
    protocolId,
    { timeoutMs = 4000, intervalMs = 200 } = {}
  ) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      try {
        const hpState = hangingProtocolService.getState?.() || {};
        const active =
          hpState.activeProtocol ||
          hpState.activeHp ||
          hpState.activeProtocolId ||
          hpState.protocolId;
        if (!active) {
          const activeObj =
            typeof hangingProtocolService.getActiveProtocol === 'function'
              ? hangingProtocolService.getActiveProtocol()
              : null;
          if (activeObj && (activeObj.id === protocolId || activeObj.name === protocolId))
            return true;
        } else {
          if (active === protocolId) return true;
        }
      } catch (e) {}
      // eslint-disable-next-line no-await-in-loop
      await new Promise(r => setTimeout(r, intervalMs));
    }
    return false;
  }

  // -------------------- ACTIONS --------------------
  const actions = {
    // inside actions { ... }
    saveCurrentViewportSnapshot: () => {
      _previousLayoutSnapshot = _captureViewportGridSnapshot();
      return _previousLayoutSnapshot;
    },

    restorePreviousViewportSnapshot: async () => {
      if (!_previousLayoutSnapshot) {
        uiNotificationService?.warn?.('No previous layout snapshot available to restore.');
        return false;
      }
      const ok = await _restoreViewportGridSnapshot(_previousLayoutSnapshot);
      if (ok) _previousLayoutSnapshot = null;
      return ok;
    },

    toggleMip: async ({
      viewportId: explicitViewportId,
      slabThickness = 'fullVolume',
      displaySetId,
    } = {}) => {
      console.group('mip.toggle');
      try {
        const state = viewportGridService.getState?.() || {};
        let viewportId = explicitViewportId || state.activeViewportId || null;

        // gather ids fallback
        let allIds = [];
        try {
          allIds =
            cornerstoneViewportService.getViewportIds?.() || Object.keys(state.viewports || {});
        } catch (e) {
          allIds = Object.keys(state.viewports || {});
        }

        if (!viewportId && allIds.length) {
          // prefer first volume viewport, else first available
          let fallback = allIds[0];
          for (const id of allIds) {
            try {
              const info = cornerstoneViewportService.getViewportInfo?.(id) ?? {};
              const type =
                info.viewportOptions?.viewportType ||
                info.type ||
                (cornerstoneViewportService.getCornerstoneViewport?.(id)?.type ?? null);
              if (type && String(type).toLowerCase().includes('volume')) {
                viewportId = id;
                break;
              }
              fallback = fallback || id;
            } catch (e) {}
          }
          if (!viewportId) viewportId = fallback;
        }

        if (!viewportId) {
          uiNotificationService?.warn?.('No viewport candidate found to toggle MIP.');
          console.groupEnd();
          return;
        }

        // find CT displaySet if needed
        let ctDisplaySetId = displaySetId;
        if (!ctDisplaySetId) {
          const allDS =
            displaySetService.getDisplaySets?.() || displaySetService.activeDisplaySets || [];
          const candidate = allDS.find(ds => {
            if (ds.Modality !== 'CT') return false;
            const firstImg = ds.imageIds?.[0] || ds.images?.[0]?.imageId;
            if (!firstImg) return true;
            const volInfo = cs.cache.getVolumeContainingImageId?.(firstImg);
            return !!(volInfo && volInfo.volume);
          });
          if (candidate)
            ctDisplaySetId =
              candidate.displaySetInstanceUID ?? candidate.id ?? candidate.seriesInstanceUID;
        }

        if (!ctDisplaySetId) {
          uiNotificationService?.error?.(
            'No CT display set available (with cached volume). Cannot create MIP view.'
          );
          console.groupEnd();
          return;
        }

        // check existing wrapper
        const existingWrapper =
          cornerstoneViewportService.getCornerstoneViewport?.(viewportId) ?? null;
        if (
          existingWrapper &&
          String(existingWrapper.type || '')
            .toLowerCase()
            .includes('volume')
        ) {
          const wrapper = existingWrapper;
          const currentOptions =
            typeof wrapper.getOptions === 'function'
              ? wrapper.getOptions() || {}
              : wrapper.options || {};
          const currentBlend = currentOptions?.blendMode ?? currentOptions?.blend ?? null;
          const isMIP = ['MIP', 'MAXIMUM_INTENSITY_BLEND', 'MAXIMUM_INTENSITY'].includes(
            String(currentBlend)
          );
          const newBlend = isMIP ? 'COMPOSITE' : 'MAXIMUM_INTENSITY_BLEND';
          const newSlab = isMIP ? undefined : slabThickness;

          try {
            if (typeof wrapper.setOptions === 'function') {
              const next = { ...currentOptions, blendMode: newBlend };
              if (newSlab !== undefined) next.slabThickness = newSlab;
              await wrapper.setOptions(next, true);
            } else {
              if (typeof wrapper.setBlendMode === 'function') wrapper.setBlendMode(newBlend);
              if (newSlab !== undefined && typeof wrapper.setSlabThickness === 'function')
                wrapper.setSlabThickness(newSlab);
            }
            if (typeof wrapper.render === 'function') wrapper.render();
          } catch (e) {
            console.warn('toggling existing volume failed', e);
          }

          // After toggling, repair stack scroll on any stack viewport
          try {
            // find a stack viewport (first one) and repair it
            for (const id of allIds) {
              const w = cornerstoneViewportService.getCornerstoneViewport?.(id);
              const type = w?.type || null;
              if (
                String(type).toLowerCase().includes('stack') ||
                String(type).toLowerCase().includes('stack')
              ) {
                repairStackScrollForViewport(id);
                break;
              }
            }
          } catch (e) {}

          console.groupEnd();
          return;
        }

        // no wrapper or not volume -> request conversion via setDisplaySetsForViewports
        const dsId = ctDisplaySetId;
        const viewportsToUpdate = [
          {
            viewportId,
            displaySetInstanceUIDs: [dsId],
            viewportOptions: { viewportType: 'volume', toolGroupId: 'mipToolGroup' },
            // displaySetOptions must be an array of { id, options } (not an object keyed by id)
            // displaySetOptions: [
            //   { id: dsId, options: { blendMode: 'MAXIMUM_INTENSITY_BLEND', slabThickness } },
            // ],
          },
        ];

        try {
          await commandsManager.run('setDisplaySetsForViewports', { viewportsToUpdate });
          // After conversion attempt succeeded, ensure the viewport has a single tool group: mipToolGroup
          try {
            _ensureViewportInOnlyOneGroup(viewportId, 'mipToolGroup');
          } catch (e) {}
        } catch (e) {
          // fallback per-app
          try {
            await viewportGridService.setViewportDisplaySets?.(viewportId, [
              { id: dsId, options: { blendMode: 'MAXIMUM_INTENSITY_BLEND', slabThickness } },
            ]);
            await viewportGridService.setViewportOptions?.(viewportId, {
              viewportType: 'volume',
              toolGroupId: 'mipToolGroup',
            });
          } catch (err) {
            console.warn('request to convert viewport to volume failed', err);
          }
        }

        // wait for wrapper and set options (post-conversion)
        const wrapper = await waitForCornerstoneWrapper(viewportId, {
          timeout: 6000,
          interval: 250,
        });
        if (wrapper) {
          try {
            if (typeof wrapper.setOptions === 'function') {
              await wrapper.setOptions(
                { blendMode: 'MAXIMUM_INTENSITY_BLEND', slabThickness },
                true
              );
            } else {
              if (typeof wrapper.setBlendMode === 'function')
                wrapper.setBlendMode('MAXIMUM_INTENSITY_BLEND');
              if (typeof wrapper.setSlabThickness === 'function')
                wrapper.setSlabThickness(slabThickness);
            }
            if (typeof wrapper.render === 'function') wrapper.render();
          } catch (e) {
            console.warn('post-conversion setOptions failed', e);
          }
        } else {
          uiNotificationService?.warn?.(
            'MIP requested but the volume wrapper was not initialized yet.'
          );
        }

        // attempt to repair any stack viewport's tools so scrolling still works
        try {
          for (const id of allIds) {
            const w = cornerstoneViewportService.getCornerstoneViewport?.(id);
            const type = w?.type || '';
            if (!String(type).toLowerCase().includes('volume')) {
              repairStackScrollForViewport(id);
            }
          }
        } catch (e) {}

        console.groupEnd();
        return;
      } catch (err) {
        console.error('toggleMip action error:', err);
        console.groupEnd();
        throw err;
      }
    },

    setMIPLayoutAndToggle: async ({ slabThickness = 'fullVolume', viewportIds = [] } = {}) => {
      try {
        // get study UID
        // at top of setMIPLayoutAndToggle, before making changes:
        _previousLayoutSnapshot = _captureViewportGridSnapshot();

        const hpState = hangingProtocolService.getState?.() || {};
        const studyUIDFromHP = hpState.activeStudyUID || hpState.studyInstanceUID || null;
        const allDS =
          displaySetService.getDisplaySets?.() || displaySetService.activeDisplaySets || [];
        const fallbackStudyUID = allDS?.[0]?.studyInstanceUID || null;
        const studyUID = studyUIDFromHP || fallbackStudyUID;
        if (!studyUID) {
          uiNotificationService?.error?.('No study UID available.');
          return;
        }

        // activate HP (if desired); non-fatal
        try {
          await commandsManager.run?.('setHangingProtocol', {
            activeStudyUID: studyUID,
            protocolId: ctMipProtocol.id,
            reset: true,
          });
        } catch (e) {}

        // wait short while for HP to match (non-fatal)
        await waitForHangingProtocolActive(ctMipProtocol.id, { timeoutMs: 2500 }).catch(() => null);

        // set 1x2 layout
        await commandsManager.run?.('setViewportGridLayout', {
          numRows: 1,
          numCols: 2,
          isHangingProtocolLayout: false,
        });

        // pick CT display set
        const ctList = allDS
          .filter(ds => ds.Modality === 'CT')
          .map(ds => ds.displaySetInstanceUID ?? ds.id ?? ds.seriesInstanceUID);
        if (!ctList.length) {
          uiNotificationService?.error?.('No CT display sets found to populate MIP viewports.');
          return;
        }
        const ctDsId = ctList[0];

        // compute target viewportIds
        const positions = Object.keys(
          useViewportsByPositionStore.getState().viewportsByPosition || {}
        ).sort();
        const targetViewportIds =
          viewportIds && viewportIds.length
            ? viewportIds
            : positions
                .map(p => useViewportsByPositionStore.getState().viewportsByPosition[p].viewportId)
                .filter(Boolean);
        const [leftVpId, rightVpId] = targetViewportIds;
        if (!leftVpId || !rightVpId) {
          uiNotificationService?.error?.('Could not determine viewport ids for MIP layout.');
          return;
        }

        // build updates (left = stack for scrolling; right = volume MIP)
        const leftUpdate = {
          viewportId: leftVpId,
          displaySetInstanceUIDs: [ctDsId],
          viewportOptions: {
            viewportType: 'stack',
            toolGroupId: 'ctToolGroup',
            orientation: 'axial',
            allowUnmatchedView: true,
          },
        };
        const rightUpdate = {
          viewportId: rightVpId,
          displaySetInstanceUIDs: [ctDsId],
          viewportOptions: {
            viewportType: 'volume',
            toolGroupId: 'mipToolGroup',
            orientation: 'sagittal',
            allowUnmatchedView: true,
          },
          // displaySetOptions: [
          //   { id: ctDsId, options: { blendMode: 'MAXIMUM_INTENSITY_BLEND', slabThickness } },
          // ],
        };

        // ensure that target right viewport isn't already bound to other groups
        _tryEnsureViewport = true;
        try {
          // target viewport id may not yet be present; do this after layout settle as well
          setTimeout(() => {
            try {
              _ensureViewportInOnlyOneGroup(rightVpId, 'mipToolGroup');
            } catch (e) {}
          }, 150);
        } catch (e) {}

        try {
          await commandsManager.run('setDisplaySetsForViewports', {
            viewportsToUpdate: [leftUpdate, rightUpdate].filter(u => u.viewportId),
          });
          // After conversion attempt succeeded, ensure the viewport has a single tool group: mipToolGroup
        } catch (e) {
          console.warn('setDisplaySetsForViewports failed:', e);
        }

        // ensure volume cached for the right viewport (best-effort)
        await ensureVolumeCachedForDisplaySet(ctDsId).catch(() => null);

        // ensure stack scroll active on left group (best-effort)
        const stackScrollName = csTools.StackScrollTool?.toolName;
        if (stackScrollName) {
          try {
            if (typeof toolGroupService.setToolActive === 'function') {
              try {
                toolGroupService.setToolActive('ctToolGroup', stackScrollName, {
                  bindings: [{ mouseButton: Enums.MouseBindings.Primary }],
                });
              } catch (e) {
                try {
                  toolGroupService.setToolActive(stackScrollName, {
                    bindings: [{ mouseButton: Enums.MouseBindings.Primary }],
                  });
                } catch (e2) {}
              }
            }
          } catch (e) {
            /* non-fatal */
          }
        }

        // final toggle for right viewport (lightweight: uses waitForCornerstoneWrapper)
        setTimeout(async () => {
          try {
            await commandsManager.run('mip.toggle', {
              viewportId: rightVpId,
              slabThickness,
              displaySetId: ctDsId,
            });
            // after toggle, repair left scroll just in case
            repairStackScrollForViewport(leftVpId);
          } catch (e) {
            console.warn('post-layout mip.toggle failed', e);
            // try to repair left anyway
            repairStackScrollForViewport(leftVpId);
          }
        }, 300);
      } catch (err) {
        console.error('setMIPLayoutAndToggle error:', err);
        throw err;
      }
    },

    // New action: disable MIP, remove HP if possible, and restore grid to 1x1 (or restore snapshot)
    disableMip: async () => {
      try {
        // cleanup: remove any mip tool group associations first (best-effort)
        try {
          const allIds =
            cornerstoneViewportService.getViewportIds?.() ||
            Object.keys((viewportGridService.getState?.() || {}).viewports || {});
          for (const id of allIds) {
            // if viewportId looks like one of the MIP viewport ids used in your hp -> remove
            // (adjust pattern if you use different IDs)
            if (String(id).toLowerCase().includes('mip') || id === 'mipSAGITTAL_CT') {
              _removeViewportFromToolGroup('mipToolGroup', id);
            }
          }
        } catch (e) {}

        // 1) Try to clear the hanging protocol (best-effort)
        try {
          // Preferred: via the commandsManager (app-level)
          await commandsManager.run?.('setHangingProtocol', {
            protocolId: 'default',
            reset: true,
          });
        } catch (e1) {
          // Fallbacks: try service-level APIs
          try {
            if (hangingProtocolService && typeof hangingProtocolService.setState === 'function') {
              // best-effort: set active protocol to null
              hangingProtocolService.setState({ activeProtocolId: null });
            } else if (
              hangingProtocolService &&
              typeof hangingProtocolService.getState === 'function' &&
              typeof hangingProtocolService.getState === 'object'
            ) {
              // If there's no setter, try to call a reset method
              if (typeof hangingProtocolService.reset === 'function') {
                hangingProtocolService.reset();
              }
            }
          } catch (e2) {
            // ignore — it's non-fatal
          }
        }

        // 2) Restore previous snapshot if we saved one earlier
        if (_previousLayoutSnapshot) {
          await _restoreViewportGridSnapshot(_previousLayoutSnapshot);
          _previousLayoutSnapshot = null;
        } else {
          // If no snapshot, force 1x1 layout as requested
          try {
            await commandsManager.run?.('setViewportGridLayout', {
              numRows: 1,
              numCols: 1,
              isHangingProtocolLayout: false,
            });
          } catch (e3) {
            // fallback to viewportGridService if command isn't available
            try {
              if (viewportGridService && typeof viewportGridService.setLayout === 'function') {
                viewportGridService.setLayout({ numRows: 1, numCols: 1 });
              }
            } catch (e4) {
              // last resort: ignore
            }
          }
        }

        // 3) small delay then try to repair stack scroll (best-effort)
        await new Promise(r => setTimeout(r, 150));
        try {
          const allIds =
            cornerstoneViewportService.getViewportIds?.() ||
            Object.keys((viewportGridService.getState?.() || {}).viewports || {});
          for (const id of allIds) {
            repairStackScrollForViewport(id);
          }
        } catch (e) {
          // non-fatal
        }

        return true;
      } catch (err) {
        console.warn('disableMip failed', err);
        return false;
      }
    },
  };

  const definitions = {
    'mip.toggle': { commandFn: actions.toggleMip },
    'mip.setMIPLayoutAndToggle': { commandFn: actions.setMIPLayoutAndToggle },
    'mip.saveSnapshot': { commandFn: actions.saveCurrentViewportSnapshot },
    'mip.restorePreviousLayout': { commandFn: actions.restorePreviousViewportSnapshot },
    'mip.disable': { commandFn: actions.disableMip },
  };

  return { actions, definitions, defaultContext: 'TMTV:CORNERSTONE' };
}
