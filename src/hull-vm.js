// @flow
const Promise = require("bluebird");
const vm = require("vm");
const debug = require("debug")("hull-vm");
const ms = require("ms");
const deepFreeze = require("deep-freeze");
const cloneDeep = require("clone-deep");

export type HullVmOptions = {
  timeout?: string | number
};

export type HullVmResult = {
  logs: Array<{ level: string, data: Object }>, // items logged by console.*
  error: mixed, // error caused by running the script
  result: mixed // things returned by the script
};

Promise.config({
  cancellation: true
});

/**
 * This class wraps around native NodeJS VM.
 *
 * Is responsible for handling
 * - console.* methods
 * - async scripts - returning a Promise
 * - timeouts
 * - passing additional modules which should be frozen
 */
class HullVm {
  options: HullVmOptions;
  userScript: (Array<Object>, Object) => Promise<*>;

  constructor(
    code: string,
    providedContext: ?Object = {},
    options: ?HullVmOptions = {}
  ) {
    if (typeof code !== "string") {
      throw new Error(`Provided code must be a string, ${typeof code} given.`);
    }
    debug("options", options);
    this.options = {
      timeout: "5s",
      ...options
    };

    const context = Object.assign(
      vm.createContext(vm.runInNewContext("({})")),
      {
        Promise: cloneDeep(Promise),
        ...deepFreeze(providedContext || {})
      }
    );
    debug("built context");

    const timeout =
      typeof this.options.timeout === "number"
        ? this.options.timeout
        : ms(this.options.timeout);

    debug("timeout", timeout);
    this.userScript = vm.runInContext(this.wrapCode(code), context, {
      timeout
    });
    debug("run userScript");
  }

  wrapCode(code: string): string {
    return `
    (function(logs, payload) {
      const console = ["log", "info", "debug", "warn", "error"]
        .reduce((obj, level) => {
            obj[level] = (...data) => logs.push({ level, data });
            return obj;
        }, {});
      try {
        return Promise.resolve(function() {
          ${code};
        }());
      } catch (rawError) {
        return Promise.reject(rawError);
      }
    });
    `;
  }

  run(runtimeContext: Object = {}): Promise<HullVmResult> {
    const timeout =
      typeof this.options.timeout === "number"
        ? this.options.timeout
        : ms(this.options.timeout);
    const logs = [];

    return new Promise((resolve, reject) => {
      let promise;
      try {
        promise = this.userScript(logs, runtimeContext);
      } catch (error) {
        return resolve({
          logs,
          result: null,
          error
        });
      }
      setTimeout(() => {
        debug("timeout");
        let errorMessage = "Script timedout";
        if (promise.cancel) {
          promise.cancel("timeout");
          errorMessage = "Script timedout and cancelled";
        }
        return resolve({
          result: null,
          error: new Error(errorMessage),
          logs
        });
      }, timeout);
      return promise
        .then(result => {
          debug("raw result", result);
          return {
            logs,
            result,
            error: null
          };
        })
        .catch(error => {
          return {
            logs,
            result: null,
            error
          };
        })
        .then(resolve, reject);
    });
  }
}

module.exports = HullVm;
