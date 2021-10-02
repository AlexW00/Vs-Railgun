module.exports = (function () {
  function Queue() {}

  Queue.prototype.running = false;

  Queue.prototype.queue = [];
  Queue.prototype.parameters = [];

  Queue.prototype.add_function = function (callback, parameters) {
    var _this = this;
    this.parameters.push(parameters);
    //add callback to the queue
    this.queue.push(function (params) {
      var finished = callback(params);
      console.log(finished);
      if (typeof finished === "undefined" || finished) {
        //  if callback returns `false`, then you have to
        //  call `next` somewhere in the callback
        _this.next();
      }
    });

    if (!this.running) {
      // if nothing is running, then start the engines!
      this.next();
    }

    return this; // for chaining fun!
  };

  Queue.prototype.isRunning = function () {
    return this.running;
  };

  Queue.prototype.next = async function () {
    this.running = false;
    //get the first element off the queue
    var shift = this.queue.shift(),
      params = this.parameters.shift();
    if (shift) {
      this.running = true;
      shift(params).then(() => {
        if (this.queue.length != 0) this.next();
      });
    }
  };

  return Queue;
})();
