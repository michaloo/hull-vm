// @flow
import type { HullVmOptions } from "./hull-vm";

const _ = require("lodash");
const moment = require("moment");
const urijs = require("urijs");
const superagent = require("superagent");
const Promise = require("bluebird");

const HullVm = require("./hull-vm");

class HullConnectorVm extends HullVm {
  constructor(code: string, options: ?HullVmOptions) {
    const agent = superagent.agent().use(request => {
      // force superagent to return bluebird Promise all the time
      // and support cancelling the request
      const originalThen = request.then;
      request.then = function then(resolve, reject, onCancel) {
        onCancel(() => {
          request.abort();
        });
        return Promise.resolve(originalThen.call(request, resolve, reject));
      };
    });

    options = options || {};
    options.context = {
      ...options.context,
      _,
      moment,
      urijs,
      superagent: agent
    };
    super(code, options);
  }

  wrapCode(code: string): string {
    return `
    (function(logs, payload) {
      const console = ["log", "info", "debug", "warn", "error"]
        .reduce((obj, level) => {
            obj[level] = (...data) => logs.push({ level, data });
            return obj;
        }, {});
      const {
        user,
        segments,
        user_segments,
        account_segments,
        account,
        changes,
        events
      } = payload;
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
}

module.exports = HullConnectorVm;
