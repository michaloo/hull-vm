/**
 * This test shows how we initiate and configure the VM
 * Also shows the requirements for the library
 */

const HullVm = require("../src");

describe("hull-vm public API usage", () => {
  /*
   *** Logging ***
   */
  it("should allow to log stuff through console.log and console.info", () => {
    const code = `
      console.log("This log line was logged with log");
      console.info("This log line was logged with info");
    `;
    // expect an option to inspect logs
  });

  /*
   *** Errors handling ***
   */
  it("should handle errors and exceptions", () => {
    const code = `
      const test = getting.variable.from.undefined;
    `;
    // expect an option to inspect errors
  });

  /*
   *** Async operations ***
   */
  it("should allow to perform an async operation", () => {
    const code = `
      return new Promise((resolve) => {
        setTimeout(resolve, 500);
      });
    `;
    // expect to wait for promise resolution
  });

  /**
   *** Multiple items ***
   */
  it("should allow to run multiple items at once, with configured concurrency", () => {
    const code = `
      console.log(user.trait);
    `;
    const payload = [
      {
        trait: "A"
      },
      {
        trait: "B"
      }
    ];
    // expect to receive an array of results
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
    // expect to be able to set a timeout
  });

  it("should allow to set a total timeout for script multiple executions", () => {
    const code = `
      return new Promise((resolve) => {
        setTimeout(resolve, item * 100);
      });
    `;
    const payload = [{ item: 1 }, { item: 2 }, { item: 3 }];
    // expect to be able to set a total timeout for all payloads
  });

  /*
   *** Context ***
   */
  it("should allow to use additional context modules", () => {
    // each time this customModule should be available to
    // the script in the very same state
    // It needs to be frozen to avoid mutation
    const customModule = {
      counter: 0,
      inc: function inc(value = 1) {
        this.counter += value;
      }
    };
    const code = `
      customModule.inc();
      console.log(customModule.counter);
    `;
    const payload = [{}, {}, {}];
    // expect that the customModule yielded the same result
  });

  it("should allow to use additional 'runtime' context", () => {
    class CustomModule {
      constructor(initialCounterValue = 0) {
        this.counter = initialCounterValue;
      }
      inc(value = 1) {
        this.counter += value;
      }
    }
    const code = `
      customModule.inc();
      console.log(customModule.counter);
    `;
    const payload = [
      {
        customModule: new CustomModule(1)
      },
      {
        customModule: new CustomModule(2)
      },
      {
        customModule: new CustomModule(3)
      }
    ];
    // expect that the custom module counter have other values in each case
  });
});
