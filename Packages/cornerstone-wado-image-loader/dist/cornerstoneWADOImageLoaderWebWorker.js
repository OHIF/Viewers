/*! cornerstone-wado-image-loader - 2.1.4 - 2018-11-15 | (c) 2016 Chris Hafey | https://github.com/cornerstonejs/cornerstoneWADOImageLoader */
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define("cornerstoneWADOImageLoaderWebWorker", [], factory);
	else if(typeof exports === 'object')
		exports["cornerstoneWADOImageLoaderWebWorker"] = factory();
	else
		root["cornerstoneWADOImageLoaderWebWorker"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	function hotDisposeChunk(chunkId) {
/******/ 		delete installedChunks[chunkId];
/******/ 	}
/******/ 	var parentHotUpdateCallback = this["webpackHotUpdate_name_"];
/******/ 	this["webpackHotUpdate_name_"] = // eslint-disable-next-line no-unused-vars
/******/ 	function webpackHotUpdateCallback(chunkId, moreModules) {
/******/ 		hotAddUpdateChunk(chunkId, moreModules);
/******/ 		if (parentHotUpdateCallback) parentHotUpdateCallback(chunkId, moreModules);
/******/ 	} ;
/******/
/******/ 	// eslint-disable-next-line no-unused-vars
/******/ 	function hotDownloadUpdateChunk(chunkId) {
/******/ 		var head = document.getElementsByTagName("head")[0];
/******/ 		var script = document.createElement("script");
/******/ 		script.charset = "utf-8";
/******/ 		script.src = __webpack_require__.p + "" + chunkId + "." + hotCurrentHash + ".hot-update.js";
/******/ 		;
/******/ 		head.appendChild(script);
/******/ 	}
/******/
/******/ 	// eslint-disable-next-line no-unused-vars
/******/ 	function hotDownloadManifest(requestTimeout) {
/******/ 		requestTimeout = requestTimeout || 10000;
/******/ 		return new Promise(function(resolve, reject) {
/******/ 			if (typeof XMLHttpRequest === "undefined") {
/******/ 				return reject(new Error("No browser support"));
/******/ 			}
/******/ 			try {
/******/ 				var request = new XMLHttpRequest();
/******/ 				var requestPath = __webpack_require__.p + "" + hotCurrentHash + ".hot-update.json";
/******/ 				request.open("GET", requestPath, true);
/******/ 				request.timeout = requestTimeout;
/******/ 				request.send(null);
/******/ 			} catch (err) {
/******/ 				return reject(err);
/******/ 			}
/******/ 			request.onreadystatechange = function() {
/******/ 				if (request.readyState !== 4) return;
/******/ 				if (request.status === 0) {
/******/ 					// timeout
/******/ 					reject(
/******/ 						new Error("Manifest request to " + requestPath + " timed out.")
/******/ 					);
/******/ 				} else if (request.status === 404) {
/******/ 					// no update available
/******/ 					resolve();
/******/ 				} else if (request.status !== 200 && request.status !== 304) {
/******/ 					// other failure
/******/ 					reject(new Error("Manifest request to " + requestPath + " failed."));
/******/ 				} else {
/******/ 					// success
/******/ 					try {
/******/ 						var update = JSON.parse(request.responseText);
/******/ 					} catch (e) {
/******/ 						reject(e);
/******/ 						return;
/******/ 					}
/******/ 					resolve(update);
/******/ 				}
/******/ 			};
/******/ 		});
/******/ 	}
/******/
/******/ 	var hotApplyOnUpdate = true;
/******/ 	// eslint-disable-next-line no-unused-vars
/******/ 	var hotCurrentHash = "cd60a1a7a1e69112f27a";
/******/ 	var hotRequestTimeout = 10000;
/******/ 	var hotCurrentModuleData = {};
/******/ 	var hotCurrentChildModule;
/******/ 	// eslint-disable-next-line no-unused-vars
/******/ 	var hotCurrentParents = [];
/******/ 	// eslint-disable-next-line no-unused-vars
/******/ 	var hotCurrentParentsTemp = [];
/******/
/******/ 	// eslint-disable-next-line no-unused-vars
/******/ 	function hotCreateRequire(moduleId) {
/******/ 		var me = installedModules[moduleId];
/******/ 		if (!me) return __webpack_require__;
/******/ 		var fn = function(request) {
/******/ 			if (me.hot.active) {
/******/ 				if (installedModules[request]) {
/******/ 					if (installedModules[request].parents.indexOf(moduleId) === -1) {
/******/ 						installedModules[request].parents.push(moduleId);
/******/ 					}
/******/ 				} else {
/******/ 					hotCurrentParents = [moduleId];
/******/ 					hotCurrentChildModule = request;
/******/ 				}
/******/ 				if (me.children.indexOf(request) === -1) {
/******/ 					me.children.push(request);
/******/ 				}
/******/ 			} else {
/******/ 				console.warn(
/******/ 					"[HMR] unexpected require(" +
/******/ 						request +
/******/ 						") from disposed module " +
/******/ 						moduleId
/******/ 				);
/******/ 				hotCurrentParents = [];
/******/ 			}
/******/ 			return __webpack_require__(request);
/******/ 		};
/******/ 		var ObjectFactory = function ObjectFactory(name) {
/******/ 			return {
/******/ 				configurable: true,
/******/ 				enumerable: true,
/******/ 				get: function() {
/******/ 					return __webpack_require__[name];
/******/ 				},
/******/ 				set: function(value) {
/******/ 					__webpack_require__[name] = value;
/******/ 				}
/******/ 			};
/******/ 		};
/******/ 		for (var name in __webpack_require__) {
/******/ 			if (
/******/ 				Object.prototype.hasOwnProperty.call(__webpack_require__, name) &&
/******/ 				name !== "e" &&
/******/ 				name !== "t"
/******/ 			) {
/******/ 				Object.defineProperty(fn, name, ObjectFactory(name));
/******/ 			}
/******/ 		}
/******/ 		fn.e = function(chunkId) {
/******/ 			if (hotStatus === "ready") hotSetStatus("prepare");
/******/ 			hotChunksLoading++;
/******/ 			return __webpack_require__.e(chunkId).then(finishChunkLoading, function(err) {
/******/ 				finishChunkLoading();
/******/ 				throw err;
/******/ 			});
/******/
/******/ 			function finishChunkLoading() {
/******/ 				hotChunksLoading--;
/******/ 				if (hotStatus === "prepare") {
/******/ 					if (!hotWaitingFilesMap[chunkId]) {
/******/ 						hotEnsureUpdateChunk(chunkId);
/******/ 					}
/******/ 					if (hotChunksLoading === 0 && hotWaitingFiles === 0) {
/******/ 						hotUpdateDownloaded();
/******/ 					}
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 		fn.t = function(value, mode) {
/******/ 			if (mode & 1) value = fn(value);
/******/ 			return __webpack_require__.t(value, mode & ~1);
/******/ 		};
/******/ 		return fn;
/******/ 	}
/******/
/******/ 	// eslint-disable-next-line no-unused-vars
/******/ 	function hotCreateModule(moduleId) {
/******/ 		var hot = {
/******/ 			// private stuff
/******/ 			_acceptedDependencies: {},
/******/ 			_declinedDependencies: {},
/******/ 			_selfAccepted: false,
/******/ 			_selfDeclined: false,
/******/ 			_disposeHandlers: [],
/******/ 			_main: hotCurrentChildModule !== moduleId,
/******/
/******/ 			// Module API
/******/ 			active: true,
/******/ 			accept: function(dep, callback) {
/******/ 				if (dep === undefined) hot._selfAccepted = true;
/******/ 				else if (typeof dep === "function") hot._selfAccepted = dep;
/******/ 				else if (typeof dep === "object")
/******/ 					for (var i = 0; i < dep.length; i++)
/******/ 						hot._acceptedDependencies[dep[i]] = callback || function() {};
/******/ 				else hot._acceptedDependencies[dep] = callback || function() {};
/******/ 			},
/******/ 			decline: function(dep) {
/******/ 				if (dep === undefined) hot._selfDeclined = true;
/******/ 				else if (typeof dep === "object")
/******/ 					for (var i = 0; i < dep.length; i++)
/******/ 						hot._declinedDependencies[dep[i]] = true;
/******/ 				else hot._declinedDependencies[dep] = true;
/******/ 			},
/******/ 			dispose: function(callback) {
/******/ 				hot._disposeHandlers.push(callback);
/******/ 			},
/******/ 			addDisposeHandler: function(callback) {
/******/ 				hot._disposeHandlers.push(callback);
/******/ 			},
/******/ 			removeDisposeHandler: function(callback) {
/******/ 				var idx = hot._disposeHandlers.indexOf(callback);
/******/ 				if (idx >= 0) hot._disposeHandlers.splice(idx, 1);
/******/ 			},
/******/
/******/ 			// Management API
/******/ 			check: hotCheck,
/******/ 			apply: hotApply,
/******/ 			status: function(l) {
/******/ 				if (!l) return hotStatus;
/******/ 				hotStatusHandlers.push(l);
/******/ 			},
/******/ 			addStatusHandler: function(l) {
/******/ 				hotStatusHandlers.push(l);
/******/ 			},
/******/ 			removeStatusHandler: function(l) {
/******/ 				var idx = hotStatusHandlers.indexOf(l);
/******/ 				if (idx >= 0) hotStatusHandlers.splice(idx, 1);
/******/ 			},
/******/
/******/ 			//inherit from previous dispose call
/******/ 			data: hotCurrentModuleData[moduleId]
/******/ 		};
/******/ 		hotCurrentChildModule = undefined;
/******/ 		return hot;
/******/ 	}
/******/
/******/ 	var hotStatusHandlers = [];
/******/ 	var hotStatus = "idle";
/******/
/******/ 	function hotSetStatus(newStatus) {
/******/ 		hotStatus = newStatus;
/******/ 		for (var i = 0; i < hotStatusHandlers.length; i++)
/******/ 			hotStatusHandlers[i].call(null, newStatus);
/******/ 	}
/******/
/******/ 	// while downloading
/******/ 	var hotWaitingFiles = 0;
/******/ 	var hotChunksLoading = 0;
/******/ 	var hotWaitingFilesMap = {};
/******/ 	var hotRequestedFilesMap = {};
/******/ 	var hotAvailableFilesMap = {};
/******/ 	var hotDeferred;
/******/
/******/ 	// The update info
/******/ 	var hotUpdate, hotUpdateNewHash;
/******/
/******/ 	function toModuleId(id) {
/******/ 		var isNumber = +id + "" === id;
/******/ 		return isNumber ? +id : id;
/******/ 	}
/******/
/******/ 	function hotCheck(apply) {
/******/ 		if (hotStatus !== "idle") {
/******/ 			throw new Error("check() is only allowed in idle status");
/******/ 		}
/******/ 		hotApplyOnUpdate = apply;
/******/ 		hotSetStatus("check");
/******/ 		return hotDownloadManifest(hotRequestTimeout).then(function(update) {
/******/ 			if (!update) {
/******/ 				hotSetStatus("idle");
/******/ 				return null;
/******/ 			}
/******/ 			hotRequestedFilesMap = {};
/******/ 			hotWaitingFilesMap = {};
/******/ 			hotAvailableFilesMap = update.c;
/******/ 			hotUpdateNewHash = update.h;
/******/
/******/ 			hotSetStatus("prepare");
/******/ 			var promise = new Promise(function(resolve, reject) {
/******/ 				hotDeferred = {
/******/ 					resolve: resolve,
/******/ 					reject: reject
/******/ 				};
/******/ 			});
/******/ 			hotUpdate = {};
/******/ 			var chunkId = "cornerstoneWADOImageLoaderWebWorker";
/******/ 			// eslint-disable-next-line no-lone-blocks
/******/ 			{
/******/ 				/*globals chunkId */
/******/ 				hotEnsureUpdateChunk(chunkId);
/******/ 			}
/******/ 			if (
/******/ 				hotStatus === "prepare" &&
/******/ 				hotChunksLoading === 0 &&
/******/ 				hotWaitingFiles === 0
/******/ 			) {
/******/ 				hotUpdateDownloaded();
/******/ 			}
/******/ 			return promise;
/******/ 		});
/******/ 	}
/******/
/******/ 	// eslint-disable-next-line no-unused-vars
/******/ 	function hotAddUpdateChunk(chunkId, moreModules) {
/******/ 		if (!hotAvailableFilesMap[chunkId] || !hotRequestedFilesMap[chunkId])
/******/ 			return;
/******/ 		hotRequestedFilesMap[chunkId] = false;
/******/ 		for (var moduleId in moreModules) {
/******/ 			if (Object.prototype.hasOwnProperty.call(moreModules, moduleId)) {
/******/ 				hotUpdate[moduleId] = moreModules[moduleId];
/******/ 			}
/******/ 		}
/******/ 		if (--hotWaitingFiles === 0 && hotChunksLoading === 0) {
/******/ 			hotUpdateDownloaded();
/******/ 		}
/******/ 	}
/******/
/******/ 	function hotEnsureUpdateChunk(chunkId) {
/******/ 		if (!hotAvailableFilesMap[chunkId]) {
/******/ 			hotWaitingFilesMap[chunkId] = true;
/******/ 		} else {
/******/ 			hotRequestedFilesMap[chunkId] = true;
/******/ 			hotWaitingFiles++;
/******/ 			hotDownloadUpdateChunk(chunkId);
/******/ 		}
/******/ 	}
/******/
/******/ 	function hotUpdateDownloaded() {
/******/ 		hotSetStatus("ready");
/******/ 		var deferred = hotDeferred;
/******/ 		hotDeferred = null;
/******/ 		if (!deferred) return;
/******/ 		if (hotApplyOnUpdate) {
/******/ 			// Wrap deferred object in Promise to mark it as a well-handled Promise to
/******/ 			// avoid triggering uncaught exception warning in Chrome.
/******/ 			// See https://bugs.chromium.org/p/chromium/issues/detail?id=465666
/******/ 			Promise.resolve()
/******/ 				.then(function() {
/******/ 					return hotApply(hotApplyOnUpdate);
/******/ 				})
/******/ 				.then(
/******/ 					function(result) {
/******/ 						deferred.resolve(result);
/******/ 					},
/******/ 					function(err) {
/******/ 						deferred.reject(err);
/******/ 					}
/******/ 				);
/******/ 		} else {
/******/ 			var outdatedModules = [];
/******/ 			for (var id in hotUpdate) {
/******/ 				if (Object.prototype.hasOwnProperty.call(hotUpdate, id)) {
/******/ 					outdatedModules.push(toModuleId(id));
/******/ 				}
/******/ 			}
/******/ 			deferred.resolve(outdatedModules);
/******/ 		}
/******/ 	}
/******/
/******/ 	function hotApply(options) {
/******/ 		if (hotStatus !== "ready")
/******/ 			throw new Error("apply() is only allowed in ready status");
/******/ 		options = options || {};
/******/
/******/ 		var cb;
/******/ 		var i;
/******/ 		var j;
/******/ 		var module;
/******/ 		var moduleId;
/******/
/******/ 		function getAffectedStuff(updateModuleId) {
/******/ 			var outdatedModules = [updateModuleId];
/******/ 			var outdatedDependencies = {};
/******/
/******/ 			var queue = outdatedModules.slice().map(function(id) {
/******/ 				return {
/******/ 					chain: [id],
/******/ 					id: id
/******/ 				};
/******/ 			});
/******/ 			while (queue.length > 0) {
/******/ 				var queueItem = queue.pop();
/******/ 				var moduleId = queueItem.id;
/******/ 				var chain = queueItem.chain;
/******/ 				module = installedModules[moduleId];
/******/ 				if (!module || module.hot._selfAccepted) continue;
/******/ 				if (module.hot._selfDeclined) {
/******/ 					return {
/******/ 						type: "self-declined",
/******/ 						chain: chain,
/******/ 						moduleId: moduleId
/******/ 					};
/******/ 				}
/******/ 				if (module.hot._main) {
/******/ 					return {
/******/ 						type: "unaccepted",
/******/ 						chain: chain,
/******/ 						moduleId: moduleId
/******/ 					};
/******/ 				}
/******/ 				for (var i = 0; i < module.parents.length; i++) {
/******/ 					var parentId = module.parents[i];
/******/ 					var parent = installedModules[parentId];
/******/ 					if (!parent) continue;
/******/ 					if (parent.hot._declinedDependencies[moduleId]) {
/******/ 						return {
/******/ 							type: "declined",
/******/ 							chain: chain.concat([parentId]),
/******/ 							moduleId: moduleId,
/******/ 							parentId: parentId
/******/ 						};
/******/ 					}
/******/ 					if (outdatedModules.indexOf(parentId) !== -1) continue;
/******/ 					if (parent.hot._acceptedDependencies[moduleId]) {
/******/ 						if (!outdatedDependencies[parentId])
/******/ 							outdatedDependencies[parentId] = [];
/******/ 						addAllToSet(outdatedDependencies[parentId], [moduleId]);
/******/ 						continue;
/******/ 					}
/******/ 					delete outdatedDependencies[parentId];
/******/ 					outdatedModules.push(parentId);
/******/ 					queue.push({
/******/ 						chain: chain.concat([parentId]),
/******/ 						id: parentId
/******/ 					});
/******/ 				}
/******/ 			}
/******/
/******/ 			return {
/******/ 				type: "accepted",
/******/ 				moduleId: updateModuleId,
/******/ 				outdatedModules: outdatedModules,
/******/ 				outdatedDependencies: outdatedDependencies
/******/ 			};
/******/ 		}
/******/
/******/ 		function addAllToSet(a, b) {
/******/ 			for (var i = 0; i < b.length; i++) {
/******/ 				var item = b[i];
/******/ 				if (a.indexOf(item) === -1) a.push(item);
/******/ 			}
/******/ 		}
/******/
/******/ 		// at begin all updates modules are outdated
/******/ 		// the "outdated" status can propagate to parents if they don't accept the children
/******/ 		var outdatedDependencies = {};
/******/ 		var outdatedModules = [];
/******/ 		var appliedUpdate = {};
/******/
/******/ 		var warnUnexpectedRequire = function warnUnexpectedRequire() {
/******/ 			console.warn(
/******/ 				"[HMR] unexpected require(" + result.moduleId + ") to disposed module"
/******/ 			);
/******/ 		};
/******/
/******/ 		for (var id in hotUpdate) {
/******/ 			if (Object.prototype.hasOwnProperty.call(hotUpdate, id)) {
/******/ 				moduleId = toModuleId(id);
/******/ 				/** @type {TODO} */
/******/ 				var result;
/******/ 				if (hotUpdate[id]) {
/******/ 					result = getAffectedStuff(moduleId);
/******/ 				} else {
/******/ 					result = {
/******/ 						type: "disposed",
/******/ 						moduleId: id
/******/ 					};
/******/ 				}
/******/ 				/** @type {Error|false} */
/******/ 				var abortError = false;
/******/ 				var doApply = false;
/******/ 				var doDispose = false;
/******/ 				var chainInfo = "";
/******/ 				if (result.chain) {
/******/ 					chainInfo = "\nUpdate propagation: " + result.chain.join(" -> ");
/******/ 				}
/******/ 				switch (result.type) {
/******/ 					case "self-declined":
/******/ 						if (options.onDeclined) options.onDeclined(result);
/******/ 						if (!options.ignoreDeclined)
/******/ 							abortError = new Error(
/******/ 								"Aborted because of self decline: " +
/******/ 									result.moduleId +
/******/ 									chainInfo
/******/ 							);
/******/ 						break;
/******/ 					case "declined":
/******/ 						if (options.onDeclined) options.onDeclined(result);
/******/ 						if (!options.ignoreDeclined)
/******/ 							abortError = new Error(
/******/ 								"Aborted because of declined dependency: " +
/******/ 									result.moduleId +
/******/ 									" in " +
/******/ 									result.parentId +
/******/ 									chainInfo
/******/ 							);
/******/ 						break;
/******/ 					case "unaccepted":
/******/ 						if (options.onUnaccepted) options.onUnaccepted(result);
/******/ 						if (!options.ignoreUnaccepted)
/******/ 							abortError = new Error(
/******/ 								"Aborted because " + moduleId + " is not accepted" + chainInfo
/******/ 							);
/******/ 						break;
/******/ 					case "accepted":
/******/ 						if (options.onAccepted) options.onAccepted(result);
/******/ 						doApply = true;
/******/ 						break;
/******/ 					case "disposed":
/******/ 						if (options.onDisposed) options.onDisposed(result);
/******/ 						doDispose = true;
/******/ 						break;
/******/ 					default:
/******/ 						throw new Error("Unexception type " + result.type);
/******/ 				}
/******/ 				if (abortError) {
/******/ 					hotSetStatus("abort");
/******/ 					return Promise.reject(abortError);
/******/ 				}
/******/ 				if (doApply) {
/******/ 					appliedUpdate[moduleId] = hotUpdate[moduleId];
/******/ 					addAllToSet(outdatedModules, result.outdatedModules);
/******/ 					for (moduleId in result.outdatedDependencies) {
/******/ 						if (
/******/ 							Object.prototype.hasOwnProperty.call(
/******/ 								result.outdatedDependencies,
/******/ 								moduleId
/******/ 							)
/******/ 						) {
/******/ 							if (!outdatedDependencies[moduleId])
/******/ 								outdatedDependencies[moduleId] = [];
/******/ 							addAllToSet(
/******/ 								outdatedDependencies[moduleId],
/******/ 								result.outdatedDependencies[moduleId]
/******/ 							);
/******/ 						}
/******/ 					}
/******/ 				}
/******/ 				if (doDispose) {
/******/ 					addAllToSet(outdatedModules, [result.moduleId]);
/******/ 					appliedUpdate[moduleId] = warnUnexpectedRequire;
/******/ 				}
/******/ 			}
/******/ 		}
/******/
/******/ 		// Store self accepted outdated modules to require them later by the module system
/******/ 		var outdatedSelfAcceptedModules = [];
/******/ 		for (i = 0; i < outdatedModules.length; i++) {
/******/ 			moduleId = outdatedModules[i];
/******/ 			if (
/******/ 				installedModules[moduleId] &&
/******/ 				installedModules[moduleId].hot._selfAccepted
/******/ 			)
/******/ 				outdatedSelfAcceptedModules.push({
/******/ 					module: moduleId,
/******/ 					errorHandler: installedModules[moduleId].hot._selfAccepted
/******/ 				});
/******/ 		}
/******/
/******/ 		// Now in "dispose" phase
/******/ 		hotSetStatus("dispose");
/******/ 		Object.keys(hotAvailableFilesMap).forEach(function(chunkId) {
/******/ 			if (hotAvailableFilesMap[chunkId] === false) {
/******/ 				hotDisposeChunk(chunkId);
/******/ 			}
/******/ 		});
/******/
/******/ 		var idx;
/******/ 		var queue = outdatedModules.slice();
/******/ 		while (queue.length > 0) {
/******/ 			moduleId = queue.pop();
/******/ 			module = installedModules[moduleId];
/******/ 			if (!module) continue;
/******/
/******/ 			var data = {};
/******/
/******/ 			// Call dispose handlers
/******/ 			var disposeHandlers = module.hot._disposeHandlers;
/******/ 			for (j = 0; j < disposeHandlers.length; j++) {
/******/ 				cb = disposeHandlers[j];
/******/ 				cb(data);
/******/ 			}
/******/ 			hotCurrentModuleData[moduleId] = data;
/******/
/******/ 			// disable module (this disables requires from this module)
/******/ 			module.hot.active = false;
/******/
/******/ 			// remove module from cache
/******/ 			delete installedModules[moduleId];
/******/
/******/ 			// when disposing there is no need to call dispose handler
/******/ 			delete outdatedDependencies[moduleId];
/******/
/******/ 			// remove "parents" references from all children
/******/ 			for (j = 0; j < module.children.length; j++) {
/******/ 				var child = installedModules[module.children[j]];
/******/ 				if (!child) continue;
/******/ 				idx = child.parents.indexOf(moduleId);
/******/ 				if (idx >= 0) {
/******/ 					child.parents.splice(idx, 1);
/******/ 				}
/******/ 			}
/******/ 		}
/******/
/******/ 		// remove outdated dependency from module children
/******/ 		var dependency;
/******/ 		var moduleOutdatedDependencies;
/******/ 		for (moduleId in outdatedDependencies) {
/******/ 			if (
/******/ 				Object.prototype.hasOwnProperty.call(outdatedDependencies, moduleId)
/******/ 			) {
/******/ 				module = installedModules[moduleId];
/******/ 				if (module) {
/******/ 					moduleOutdatedDependencies = outdatedDependencies[moduleId];
/******/ 					for (j = 0; j < moduleOutdatedDependencies.length; j++) {
/******/ 						dependency = moduleOutdatedDependencies[j];
/******/ 						idx = module.children.indexOf(dependency);
/******/ 						if (idx >= 0) module.children.splice(idx, 1);
/******/ 					}
/******/ 				}
/******/ 			}
/******/ 		}
/******/
/******/ 		// Not in "apply" phase
/******/ 		hotSetStatus("apply");
/******/
/******/ 		hotCurrentHash = hotUpdateNewHash;
/******/
/******/ 		// insert new code
/******/ 		for (moduleId in appliedUpdate) {
/******/ 			if (Object.prototype.hasOwnProperty.call(appliedUpdate, moduleId)) {
/******/ 				modules[moduleId] = appliedUpdate[moduleId];
/******/ 			}
/******/ 		}
/******/
/******/ 		// call accept handlers
/******/ 		var error = null;
/******/ 		for (moduleId in outdatedDependencies) {
/******/ 			if (
/******/ 				Object.prototype.hasOwnProperty.call(outdatedDependencies, moduleId)
/******/ 			) {
/******/ 				module = installedModules[moduleId];
/******/ 				if (module) {
/******/ 					moduleOutdatedDependencies = outdatedDependencies[moduleId];
/******/ 					var callbacks = [];
/******/ 					for (i = 0; i < moduleOutdatedDependencies.length; i++) {
/******/ 						dependency = moduleOutdatedDependencies[i];
/******/ 						cb = module.hot._acceptedDependencies[dependency];
/******/ 						if (cb) {
/******/ 							if (callbacks.indexOf(cb) !== -1) continue;
/******/ 							callbacks.push(cb);
/******/ 						}
/******/ 					}
/******/ 					for (i = 0; i < callbacks.length; i++) {
/******/ 						cb = callbacks[i];
/******/ 						try {
/******/ 							cb(moduleOutdatedDependencies);
/******/ 						} catch (err) {
/******/ 							if (options.onErrored) {
/******/ 								options.onErrored({
/******/ 									type: "accept-errored",
/******/ 									moduleId: moduleId,
/******/ 									dependencyId: moduleOutdatedDependencies[i],
/******/ 									error: err
/******/ 								});
/******/ 							}
/******/ 							if (!options.ignoreErrored) {
/******/ 								if (!error) error = err;
/******/ 							}
/******/ 						}
/******/ 					}
/******/ 				}
/******/ 			}
/******/ 		}
/******/
/******/ 		// Load self accepted modules
/******/ 		for (i = 0; i < outdatedSelfAcceptedModules.length; i++) {
/******/ 			var item = outdatedSelfAcceptedModules[i];
/******/ 			moduleId = item.module;
/******/ 			hotCurrentParents = [moduleId];
/******/ 			try {
/******/ 				__webpack_require__(moduleId);
/******/ 			} catch (err) {
/******/ 				if (typeof item.errorHandler === "function") {
/******/ 					try {
/******/ 						item.errorHandler(err);
/******/ 					} catch (err2) {
/******/ 						if (options.onErrored) {
/******/ 							options.onErrored({
/******/ 								type: "self-accept-error-handler-errored",
/******/ 								moduleId: moduleId,
/******/ 								error: err2,
/******/ 								originalError: err
/******/ 							});
/******/ 						}
/******/ 						if (!options.ignoreErrored) {
/******/ 							if (!error) error = err2;
/******/ 						}
/******/ 						if (!error) error = err;
/******/ 					}
/******/ 				} else {
/******/ 					if (options.onErrored) {
/******/ 						options.onErrored({
/******/ 							type: "self-accept-errored",
/******/ 							moduleId: moduleId,
/******/ 							error: err
/******/ 						});
/******/ 					}
/******/ 					if (!options.ignoreErrored) {
/******/ 						if (!error) error = err;
/******/ 					}
/******/ 				}
/******/ 			}
/******/ 		}
/******/
/******/ 		// handle errors in accept handlers and self accepted module load
/******/ 		if (error) {
/******/ 			hotSetStatus("fail");
/******/ 			return Promise.reject(error);
/******/ 		}
/******/
/******/ 		hotSetStatus("idle");
/******/ 		return new Promise(function(resolve) {
/******/ 			resolve(outdatedModules);
/******/ 		});
/******/ 	}
/******/
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {},
/******/ 			hot: hotCreateModule(moduleId),
/******/ 			parents: (hotCurrentParentsTemp = hotCurrentParents, hotCurrentParents = [], hotCurrentParentsTemp),
/******/ 			children: []
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, hotCreateRequire(moduleId));
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// __webpack_hash__
/******/ 	__webpack_require__.h = function() { return hotCurrentHash; };
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return hotCreateRequire("./webWorker/index.js")(__webpack_require__.s = "./webWorker/index.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./shared/calculateMinMax.js":
/*!***********************************!*\
  !*** ./shared/calculateMinMax.js ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = calculateMinMax;

var _getMinMax = __webpack_require__(/*! ./getMinMax.js */ "./shared/getMinMax.js");

var _getMinMax2 = _interopRequireDefault(_getMinMax);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Check the minimum and maximum values in the imageFrame pixel data
 * match with the provided smallestPixelValue and largestPixelValue metaData.
 *
 * If 'strict' is true, log to the console a warning if these values do not match.
 * Otherwise, correct them automatically.
 *
 * @param {Object} imageFrame
 * @param {Boolean} strict If 'strict' is true, log to the console a warning if these values do not match.
 * Otherwise, correct them automatically.Default is true.
 */
function calculateMinMax(imageFrame) {
  var strict = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

  var minMax = (0, _getMinMax2.default)(imageFrame.pixelData);
  var mustAssign = !(isNumber(imageFrame.smallestPixelValue) && isNumber(imageFrame.largestPixelValue));

  if (strict === true && !mustAssign) {
    if (imageFrame.smallestPixelValue !== minMax.min) {
      console.warn('Image smallestPixelValue tag is incorrect. Rendering performance will suffer considerably.');
    }

    if (imageFrame.largestPixelValue !== minMax.max) {
      console.warn('Image largestPixelValue tag is incorrect. Rendering performance will suffer considerably.');
    }
  } else {
    imageFrame.smallestPixelValue = minMax.min;
    imageFrame.largestPixelValue = minMax.max;
  }
}

function isNumber(numValue) {
  return typeof numValue === 'number';
}

/***/ }),

/***/ "./shared/decodeImageFrame.js":
/*!************************************!*\
  !*** ./shared/decodeImageFrame.js ***!
  \************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _decodeLittleEndian = __webpack_require__(/*! ./decoders/decodeLittleEndian.js */ "./shared/decoders/decodeLittleEndian.js");

var _decodeLittleEndian2 = _interopRequireDefault(_decodeLittleEndian);

var _decodeBigEndian = __webpack_require__(/*! ./decoders/decodeBigEndian.js */ "./shared/decoders/decodeBigEndian.js");

var _decodeBigEndian2 = _interopRequireDefault(_decodeBigEndian);

var _decodeRLE = __webpack_require__(/*! ./decoders/decodeRLE.js */ "./shared/decoders/decodeRLE.js");

var _decodeRLE2 = _interopRequireDefault(_decodeRLE);

var _decodeJPEGBaseline = __webpack_require__(/*! ./decoders/decodeJPEGBaseline.js */ "./shared/decoders/decodeJPEGBaseline.js");

var _decodeJPEGBaseline2 = _interopRequireDefault(_decodeJPEGBaseline);

var _decodeJPEGLossless = __webpack_require__(/*! ./decoders/decodeJPEGLossless.js */ "./shared/decoders/decodeJPEGLossless.js");

var _decodeJPEGLossless2 = _interopRequireDefault(_decodeJPEGLossless);

var _decodeJPEGLS = __webpack_require__(/*! ./decoders/decodeJPEGLS.js */ "./shared/decoders/decodeJPEGLS.js");

var _decodeJPEGLS2 = _interopRequireDefault(_decodeJPEGLS);

var _decodeJPEG = __webpack_require__(/*! ./decoders/decodeJPEG2000.js */ "./shared/decoders/decodeJPEG2000.js");

var _decodeJPEG2 = _interopRequireDefault(_decodeJPEG);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function decodeImageFrame(imageFrame, transferSyntax, pixelData, decodeConfig, options) {
  var start = new Date().getTime();

  if (transferSyntax === '1.2.840.10008.1.2') {
    // Implicit VR Little Endian
    imageFrame = (0, _decodeLittleEndian2.default)(imageFrame, pixelData);
  } else if (transferSyntax === '1.2.840.10008.1.2.1') {
    // Explicit VR Little Endian
    imageFrame = (0, _decodeLittleEndian2.default)(imageFrame, pixelData);
  } else if (transferSyntax === '1.2.840.10008.1.2.2') {
    // Explicit VR Big Endian (retired)
    imageFrame = (0, _decodeBigEndian2.default)(imageFrame, pixelData);
  } else if (transferSyntax === '1.2.840.10008.1.2.1.99') {
    // Deflate transfer syntax (deflated by dicomParser)
    imageFrame = (0, _decodeLittleEndian2.default)(imageFrame, pixelData);
  } else if (transferSyntax === '1.2.840.10008.1.2.5') {
    // RLE Lossless
    imageFrame = (0, _decodeRLE2.default)(imageFrame, pixelData);
  } else if (transferSyntax === '1.2.840.10008.1.2.4.50') {
    // JPEG Baseline lossy process 1 (8 bit)
    imageFrame = (0, _decodeJPEGBaseline2.default)(imageFrame, pixelData);
  } else if (transferSyntax === '1.2.840.10008.1.2.4.51') {
    // JPEG Baseline lossy process 2 & 4 (12 bit)
    imageFrame = (0, _decodeJPEGBaseline2.default)(imageFrame, pixelData);
  } else if (transferSyntax === '1.2.840.10008.1.2.4.57') {
    // JPEG Lossless, Nonhierarchical (Processes 14)
    imageFrame = (0, _decodeJPEGLossless2.default)(imageFrame, pixelData);
  } else if (transferSyntax === '1.2.840.10008.1.2.4.70') {
    // JPEG Lossless, Nonhierarchical (Processes 14 [Selection 1])
    imageFrame = (0, _decodeJPEGLossless2.default)(imageFrame, pixelData);
  } else if (transferSyntax === '1.2.840.10008.1.2.4.80') {
    // JPEG-LS Lossless Image Compression
    imageFrame = (0, _decodeJPEGLS2.default)(imageFrame, pixelData);
  } else if (transferSyntax === '1.2.840.10008.1.2.4.81') {
    // JPEG-LS Lossy (Near-Lossless) Image Compression
    imageFrame = (0, _decodeJPEGLS2.default)(imageFrame, pixelData);
  } else if (transferSyntax === '1.2.840.10008.1.2.4.90') {
    // JPEG 2000 Lossless
    imageFrame = (0, _decodeJPEG2.default)(imageFrame, pixelData, decodeConfig, options);
  } else if (transferSyntax === '1.2.840.10008.1.2.4.91') {
    // JPEG 2000 Lossy
    imageFrame = (0, _decodeJPEG2.default)(imageFrame, pixelData, decodeConfig, options);
  } else {
    throw new Error('no decoder for transfer syntax ' + transferSyntax);
  }

  /* Don't know if these work...
   // JPEG 2000 Part 2 Multicomponent Image Compression (Lossless Only)
   else if(transferSyntax === "1.2.840.10008.1.2.4.92")
   {
   return decodeJPEG2000(dataSet, frame);
   }
   // JPEG 2000 Part 2 Multicomponent Image Compression
   else if(transferSyntax === "1.2.840.10008.1.2.4.93")
   {
   return decodeJPEG2000(dataSet, frame);
   }
   */

  var shouldShift = imageFrame.pixelRepresentation !== undefined && imageFrame.pixelRepresentation === 1;
  var shift = shouldShift && imageFrame.bitsStored !== undefined ? 32 - imageFrame.bitsStored : undefined;

  if (shouldShift && shift !== undefined) {
    for (var i = 0; i < imageFrame.pixelData.length; i++) {
      // eslint-disable-next-line no-bitwise
      imageFrame.pixelData[i] = imageFrame.pixelData[i] << shift >> shift;
    }
  }

  var end = new Date().getTime();

  imageFrame.decodeTimeInMS = end - start;

  return imageFrame;
}

exports.default = decodeImageFrame;

/***/ }),

/***/ "./shared/decoders/decodeBigEndian.js":
/*!********************************************!*\
  !*** ./shared/decoders/decodeBigEndian.js ***!
  \********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
/* eslint no-bitwise: 0 */
function swap16(val) {
  return (val & 0xFF) << 8 | val >> 8 & 0xFF;
}

function decodeBigEndian(imageFrame, pixelData) {
  if (imageFrame.bitsAllocated === 16) {
    var arrayBuffer = pixelData.buffer;
    var offset = pixelData.byteOffset;
    var length = pixelData.length;
    // if pixel data is not aligned on even boundary, shift it so we can create the 16 bit array
    // buffers on it

    if (offset % 2) {
      arrayBuffer = arrayBuffer.slice(offset);
      offset = 0;
    }

    if (imageFrame.pixelRepresentation === 0) {
      imageFrame.pixelData = new Uint16Array(arrayBuffer, offset, length / 2);
    } else {
      imageFrame.pixelData = new Int16Array(arrayBuffer, offset, length / 2);
    }
    // Do the byte swap
    for (var i = 0; i < imageFrame.pixelData.length; i++) {
      imageFrame.pixelData[i] = swap16(imageFrame.pixelData[i]);
    }
  } else if (imageFrame.bitsAllocated === 8) {
    imageFrame.pixelData = pixelData;
  }

  return imageFrame;
}

exports.default = decodeBigEndian;

/***/ }),

/***/ "./shared/decoders/decodeJPEG2000.js":
/*!*******************************************!*\
  !*** ./shared/decoders/decodeJPEG2000.js ***!
  \*******************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
function decodeJpx(imageFrame, pixelData) {
  var jpxImage = new JpxImage();

  jpxImage.parse(pixelData);

  var tileCount = jpxImage.tiles.length;

  if (tileCount !== 1) {
    throw new Error('JPEG2000 decoder returned a tileCount of ' + tileCount + ', when 1 is expected');
  }

  imageFrame.columns = jpxImage.width;
  imageFrame.rows = jpxImage.height;
  imageFrame.pixelData = jpxImage.tiles[0].items;

  return imageFrame;
}

var openJPEG = void 0;

function decodeOpenJPEG(data, bytesPerPixel, signed) {
  var dataPtr = openJPEG._malloc(data.length);

  openJPEG.writeArrayToMemory(data, dataPtr);

  // create param outpout
  var imagePtrPtr = openJPEG._malloc(4);
  var imageSizePtr = openJPEG._malloc(4);
  var imageSizeXPtr = openJPEG._malloc(4);
  var imageSizeYPtr = openJPEG._malloc(4);
  var imageSizeCompPtr = openJPEG._malloc(4);

  var t0 = new Date().getTime();
  var ret = openJPEG.ccall('jp2_decode', 'number', ['number', 'number', 'number', 'number', 'number', 'number', 'number'], [dataPtr, data.length, imagePtrPtr, imageSizePtr, imageSizeXPtr, imageSizeYPtr, imageSizeCompPtr]);
  // add num vomp..etc

  if (ret !== 0) {
    console.log('[opj_decode] decoding failed!');
    openJPEG._free(dataPtr);
    openJPEG._free(openJPEG.getValue(imagePtrPtr, '*'));
    openJPEG._free(imageSizeXPtr);
    openJPEG._free(imageSizeYPtr);
    openJPEG._free(imageSizePtr);
    openJPEG._free(imageSizeCompPtr);

    return;
  }

  var imagePtr = openJPEG.getValue(imagePtrPtr, '*');

  var image = {
    length: openJPEG.getValue(imageSizePtr, 'i32'),
    sx: openJPEG.getValue(imageSizeXPtr, 'i32'),
    sy: openJPEG.getValue(imageSizeYPtr, 'i32'),
    nbChannels: openJPEG.getValue(imageSizeCompPtr, 'i32'), // hard coded for now
    perf_timetodecode: undefined,
    pixelData: undefined
  };

  // Copy the data from the EMSCRIPTEN heap into the correct type array
  var length = image.sx * image.sy * image.nbChannels;
  var src32 = new Int32Array(openJPEG.HEAP32.buffer, imagePtr, length);

  if (bytesPerPixel === 1) {
    if (Uint8Array.from) {
      image.pixelData = Uint8Array.from(src32);
    } else {
      image.pixelData = new Uint8Array(length);
      for (var i = 0; i < length; i++) {
        image.pixelData[i] = src32[i];
      }
    }
  } else if (signed) {
    if (Int16Array.from) {
      image.pixelData = Int16Array.from(src32);
    } else {
      image.pixelData = new Int16Array(length);
      for (var _i = 0; _i < length; _i++) {
        image.pixelData[_i] = src32[_i];
      }
    }
  } else if (Uint16Array.from) {
    image.pixelData = Uint16Array.from(src32);
  } else {
    image.pixelData = new Uint16Array(length);
    for (var _i2 = 0; _i2 < length; _i2++) {
      image.pixelData[_i2] = src32[_i2];
    }
  }

  var t1 = new Date().getTime();

  image.perf_timetodecode = t1 - t0;

  // free
  openJPEG._free(dataPtr);
  openJPEG._free(imagePtrPtr);
  openJPEG._free(imagePtr);
  openJPEG._free(imageSizePtr);
  openJPEG._free(imageSizeXPtr);
  openJPEG._free(imageSizeYPtr);
  openJPEG._free(imageSizeCompPtr);

  return image;
}

function decodeOpenJpeg2000(imageFrame, pixelData) {
  var bytesPerPixel = imageFrame.bitsAllocated <= 8 ? 1 : 2;
  var signed = imageFrame.pixelRepresentation === 1;

  var image = decodeOpenJPEG(pixelData, bytesPerPixel, signed);

  imageFrame.columns = image.sx;
  imageFrame.rows = image.sy;
  imageFrame.pixelData = image.pixelData;
  if (image.nbChannels > 1) {
    imageFrame.photometricInterpretation = 'RGB';
  }

  return imageFrame;
}

function initializeJPEG2000(decodeConfig) {
  // check to make sure codec is loaded
  if (!decodeConfig.usePDFJS) {
    if (typeof OpenJPEG === 'undefined') {
      throw new Error('OpenJPEG decoder not loaded');
    }
  }

  if (!openJPEG) {
    openJPEG = OpenJPEG();
    if (!openJPEG || !openJPEG._jp2_decode) {
      throw new Error('OpenJPEG failed to initialize');
    }
  }
}

function decodeJPEG2000(imageFrame, pixelData, decodeConfig) {
  var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

  initializeJPEG2000(decodeConfig);

  if (options.usePDFJS || decodeConfig.usePDFJS) {
    // OHIF image-JPEG2000 https://github.com/OHIF/image-JPEG2000
    // console.log('PDFJS')
    return decodeJpx(imageFrame, pixelData);
  }

  // OpenJPEG2000 https://github.com/jpambrun/openjpeg
  // console.log('OpenJPEG')
  return decodeOpenJpeg2000(imageFrame, pixelData);
}

exports.default = decodeJPEG2000;
exports.initializeJPEG2000 = initializeJPEG2000;

/***/ }),

/***/ "./shared/decoders/decodeJPEGBaseline.js":
/*!***********************************************!*\
  !*** ./shared/decoders/decodeJPEGBaseline.js ***!
  \***********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});


function decodeJPEGBaseline(imageFrame, pixelData) {
  // check to make sure codec is loaded
  if (typeof JpegImage === 'undefined') {
    throw new Error('No JPEG Baseline decoder loaded');
  }
  var jpeg = new JpegImage();

  jpeg.parse(pixelData);

  // Do not use the internal jpeg.js color transformation,
  // since we will handle this afterwards
  jpeg.colorTransform = false;

  if (imageFrame.bitsAllocated === 8) {
    imageFrame.pixelData = jpeg.getData(imageFrame.columns, imageFrame.rows);

    return imageFrame;
  } else if (imageFrame.bitsAllocated === 16) {
    imageFrame.pixelData = jpeg.getData16(imageFrame.columns, imageFrame.rows);

    return imageFrame;
  }
}

exports.default = decodeJPEGBaseline;

/***/ }),

/***/ "./shared/decoders/decodeJPEGLS.js":
/*!*****************************************!*\
  !*** ./shared/decoders/decodeJPEGLS.js ***!
  \*****************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
var charLS = void 0;

function jpegLSDecode(data, isSigned) {
  // prepare input parameters
  var dataPtr = charLS._malloc(data.length);

  charLS.writeArrayToMemory(data, dataPtr);

  // prepare output parameters
  var imagePtrPtr = charLS._malloc(4);
  var imageSizePtr = charLS._malloc(4);
  var widthPtr = charLS._malloc(4);
  var heightPtr = charLS._malloc(4);
  var bitsPerSamplePtr = charLS._malloc(4);
  var stridePtr = charLS._malloc(4);
  var allowedLossyErrorPtr = charLS._malloc(4);
  var componentsPtr = charLS._malloc(4);
  var interleaveModePtr = charLS._malloc(4);

  // Decode the image
  var result = charLS.ccall('jpegls_decode', 'number', ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number'], [dataPtr, data.length, imagePtrPtr, imageSizePtr, widthPtr, heightPtr, bitsPerSamplePtr, stridePtr, componentsPtr, allowedLossyErrorPtr, interleaveModePtr]);

  // Extract result values into object
  var image = {
    result: result,
    width: charLS.getValue(widthPtr, 'i32'),
    height: charLS.getValue(heightPtr, 'i32'),
    bitsPerSample: charLS.getValue(bitsPerSamplePtr, 'i32'),
    stride: charLS.getValue(stridePtr, 'i32'),
    components: charLS.getValue(componentsPtr, 'i32'),
    allowedLossyError: charLS.getValue(allowedLossyErrorPtr, 'i32'),
    interleaveMode: charLS.getValue(interleaveModePtr, 'i32'),
    pixelData: undefined
  };

  // Copy image from emscripten heap into appropriate array buffer type
  var imagePtr = charLS.getValue(imagePtrPtr, '*');

  if (image.bitsPerSample <= 8) {
    image.pixelData = new Uint8Array(image.width * image.height * image.components);
    image.pixelData.set(new Uint8Array(charLS.HEAP8.buffer, imagePtr, image.pixelData.length));
  } else if (isSigned) {
    image.pixelData = new Int16Array(image.width * image.height * image.components);
    image.pixelData.set(new Int16Array(charLS.HEAP16.buffer, imagePtr, image.pixelData.length));
  } else {
    image.pixelData = new Uint16Array(image.width * image.height * image.components);
    image.pixelData.set(new Uint16Array(charLS.HEAP16.buffer, imagePtr, image.pixelData.length));
  }

  // free memory and return image object
  charLS._free(dataPtr);
  charLS._free(imagePtr);
  charLS._free(imagePtrPtr);
  charLS._free(imageSizePtr);
  charLS._free(widthPtr);
  charLS._free(heightPtr);
  charLS._free(bitsPerSamplePtr);
  charLS._free(stridePtr);
  charLS._free(componentsPtr);
  charLS._free(interleaveModePtr);

  return image;
}

function initializeJPEGLS() {
  // check to make sure codec is loaded
  if (typeof CharLS === 'undefined') {
    throw new Error('No JPEG-LS decoder loaded');
  }

  // Try to initialize CharLS
  // CharLS https://github.com/cornerstonejs/charls
  if (!charLS) {
    charLS = CharLS();
    if (!charLS || !charLS._jpegls_decode) {
      throw new Error('JPEG-LS failed to initialize');
    }
  }
}

function decodeJPEGLS(imageFrame, pixelData) {
  initializeJPEGLS();

  var image = jpegLSDecode(pixelData, imageFrame.pixelRepresentation === 1);

  // throw error if not success or too much data
  if (image.result !== 0 && image.result !== 6) {
    throw new Error('JPEG-LS decoder failed to decode frame (error code ' + image.result + ')');
  }

  imageFrame.columns = image.width;
  imageFrame.rows = image.height;
  imageFrame.pixelData = image.pixelData;

  return imageFrame;
}

exports.default = decodeJPEGLS;
exports.initializeJPEGLS = initializeJPEGLS;

/***/ }),

/***/ "./shared/decoders/decodeJPEGLossless.js":
/*!***********************************************!*\
  !*** ./shared/decoders/decodeJPEGLossless.js ***!
  \***********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});


function decodeJPEGLossless(imageFrame, pixelData) {
  // check to make sure codec is loaded
  if (typeof jpeg === 'undefined' || typeof jpeg.lossless === 'undefined' || typeof jpeg.lossless.Decoder === 'undefined') {
    throw new Error('No JPEG Lossless decoder loaded');
  }

  var byteOutput = imageFrame.bitsAllocated <= 8 ? 1 : 2;
  // console.time('jpeglossless');
  var buffer = pixelData.buffer;
  var decoder = new jpeg.lossless.Decoder();
  var decompressedData = decoder.decode(buffer, pixelData.byteOffset, pixelData.length, byteOutput);
  // console.timeEnd('jpeglossless');

  if (imageFrame.pixelRepresentation === 0) {
    if (imageFrame.bitsAllocated === 16) {
      imageFrame.pixelData = new Uint16Array(decompressedData.buffer);

      return imageFrame;
    }
    // untested!
    imageFrame.pixelData = new Uint8Array(decompressedData.buffer);

    return imageFrame;
  }
  imageFrame.pixelData = new Int16Array(decompressedData.buffer);

  return imageFrame;
}

exports.default = decodeJPEGLossless;

/***/ }),

/***/ "./shared/decoders/decodeLittleEndian.js":
/*!***********************************************!*\
  !*** ./shared/decoders/decodeLittleEndian.js ***!
  \***********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
function decodeLittleEndian(imageFrame, pixelData) {
  var arrayBuffer = pixelData.buffer;
  var offset = pixelData.byteOffset;
  var length = pixelData.length;

  if (imageFrame.bitsAllocated === 16) {
    // if pixel data is not aligned on even boundary, shift it so we can create the 16 bit array
    // buffers on it
    if (offset % 2) {
      arrayBuffer = arrayBuffer.slice(offset);
      offset = 0;
    }

    if (imageFrame.pixelRepresentation === 0) {
      imageFrame.pixelData = new Uint16Array(arrayBuffer, offset, length / 2);
    } else {
      imageFrame.pixelData = new Int16Array(arrayBuffer, offset, length / 2);
    }
  } else if (imageFrame.bitsAllocated === 8 || imageFrame.bitsAllocated === 1) {
    imageFrame.pixelData = pixelData;
  } else if (imageFrame.bitsAllocated === 32) {
    // if pixel data is not aligned on even boundary, shift it
    if (offset % 2) {
      arrayBuffer = arrayBuffer.slice(offset);
      offset = 0;
    }

    imageFrame.pixelData = new Float32Array(arrayBuffer, offset, length / 4);
  }

  return imageFrame;
}

exports.default = decodeLittleEndian;

/***/ }),

/***/ "./shared/decoders/decodeRLE.js":
/*!**************************************!*\
  !*** ./shared/decoders/decodeRLE.js ***!
  \**************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
function decodeRLE(imageFrame, pixelData) {
  if (imageFrame.bitsAllocated === 8) {
    if (imageFrame.planarConfiguration) {
      return decode8Planar(imageFrame, pixelData);
    }

    return decode8(imageFrame, pixelData);
  } else if (imageFrame.bitsAllocated === 16) {
    return decode16(imageFrame, pixelData);
  }

  throw new Error('unsupported pixel format for RLE');
}

function decode8(imageFrame, pixelData) {
  var frameData = pixelData;
  var frameSize = imageFrame.rows * imageFrame.columns;
  var outFrame = new ArrayBuffer(frameSize * imageFrame.samplesPerPixel);
  var header = new DataView(frameData.buffer, frameData.byteOffset);
  var data = new Int8Array(frameData.buffer, frameData.byteOffset);
  var out = new Int8Array(outFrame);

  var outIndex = 0;
  var numSegments = header.getInt32(0, true);

  for (var s = 0; s < numSegments; ++s) {
    outIndex = s;

    var inIndex = header.getInt32((s + 1) * 4, true);
    var maxIndex = header.getInt32((s + 2) * 4, true);

    if (maxIndex === 0) {
      maxIndex = frameData.length;
    }

    var endOfSegment = frameSize * numSegments;

    while (inIndex < maxIndex) {
      var n = data[inIndex++];

      if (n >= 0 && n <= 127) {
        // copy n bytes
        for (var i = 0; i < n + 1 && outIndex < endOfSegment; ++i) {
          out[outIndex] = data[inIndex++];
          outIndex += imageFrame.samplesPerPixel;
        }
      } else if (n <= -1 && n >= -127) {
        var value = data[inIndex++];
        // run of n bytes

        for (var j = 0; j < -n + 1 && outIndex < endOfSegment; ++j) {
          out[outIndex] = value;
          outIndex += imageFrame.samplesPerPixel;
        }
      } /* else if (n === -128) {
        } // do nothing */
    }
  }
  imageFrame.pixelData = new Uint8Array(outFrame);

  return imageFrame;
}

function decode8Planar(imageFrame, pixelData) {
  var frameData = pixelData;
  var frameSize = imageFrame.rows * imageFrame.columns;
  var outFrame = new ArrayBuffer(frameSize * imageFrame.samplesPerPixel);
  var header = new DataView(frameData.buffer, frameData.byteOffset);
  var data = new Int8Array(frameData.buffer, frameData.byteOffset);
  var out = new Int8Array(outFrame);

  var outIndex = 0;
  var numSegments = header.getInt32(0, true);

  for (var s = 0; s < numSegments; ++s) {
    outIndex = s * frameSize;

    var inIndex = header.getInt32((s + 1) * 4, true);
    var maxIndex = header.getInt32((s + 2) * 4, true);

    if (maxIndex === 0) {
      maxIndex = frameData.length;
    }

    var endOfSegment = frameSize * numSegments;

    while (inIndex < maxIndex) {
      var n = data[inIndex++];

      if (n >= 0 && n <= 127) {
        // copy n bytes
        for (var i = 0; i < n + 1 && outIndex < endOfSegment; ++i) {
          out[outIndex] = data[inIndex++];
          outIndex++;
        }
      } else if (n <= -1 && n >= -127) {
        var value = data[inIndex++];
        // run of n bytes

        for (var j = 0; j < -n + 1 && outIndex < endOfSegment; ++j) {
          out[outIndex] = value;
          outIndex++;
        }
      } /* else if (n === -128) {
        } // do nothing */
    }
  }
  imageFrame.pixelData = new Uint8Array(outFrame);

  return imageFrame;
}

function decode16(imageFrame, pixelData) {
  var frameData = pixelData;
  var frameSize = imageFrame.rows * imageFrame.columns;
  var outFrame = new ArrayBuffer(frameSize * imageFrame.samplesPerPixel * 2);

  var header = new DataView(frameData.buffer, frameData.byteOffset);
  var data = new Int8Array(frameData.buffer, frameData.byteOffset);
  var out = new Int8Array(outFrame);

  var numSegments = header.getInt32(0, true);

  for (var s = 0; s < numSegments; ++s) {
    var outIndex = 0;
    var highByte = s === 0 ? 1 : 0;

    var inIndex = header.getInt32((s + 1) * 4, true);
    var maxIndex = header.getInt32((s + 2) * 4, true);

    if (maxIndex === 0) {
      maxIndex = frameData.length;
    }

    while (inIndex < maxIndex) {
      var n = data[inIndex++];

      if (n >= 0 && n <= 127) {
        for (var i = 0; i < n + 1 && outIndex < frameSize; ++i) {
          out[outIndex * 2 + highByte] = data[inIndex++];
          outIndex++;
        }
      } else if (n <= -1 && n >= -127) {
        var value = data[inIndex++];

        for (var j = 0; j < -n + 1 && outIndex < frameSize; ++j) {
          out[outIndex * 2 + highByte] = value;
          outIndex++;
        }
      } /* else if (n === -128) {
        } // do nothing */
    }
  }
  if (imageFrame.pixelRepresentation === 0) {
    imageFrame.pixelData = new Uint16Array(outFrame);
  } else {
    imageFrame.pixelData = new Int16Array(outFrame);
  }

  return imageFrame;
}

exports.default = decodeRLE;

/***/ }),

/***/ "./shared/getMinMax.js":
/*!*****************************!*\
  !*** ./shared/getMinMax.js ***!
  \*****************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
/**
 * Calculate the minimum and maximum values in an Array
 *
 * @param {Number[]} storedPixelData
 * @return {{min: Number, max: Number}}
 */
function getMinMax(storedPixelData) {
  // we always calculate the min max values since they are not always
  // present in DICOM and we don't want to trust them anyway as cornerstone
  // depends on us providing reliable values for these
  var min = storedPixelData[0];
  var max = storedPixelData[0];
  var storedPixel = void 0;
  var numPixels = storedPixelData.length;

  for (var index = 1; index < numPixels; index++) {
    storedPixel = storedPixelData[index];
    min = Math.min(min, storedPixel);
    max = Math.max(max, storedPixel);
  }

  return {
    min: min,
    max: max
  };
}

exports.default = getMinMax;

/***/ }),

/***/ "./version.js":
/*!********************!*\
  !*** ./version.js ***!
  \********************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = '2.1.4';

/***/ }),

/***/ "./webWorker/decodeTask/decodeTask.js":
/*!********************************************!*\
  !*** ./webWorker/decodeTask/decodeTask.js ***!
  \********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _decodeJPEG = __webpack_require__(/*! ../../shared/decoders/decodeJPEG2000.js */ "./shared/decoders/decodeJPEG2000.js");

var _decodeJPEGLS = __webpack_require__(/*! ../../shared/decoders/decodeJPEGLS.js */ "./shared/decoders/decodeJPEGLS.js");

var _calculateMinMax = __webpack_require__(/*! ../../shared/calculateMinMax.js */ "./shared/calculateMinMax.js");

var _calculateMinMax2 = _interopRequireDefault(_calculateMinMax);

var _decodeImageFrame = __webpack_require__(/*! ../../shared/decodeImageFrame.js */ "./shared/decodeImageFrame.js");

var _decodeImageFrame2 = _interopRequireDefault(_decodeImageFrame);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// flag to ensure codecs are loaded only once
var codecsLoaded = false;

// the configuration object for the decodeTask
var decodeConfig = void 0;

/**
 * Function to control loading and initializing the codecs
 * @param config
 */
function loadCodecs(config) {
  // prevent loading codecs more than once
  if (codecsLoaded) {
    return;
  }

  // Load the codecs
  // console.time('loadCodecs');
  self.importScripts(config.decodeTask.codecsPath);
  codecsLoaded = true;
  // console.timeEnd('loadCodecs');

  // Initialize the codecs
  if (config.decodeTask.initializeCodecsOnStartup) {
    // console.time('initializeCodecs');
    (0, _decodeJPEG.initializeJPEG2000)(config.decodeTask);
    (0, _decodeJPEGLS.initializeJPEGLS)(config.decodeTask);
    // console.timeEnd('initializeCodecs');
  }
}

/**
 * Task initialization function
 */
function initialize(config) {
  decodeConfig = config;
  if (config.decodeTask.loadCodecsOnStartup) {
    loadCodecs(config);
  }
}

/**
 * Task handler function
 */
function handler(data, doneCallback) {
  // Load the codecs if they aren't already loaded
  loadCodecs(decodeConfig);

  var strict = decodeConfig && decodeConfig.decodeTask && decodeConfig.decodeTask.strict;
  var imageFrame = data.data.imageFrame;

  // convert pixel data from ArrayBuffer to Uint8Array since web workers support passing ArrayBuffers but
  // not typed arrays
  var pixelData = new Uint8Array(data.data.pixelData);

  (0, _decodeImageFrame2.default)(imageFrame, data.data.transferSyntax, pixelData, decodeConfig.decodeTask, data.data.options);

  if (!imageFrame.pixelData) {
    throw new Error('decodeTask: imageFrame.pixelData is undefined after decoding');
  }

  (0, _calculateMinMax2.default)(imageFrame, strict);

  // convert from TypedArray to ArrayBuffer since web workers support passing ArrayBuffers but not
  // typed arrays
  imageFrame.pixelData = imageFrame.pixelData.buffer;

  // invoke the callback with our result and pass the pixelData in the transferList to move it to
  // UI thread without making a copy
  doneCallback(imageFrame, [imageFrame.pixelData]);
}

exports.default = {
  taskType: 'decodeTask',
  handler: handler,
  initialize: initialize
};

/***/ }),

/***/ "./webWorker/index.js":
/*!****************************!*\
  !*** ./webWorker/index.js ***!
  \****************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.version = exports.registerTaskHandler = undefined;

var _version = __webpack_require__(/*! ../version.js */ "./version.js");

Object.defineProperty(exports, 'version', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_version).default;
  }
});

var _webWorker = __webpack_require__(/*! ./webWorker.js */ "./webWorker/webWorker.js");

var _decodeTask = __webpack_require__(/*! ./decodeTask/decodeTask.js */ "./webWorker/decodeTask/decodeTask.js");

var _decodeTask2 = _interopRequireDefault(_decodeTask);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// register our task
(0, _webWorker.registerTaskHandler)(_decodeTask2.default);

exports.registerTaskHandler = _webWorker.registerTaskHandler;

/***/ }),

/***/ "./webWorker/webWorker.js":
/*!********************************!*\
  !*** ./webWorker/webWorker.js ***!
  \********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.registerTaskHandler = registerTaskHandler;
// an object of task handlers
var taskHandlers = {};

// Flag to ensure web worker is only initialized once
var initialized = false;

// the configuration object passed in when the web worker manager is initialized
var config = void 0;

/**
 * Initialization function that loads additional web workers and initializes them
 * @param data
 */
function initialize(data) {
  // console.log('web worker initialize ', data.workerIndex);
  // prevent initialization from happening more than once
  if (initialized) {
    return;
  }

  // save the config data
  config = data.config;

  // load any additional web worker tasks
  if (data.config.webWorkerTaskPaths) {
    for (var i = 0; i < data.config.webWorkerTaskPaths.length; i++) {
      self.importScripts(data.config.webWorkerTaskPaths[i]);
    }
  }

  // initialize each task handler
  Object.keys(taskHandlers).forEach(function (key) {
    taskHandlers[key].initialize(config.taskConfiguration);
  });

  // tell main ui thread that we have completed initialization
  self.postMessage({
    taskType: 'initialize',
    status: 'success',
    result: {},
    workerIndex: data.workerIndex
  });

  initialized = true;
}

/**
 * Function exposed to web worker tasks to register themselves
 * @param taskHandler
 */
function registerTaskHandler(taskHandler) {
  if (taskHandlers[taskHandler.taskType]) {
    console.log('attempt to register duplicate task handler "', taskHandler.taskType, '"');

    return false;
  }
  taskHandlers[taskHandler.taskType] = taskHandler;
  if (initialized) {
    taskHandler.initialize(config.taskConfiguration);
  }
}

/**
 * Function to load a new web worker task with updated configuration
 * @param data
 */
function loadWebWorkerTask(data) {
  config = data.config;
  self.importScripts(data.sourcePath);
}

/**
 * Web worker message handler - dispatches messages to the registered task handlers
 * @param msg
 */
self.onmessage = function (msg) {
  // console.log('web worker onmessage', msg.data);

  // handle initialize message
  if (msg.data.taskType === 'initialize') {
    initialize(msg.data);

    return;
  }

  // handle loadWebWorkerTask message
  if (msg.data.taskType === 'loadWebWorkerTask') {
    loadWebWorkerTask(msg.data);

    return;
  }

  // dispatch the message if there is a handler registered for it
  if (taskHandlers[msg.data.taskType]) {
    taskHandlers[msg.data.taskType].handler(msg.data, function (result, transferList) {
      self.postMessage({
        taskType: msg.data.taskType,
        status: 'success',
        result: result,
        workerIndex: msg.data.workerIndex
      }, transferList);
    });

    return;
  }

  // not task handler registered - send a failure message back to ui thread
  console.log('no task handler for ', msg.data.taskType);
  console.log(taskHandlers);
  self.postMessage({
    taskType: msg.data.taskType,
    status: 'failed - no task handler registered',
    workerIndex: msg.data.workerIndex
  });
};

/***/ })

/******/ });
});
//# sourceMappingURL=cornerstoneWADOImageLoaderWebWorker.js.map