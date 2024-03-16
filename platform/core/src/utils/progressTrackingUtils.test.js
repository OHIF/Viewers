import utils from './progressTrackingUtils';

describe('progressTrackingUtils', () => {
  describe('Creation of lists of tasks to be tracked', () => {
    it('should support creation of task lists', () => {
      expect(utils.createList()).toBeInstanceOf(Object);
    });
    it('should support validation of task lists', () => {
      const list = utils.createList();
      expect(utils.isList(list)).toBe(true);
      expect(utils.isList(JSON.parse(JSON.stringify(list)))).toBe(false);
    });
  });

  describe('Usage of lists of tasks to be tracked', () => {
    let context;

    // Mock for download
    function fakeRequest(callback) {
      return new Promise(resolve => {
        let progress = 0.0;
        setTimeout(function step() {
          if (progress < 1.0) {
            progress += 1 / 4;
            callback(progress);
            setTimeout(step);
            return;
          }
          resolve(true);
        });
      });
    }

    beforeEach(() => {
      const list = utils.createList();
      const observer = jest.fn();
      utils.addObserver(list, observer);
      context = { list, observer };
    });

    it('should call observer twice for each task', () => {
      const { list, observer } = context;
      const promises = [Promise.resolve('A'), Promise.resolve('B'), Promise.resolve('C')];
      promises.forEach(promise => void utils.waitOn(list, promise));
      return Promise.all(promises).then(() => {
        expect(observer).toBeCalledTimes(6);
        [
          {
            failures: 0,
            partial: 0,
            progress: 0,
            total: 1,
          },
          {
            failures: 0,
            partial: 0,
            progress: 0,
            total: 2,
          },
          {
            failures: 0,
            partial: 0,
            progress: 0,
            total: 3,
          },
          {
            failures: 0,
            partial: 1.0,
            progress: 1 / 3,
            total: 3,
          },
          {
            failures: 0,
            partial: 2.0,
            progress: 2 / 3,
            total: 3,
          },
          {
            failures: 0,
            partial: 3.0,
            progress: 1.0,
            total: 3,
          },
        ].forEach((item, i) => {
          const result = expect.objectContaining(item);
          expect(observer).nthCalledWith(i + 1, result, list);
        });
        expect(utils.getOverallProgress(list)).toStrictEqual({
          failures: 0,
          partial: 3.0,
          progress: 1.0,
          total: 3,
        });
      });
    });

    it('should support tasks with internal progress updates', () => {
      const { list, observer } = context;
      const download = utils.addDeferred(list);
      const processing = download.deferred.promise.then(result => result);
      const update = jest.fn(p => void utils.update(download.task, p));
      download.deferred.resolve(fakeRequest(update));
      utils.waitOn(list, processing);
      return processing.then(() => {
        expect(update).toBeCalledTimes(4);
        [0.25, 0.5, 0.75, 1.0].forEach(
          (value, i) => void expect(update).nthCalledWith(i + 1, value)
        );
        expect(observer).toBeCalledTimes(7);
        [
          {
            failures: 0,
            partial: 0,
            progress: 0,
            total: 1,
          },
          {
            failures: 0,
            partial: 0,
            progress: 0,
            total: 2,
          },
          {
            failures: 0,
            partial: 0.25,
            progress: 0.125,
            total: 2,
          },
          {
            failures: 0,
            partial: 0.5,
            progress: 0.25,
            total: 2,
          },
          {
            failures: 0,
            partial: 0.75,
            progress: 0.375,
            total: 2,
          },
          {
            failures: 0,
            partial: 1.0,
            progress: 0.5,
            total: 2,
          },
          {
            failures: 0,
            partial: 2.0,
            progress: 1.0,
            total: 2,
          },
        ].forEach((item, i) => {
          const result = expect.objectContaining(item);
          expect(observer).nthCalledWith(i + 1, result, list);
        });
      });
    });
  });

  describe('Naming of specific tasks', () => {
    it('should support naming specific tasks', () => {
      const list = utils.createList();
      const tasks = [utils.increaseList(list), utils.increaseList(list)];
      expect(utils.setTaskName(list, tasks[0], 'firstTask')).toBe(true);
      expect(utils.setTaskName(list, tasks[1], 'secondTask')).toBe(true);
      expect(utils.getTaskByName(list, 'secondTask')).toBe(tasks[1]);
      expect(utils.getTaskByName(list, 'firstTask')).toBe(tasks[0]);
    });
  });
});
