const dataTransfer = new DataTransfer();

export const DragSimulator = {
  MAX_TRIES: 1,
  DELAY_INTERVAL_MS: 10,
  counter: 0,
  rectsEqual(r1, r2) {
    return (
      r1.top === r2.top && r1.right === r2.right && r1.bottom === r2.bottom && r1.left === r2.left
    );
  },
  get dropped() {
    const currentSourcePosition = this.source.getBoundingClientRect();
    return !this.rectsEqual(this.initialSourcePosition, currentSourcePosition);
  },
  get hasTriesLeft() {
    return this.counter < this.MAX_TRIES;
  },
  dragstart() {
    cy.log('**DRAG START**');
    cy.wrap(this.source)
      .trigger('mousedown', { which: 1, button: 0 })
      .trigger('dragstart', { dataTransfer })
      .trigger('drag', {});
  },
  drop() {
    cy.log('**DROP**');
    return cy
      .wrap(this.target)
      .trigger('mousemove', 'center')
      .trigger('dragover', { dataTransfer, force: true })
      .trigger('drop', { dataTransfer, force: true })
      .trigger('dragend', { dataTransfer })
      .trigger('mouseup', { which: 1, button: 0 });
  },
  dragover() {
    cy.log('**DRAGOVER**');
    if (!this.dropped && this.hasTriesLeft) {
      this.counter += 1;
      return cy
        .wrap(this.target)
        .trigger('mousemove', 'center')
        .trigger('dragover', {
          dataTransfer,
          position: this.position,
        })
        .wait(this.DELAY_INTERVAL_MS)
        .then(() => this.dragover());
    }
    return this.drop().then(() => true);
  },
  init(source, target, position) {
    this.source = source;
    this.target = target;
    this.position = position;
    this.counter = 0;

    this.dragstart();

    return cy.wait(this.DELAY_INTERVAL_MS).then(() => {
      this.initialSourcePosition = this.source.getBoundingClientRect();
      return this.dragover();
    });
  },
  simulate(sourceWrapper, targetSelector, position = 'center') {
    return cy
      .get(targetSelector)
      .then(targetWrapper => this.init(sourceWrapper.get(0), targetWrapper.get(0), position));
  },
};
