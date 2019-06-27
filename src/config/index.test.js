import CONFIG from './index.js';

describe('config', () => {
  it('has the expected properties', () => {
    const configurations = Object.keys(CONFIG);

    expect(configurations).toContain('SHOW_STUDY_LIST');
  });
});
