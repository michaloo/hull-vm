// @flow
const Promise = require("bluebird");
const { VMScript, VM } = require("vm2");
const debug = require("debug")("hull-vm");
const ms = require("ms");
// const deepFreeze = require("deep-freeze");
const cloneDeep = require("clone-deep");

type HullVmOptions = {
  timeout: string | number,
  context: Object
};

type HullVmResult = {
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
 * - multiple async items
 * - timeouts for both single payload item and for total execution time
 * - passing additional modules which should be frozen
 */
class HullVm {
  code: string;
  globalContext: Object;
  options: HullVmOptions;
  vmScript: VMScript;

  constructor(code: string, options: ?HullVmOptions) {
    // console.log(esprima.tokenize(code).indexOf({ type: 'Keyword', value: 'class' }));
    this.code = code;
    this.options = {
      context: {},
      timeout: "5s",
      ...options
    };
    this.globalContext = {
      ...this.options.context,
      Promise
    };
    this.vmScript = new VMScript(this.wrapCode(code));
  }

  wrapCode(code: string): string {
    return `
    try {
      Promise.resolve(function() {
        ${code};
      }());
    } catch (rawError) {
      Promise.reject(rawError);
    }`;
  }

  run(runtimeContext: Object = {}): Promise<HullVmResult> {
    const timeout =
      typeof this.options.timeout === "number"
        ? this.options.timeout
        : ms(this.options.timeout);
    const logs = [];
    const context = {
      console: {
        log: (...data) => logs.push({ level: "log", data }),
        info: (...data) => logs.push({ level: "info", data })
      },
      logs,
      ...cloneDeep(this.globalContext),
      ...runtimeContext
    };
    const vmOptions = {
      timeout,
      console: "off",
      sandbox: context,
      wrapper: "none"
    };
    debug("prerun", vmOptions);
    const vm = new VM(vmOptions);

    return new Promise((resolve, reject) => {
      let promise;
      try {
        promise = vm.run(this.vmScript);
      } catch (error) {
        return resolve({
          logs,
          result: null,
          error
        });
      }
      setTimeout(() => {
        debug("timeout");
        let errorMessage = "Script timeouted";
        if (promise.cancel) {
          promise.cancel("timeout");
          errorMessage = "Script timeouted and cancelled";
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
