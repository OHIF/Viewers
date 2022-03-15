import csTools from 'cornerstone-tools';

class StackSynchronizer {
  constructor() {
    this.sycStrategy = 'Position';
  }

  changeSynchronizationStrategy(newStrategy) {
    if (newStrategy !== 'Index' && newStrategy !== 'Position') {
      throw new Error(`Invalid stack synchronization strategy: ${newStrategy}`);
    }

    if (newStrategy === this.sycStrategy) {
      console.log(`Same stack synchronization strategy: ${newStrategy}`);
      return;
    }

    if (!this.hasOwnProperty(this.sycStrategy)) {
      this.createStrategy(this.sycStrategy);
    }
    if (!this.hasOwnProperty(newStrategy)) {
      this.createStrategy(newStrategy);
    }

    let activeElements = this[this.sycStrategy].getSourceElements();

    // Make a hardcopy of activeElements to avoid errors whilst adding or removing.
    let elements = [];

    for (let i = 0; i < activeElements.length; i++) {
      elements.push(activeElements[i]);
    }

    for (let i = 0; i < elements.length; i++) {
      this[this.sycStrategy].remove(elements[i]);
    }

    for (let i = 0; i < elements.length; i++) {
      this[newStrategy].add(elements[i]);
    }

    this.sycStrategy = newStrategy;
  }

  add(element) {
    if (!this.hasOwnProperty(this.sycStrategy)) {
      this.createStrategy(this.sycStrategy);
    }
    this[this.sycStrategy].add(element);
  }

  remove(element) {
    this[this.sycStrategy].remove(element);
  }

  createStrategy(strategyName) {
    let handler = null;
    if (strategyName === 'Index') {
      handler = csTools.stackImageIndexSynchronizer;
    } else if (strategyName === 'Position') {
      handler = csTools.stackImagePositionSynchronizer;
    }

    this[strategyName] = new csTools.Synchronizer(
      'cornerstonenewimage',
      handler
    );
  }
}

const stackSynchronizer = new StackSynchronizer();

export default stackSynchronizer;
