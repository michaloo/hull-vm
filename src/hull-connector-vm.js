// @flow
import type { HullVmOptions } from "./hull-vm";

const _ = require("lodash");
// const crypto = require("crypto");
const moment = require("moment");
const Promise = require("bluebird");
// const rp = require("request-promise");
const superagent = require("superagent");
const urijs = require("urijs");

Promise.config({
  cancellation: true
});

const HullVm = require("./hull-vm");

class HullConnectorVm extends HullVm {
  constructor(
    code: string,
    providedContext: ?Object = {},
    options: ?HullVmOptions = {}
  ) {
    const agent = superagent.agent().use(request => {
      // force superagent to return bluebird Promise all the time
      // and support cancelling the request
      const originalThen = request.then;
      const promise = new Promise((resolve, reject, onCancel) => {
        onCancel(() => {
          request.abort();
        });
        originalThen.call(request, resolve, reject);
      });
      request.then = promise.then.bind(promise);
      request.catch = promise.catch.bind(promise);
      request.cancel = promise.cancel.bind(promise);
    });

    providedContext = {
      ...(providedContext || {}),
      _,
      moment,
      urijs,
      superagent: agent
      // TODO: crypto and rp are not friendly with deepFreeze
      // crypto,
      // rp
    };
    super(code, providedContext, options);
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
