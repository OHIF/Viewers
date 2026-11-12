---
sidebar_position: 13
sidebar_label: Web Workers
title: Web Workers Implementation Guide
summary: Step-by-step guide for implementing web workers in OHIF to handle computationally intensive tasks in background threads, including worker creation, registration, task execution, progress tracking, and best practices for code organization.
---
# Web Worker Implementation Guide

## Overview
Web Workers enable running computationally intensive tasks in background threads without blocking the UI. This guide explains how to implement them step by step.

## Basic Setup

### 1. Create Your Worker File
First, create a worker file with your background tasks:

```javascript
// myWorker.js
import { expose } from 'comlink';

const obj = {
  // Simple task
  basicCalculation({ data }) {
    // Your computation here
    return result;
  },

  // Task with progress updates
  longRunningTask({ data }, progressCallback) {
    const total = data.length;

    for (let i = 0; i < total; i++) {
      // Your processing logic

      if (progressCallback) {
        const progress = Math.round((i / total) * 100);
        progressCallback(progress);
      }
    }

    return result;
  }
};

expose(obj);
```

### 2. Register the Worker

In the main thread, can be your service, commands module, etc.

```javascript
import { getWebWorkerManager } from '@cornerstonejs/core';

const workerManager = getWebWorkerManager();

// Define worker creation function
const workerFn = () => {
  return new Worker(
    new URL('./myWorker.js', import.meta.url),
    { name: 'my-worker' }
  );
};

// Registration options
const options = {
  maxWorkerInstances: 1, // Number of concurrent workers
  autoTerminateOnIdle: {
    enabled: true,
    idleTimeThreshold: 3000, // Terminate after 3s idle
  },
};

// Register the worker
workerManager.registerWorker('my-worker', workerFn, options);
```

:::info
It is recommended to register the worker in top of the commands module. So that it
gets registered before any commands that need to use the worker.
:::

### 3. Execute Tasks

```javascript
// Basic execution
try {
  const result = await workerManager.executeTask(
    'my-worker',
    'basicCalculation',
    { data: myData }
  );
} catch (error) {
  console.error('Task failed:', error);
}

// Execution with progress callback
try {
  const result = await workerManager.executeTask(
    'my-worker',
    'longRunningTask',
    { data: myData },
    {
      callbacks: [
        (progress) => {
          console.log(`Progress: ${progress}%`);
        }
      ]
    }
  );
} catch (error) {
  console.error('Task failed:', error);
}
```

## Progress Events (Optional)

If you want to show progress in your UI as a loading spinner, you can implement a progress event system:

### 1. Publish Progress Events

```javascript
// Helper to trigger progress events
const publishProgress = (eventTarget, progress, taskId) => {
  triggerEvent(eventTarget, 'WEB_WORKER_PROGRESS', {
    progress,    // number 0-100
    type: 'YOUR_TASK_TYPE', // can be any string identifier
    id: taskId,  // unique task identifier
  });
};

// Usage in your application
async function runTaskWithProgress(data) {
  // Start progress
  publishProgress(eventTarget, 0, data.id);

  try {
    const result = await workerManager.executeTask(
      'my-worker',
      'longRunningTask',
      { data },
      {
        callbacks: [
          (progress) => {
            publishProgress(eventTarget, progress, data.id);
          }
        ]
      }
    );

    // Complete progress
    publishProgress(eventTarget, 100, data.id);

    return result;
  } catch (error) {
    console.error('Task failed:', error);
    throw error;
  }
}
```

Note: Publishing the `WEB_WORKER_PROGRESS` event on Cornerstone's `eventTarget` will automatically trigger the built-in loading spinner. This gives users visual feedback while your worker runs in the background.


## Multiple Methods in One Worker

You can define multiple related methods in a single worker file:

```javascript
// complexWorker.js
import { expose } from 'comlink';

const obj = {
  processingMethod1({ data }, progressCallback) {
    // Implementation
  },

  processingMethod2({ data }, progressCallback) {
    // Implementation
  },

  processingMethod3({ data }, progressCallback) {
    // Implementation
  },

  // Shared helper methods
  _internalHelper() {
    // Helper logic
  }
};

expose(obj);
```
