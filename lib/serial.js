(function () {
  // Runs async tasks strictly one after another. Used to make read-modify-write on storage atomic.
  function createSerialQueue() {
    let tail = Promise.resolve();
    return function run(task) {
      const result = tail.then(task);
      tail = result.catch(() => {}); // a failed task must not block the ones queued behind it
      return result;
    };
  }

  const api = { createSerialQueue };
  globalThis.DictExt = Object.assign(globalThis.DictExt || {}, api);
  if (typeof module !== "undefined") module.exports = api;
})();
