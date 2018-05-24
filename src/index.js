// @flow
type HullVmOptions = {
  totalTimeout?: string | number,
  singleTimeout?: string | number
};

type HullVmResult = {
  // logs: Array<Object>, // items logged by console.*
  // errors: Array<Object>, // error caused by running the script
  // result: mixed // things returned by the script
};

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
  options: HullVmOptions | void;
  constructor(code: string, options?: HullVmOptions) {
    this.code = code;
    this.options = options; // set defaults
  }

  runSingle(payload: Object): Promise<HullVmResult> {
    return Promise.resolve(payload);
  }

  runMultiple(payload: Array<Object>): Promise<Array<HullVmResult>> {
    return Promise.resolve(payload);
  }
}

module.exports = HullVm;
