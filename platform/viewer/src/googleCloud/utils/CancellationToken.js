export default class CancellationToken {
  constructor() {
    this.cancelled = false;
  }

  get() {
    return this.cancelled;
  }

  set(value) {
    this.cancelled = value;
  }
}
