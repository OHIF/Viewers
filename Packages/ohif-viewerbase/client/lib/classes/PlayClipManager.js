import { $ } from 'meteor/jquery';
import { Tracker } from 'meteor/tracker';
import { Session } from 'meteor/session';
import { OHIF } from 'meteor/ohif:core';

class PlayClipController {
    constructor(element, displaySet) {
        this._isPlaying = false;
        this.element = element;
        this.displaySet = displaySet;
        this._playComputation = null;
    }

    _getStackProgress() {
        return Session.get('StackProgress:' + this.displaySet.displaySetInstanceUid);
    }

    _getToolState(toolType) {
        const toolState = cornerstoneTools.getToolState(this.element, toolType);
        if (toolState && toolState.data) {
            return toolState.data[0];
        }
    }

    _countFramesByStatus(stackProgress, startIndex, endIndex, status) {
        const framesStatus = stackProgress.framesStatus;
        const framesCount = framesStatus.length;
        let currentIndex = startIndex;
        let count = 0;

        do {
            if (framesStatus[currentIndex] === status) {
                count++;
            }

            if(currentIndex === endIndex) {
                break;
            }

            currentIndex = (currentIndex + 1) % framesCount;
        } while (true)

        return count;
    }

    _isLoopEnabled() {
        const playClipToolState = this._getToolState('playClip');
        return playClipToolState && playClipToolState.loop;
    }

    _getCurrentIndex() {
        const stackToolState = this._getToolState('stack');
        return stackToolState.currentImageIdIndex || 0;
    }

    _isLastFrame() {
        const stackToolState = this._getToolState('stack');
        const currentIndex = (stackToolState && stackToolState.currentImageIdIndex) || 0;
        const imagesCount = stackToolState ? stackToolState.imageIds.length : 0;

        return (imagesCount === 0) || (currentIndex === imagesCount - 1);
    }

    _getFrameDistance(startIndex, endIndex) {
        const framesCount = this.displaySet.numImageFrames;
        return startIndex <= endIndex ? endIndex - startIndex : framesCount - (startIndex - endIndex);
    }

    _getLastRelativeFrame(startFrame) {
        const numImageFrames = this.displaySet.numImageFrames;

        if (this._isLoopEnabled()) {
            // Easiest way to get the previous index without having to check if it's negative
            return (startFrame + numImageFrames - 1) % numImageFrames;
        }

        // Return the last index of the array
        return numImageFrames - 1;
    }

    isPlaying() {
        return this._isPlaying;
    }

    play() {
        if (this._isPlaying) {
            return;
        }

        this._isPlaying = true;

        const playClipToolState = this._getToolState('playClip');
        const startIndex = this._getCurrentIndex();
        const endIndex = this._getLastRelativeFrame(startIndex);
        const framesToPlay = this._getFrameDistance(startIndex, endIndex);
        const playTimeRemaining = framesToPlay / playClipToolState.framesPerSecond;

        const play = playComputation => {
            playComputation.stop();

            try {
                cornerstoneTools.playClip(this.element);
            } catch(e) {
                console.log(e);
            }
        }

        this._playComputation = Tracker.autorun(playComputation => {
            const stackProgress = this._getStackProgress();

            if (!stackProgress) {
                return;
            } else if (!stackProgress.multiFrame) {
                play(playComputation);
                return;
            }

            const framesToLoad = this._countFramesByStatus(stackProgress, startIndex, endIndex, false);
            const loadTimeRemaining = framesToLoad / stackProgress.framesPerSecond;

            if ((stackProgress.percentComplete === 100) || 
               (loadTimeRemaining < playTimeRemaining)) {
                play(playComputation);
                this._attachNewImageListener();
            }
        });

        // Update the UpdateCINE session property
        Session.set('UpdateCINE', Random.id());
    }

    stop() {
        if (!this._isPlaying) {
            return;
        }

        if (this._playComputation) {
            this._playComputation.stop();
            this._playComputation = null;
        }

        try {
            cornerstoneTools.stopClip(this.element);
        } catch(e) {
            console.log(e);
        }

        this._isPlaying = false;
        this._detachNewImageListener();

        // Update the UpdateCINE session property
        Session.set('UpdateCINE', Random.id());
    }

    togglePlay() {
        if(this._isPlaying) {
            this.stop();
        } else {
            this.play();
        }
    }

    _isNextFrameLoaded() {
        const stackProgress = this._getStackProgress();

        if (!stackProgress || !stackProgress.framesStatus) {
            return;
        }

        const stackToolState = this._getToolState('stack');
        const currentImageIdIndex = stackToolState.currentImageIdIndex || 0;
        const isLoopEnabled = this._isLoopEnabled();

        let nextImageIndex = currentImageIdIndex + 1;

        if ((nextImageIndex >= stackToolState.imageIds.length) && isLoopEnabled) {
            nextImageIndex = 0;
        }

        return stackProgress.framesStatus && stackProgress.framesStatus[nextImageIndex];
    }

    _newImageEventHandler(e, eventData) {
        if (this._isLastFrame() && !this._isLoopEnabled()) {
            return this.stop();
        } else if (!this._isNextFrameLoaded()) {
            // Stop the clip and play it again in order to wait for the next frames (buffer)
            this.stop();
            this.play();
        }
    }

    _attachNewImageListener() {
        this._detachNewImageListener();
        $(this.element).on('CornerstoneNewImage.PlayClipManager', this._newImageEventHandler.bind(this));
    }

    _detachNewImageListener() {
        $(this.element).off('CornerstoneNewImage.PlayClipManager');
    }

    destroy() {
        this.stop();
    }
}

class PlayClipManager {
    constructor() {
        this.elementControllers = [];
    }

    add(element, displaySet) {
        const playClipController = new PlayClipController(element, displaySet);

        // Remove any other PlayClipController for this `element`
        this.remove(element);

        // Add the new PlayClipController for this `element`
        this.elementControllers.push({
            element,
            playClipController
        });

        return playClipController;
    }

    remove (element) {
        const index = this._indexOf(element);

        if (index === -1) {
            return;
        }

        const elementController = this.elementControllers[index];
        const playClipController = elementController.playClipController;

        playClipController.destroy();
        this.elementControllers.splice(index, 1);
    }

    get (element) {
        const index = this._indexOf(element);

        if (index >= 0) {
            const elementController = this.elementControllers[index];
            return elementController.playClipController;
        }
    }

    _indexOf(element) {
        const elementControllers = this.elementControllers;
        const length = elementControllers.length;

        for(let i = 0; i < length; i++) {
            if (elementControllers[i].element === element) {
                return i;
            }
        }

        return -1;
    }

    _forEach(callback) {
        const elementControllers = this.elementControllers;
        const length = elementControllers.length;

        for (let i = 0; i < length; i++) {
            const elementControllers = this.elementControllers[i];
            const element = elementControllers.element;
            const playClipController = elementControllers.playClipController;

            callback(element, playClipController);
        }
    }

    playAll() {
        this._forEach((element, playClipController) => {
            playClipController.play();
        });
    }

    stopAll() {
        this._forEach((element, playClipController) => {
            playClipController.stop();
        });
    }

    clear() {
        this._forEach((element, playClipController) => {
            playClipController.destroy();
        });

        this.elementControllers = [];
    }

    // Singleton
    static getInstance() {
        if (!PlayClipManager._instance) {
            PlayClipManager._instance = new PlayClipManager();
        }

        return PlayClipManager._instance;
    }
}

export { PlayClipManager };
