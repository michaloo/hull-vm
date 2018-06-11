/**
 * This test shows how we initiate and configure the VM
 * Also shows the requirements for the library
 */

const Promise = require("bluebird");

const HullVm = require("../src/hull-vm");

describe("hull-vm API usage", () => {
  /*
   *** Logging ***
   */
  it("should allow to log stuff through console.log and console.info", () => {
    const code = `
      console.log("This log line was logged with log");
      console.info("This log line was logged with info");
    `;
    return new HullVm(code).run().then(vmResult => {
      expect(vmResult.logs).toEqual([
        { level: "log", data: ["This log line was logged with log"] },
        {
          level: "info",
          data: ["This log line was logged with info"]
        }
      ]);
    });
  });

  /*
   *** Errors handling ***
   */
  it("should handle errors and exceptions", () => {
    const code = `
      const test = getting.variable.from.undefined;
    `;
    return new HullVm(code).run().then(vmResult => {
      expect(vmResult.error.toString()).toEqual(
        "ReferenceError: getting is not defined"
      );
    });
  });

  it("should allow to return a class instance", () => {
    const code = `
      class Test {
        constructor() {
          this.counter = 1;
        }
        inc(value = 1) {
          return this.counter += value;
        }
      }
      return new Test();
    `;
    return new HullVm(code, { timeout: 100 }).run().then(vmResult => {
      expect(vmResult.result.constructor.name).toEqual("Test");
      expect(vmResult.result.counter).toEqual(1);
    });
  });

  it("should allow to return a function", () => {
    const code = `
      return () => {}
    `;
    return new HullVm(code).run().then(vmResult => {
      expect(typeof vmResult.result).toEqual("function");
    });
  });

  /*
   *** Async operations ***
   */
  it("should allow to perform an async operation", () => {
    const code = `
      return new Promise((resolve) => {
        setTimeout(() => resolve("foo"), 500);
      });
    `;
    return new HullVm(code, { context: { setTimeout } })
      .run()
      .then(vmResult => {
        expect(vmResult.result).toEqual("foo");
      });
  });

  it("should allow to perform a 'cancellable' async operation", () => {
    const code = `
      return new Promise((resolve, reject, onCancel) => {
        setTimeout(() => resolve("foo"), 500);
        onCancel(() => {
          console.log("internal cancel");
        })
      });
    `;
    return new HullVm(code, { timeout: 10, context: { setTimeout } })
      .run()
      .then(vmResult => {
        expect(vmResult.error.message).toEqual(
          "Script timeouted and cancelled"
        );
        expect(vmResult.logs).toEqual([
          { level: "log", data: ["internal cancel"] }
        ]);
      });
  });

  /*
   *** Timeouts ***
   */
  it("should allow to set a timeout for script execution", () => {
    const code = `
      return new Promise((resolve) => {
        setTimeout(resolve, 500);
      });
    `;
    return new HullVm(code, { timeout: 100, context: { setTimeout } })
      .run()
      .then(vmResult => {
        expect(vmResult.error.message).toEqual(
          "Script timeouted and cancelled"
        );
      });
  });

  /*
   *** Context ***
   */
  it("should allow to use global context modules", () => {
    // each time this customModule should be available to
    // the script in the very same state
    // It needs to be frozen to avoid mutation
    const customModule = {
      inc: function inc(value = 1) {
        return value + 1;
      }
    };
    const code = `
      let test = customModule.inc();
      console.log(test);
      test = customModule.inc(test);
      console.log(test);
      customModule.inc = function() {
        return 10;
      }
      return test;
    `;
    const payload = [{}, {}, {}];
    const vm = new HullVm(code, { context: { customModule } });
    return Promise.map(payload, p => vm.run(p)).then(vmResults => {
      expect(vmResults[0].logs[0].data).toEqual([2]);
      expect(vmResults[0].logs[1].data).toEqual([3]);
      expect(vmResults[0].result).toEqual(3);

      expect(vmResults[1].logs[0].data).toEqual([2]);
      expect(vmResults[1].logs[1].data).toEqual([3]);
      expect(vmResults[1].result).toEqual(3);

      expect(vmResults[2].logs[0].data).toEqual([2]);
      expect(vmResults[2].logs[1].data).toEqual([3]);
      expect(vmResults[2].result).toEqual(3);
    });
  });

  it("should not allow any global context object to mutate itself", () => {
    // each time this customModule should be available to
    // the script in the very same state
    // It needs to be frozen to avoid mutation
    const customModule = {
      counter: 0,
      inc: function inc(value = 1) {
        this.counter = this.counter + value;
      }
    };
    const code = `
      customModule.inc();
      console.log(customModule.counter);
      customModule.inc = function() {
        this.counter = 10;
      }
      return customModule.counter;
    `;
    const payload = [{}, {}, {}];
    const vm = new HullVm(code, { context: { customModule } });
    return Promise.map(payload, p => vm.run(p)).then(vmResults => {
      expect(vmResults[0].logs[0].data).toEqual([0]);
      expect(vmResults[1].logs[0].data).toEqual([0]);
      expect(vmResults[2].logs[0].data).toEqual([0]);

      expect(vmResults[0].result).toEqual(0);
      expect(vmResults[1].result).toEqual(0);
      expect(vmResults[2].result).toEqual(0);
    });
  });

  it("should allow to use function paylod", () => {
    class CustomModule {
      constructor(initialCounterValue = 0) {
        this.counter = initialCounterValue;
      }
      inc(value = 1) {
        this.counter += value;
      }
    }
    const code = `
      console.log("preChange", payload.customModule.counter);
      payload.customModule.inc();
      console.log("postChange", payload.customModule.counter);
      return payload.customModule;
    `;
    const payload = [
      {
        customModule: new CustomModule(1)
      },
      {
        customModule: new CustomModule(5)
      },
      {
        customModule: new CustomModule(2)
      }
    ];
    const vm = new HullVm(code);
    return Promise.map(payload, p => vm.run(p)).then(vmResults => {
      expect(vmResults[0].result).toEqual(payload[0].customModule);
      expect(vmResults[0].result).not.toEqual(payload[1].customModule);
      expect(vmResults[0].result.counter).toEqual(2);
      expect(vmResults[0].logs).toEqual([
        { level: "log", data: ["preChange", 1] },
        { level: "log", data: ["postChange", 2] }
      ]);

      expect(vmResults[1].result).toEqual(payload[1].customModule);
      expect(vmResults[1].result.counter).toEqual(6);
      expect(vmResults[1].logs).toEqual([
        { level: "log", data: ["preChange", 5] },
        { level: "log", data: ["postChange", 6] }
      ]);

      expect(vmResults[2].result).toEqual(payload[2].customModule);
      expect(vmResults[2].result.counter).toEqual(3);
      expect(vmResults[2].logs).toEqual([
        { level: "log", data: ["preChange", 2] },
        { level: "log", data: ["postChange", 3] }
      ]);
    });
  });

  it("should not allow to execute process level commands", () => {
    const code = "this.constructor.constructor('return process')().exit()";
    const vm = new HullVm(code);
    return vm.run().then(vmResult => {
      expect(vmResult.error.message).toEqual("process is not defined");
    });
  });

  it.skip("should not allow to execute endless loop", () => {
    const code = "while(true) { }";
    const vm = new HullVm(code, { timeout: 100 });
    return vm.run().then(vmResult => {
      expect(vmResult.error.message).toEqual("Script execution timed out.");
    });
  });
});
