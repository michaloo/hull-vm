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
    return new HullVm(code).runSingle({}).then(vmResult => {
      console.log(vmResult.logs);
    });
  });

  /*
   *** Errors handling ***
   */
  it("should handle errors and exceptions", () => {
    const code = `
      const test = getting.variable.from.undefined;
    `;
    return new HullVm(code).runSingle({}).then(vmResult => {
      console.log(vmResult.errors);
    });
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
    return new HullVm(code).runSingle({}).then(vmResult => {
      console.log(vmResult.errors);
    });
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
    return new HullVm(code, { concurrency: 2 })
      .runMultiple(payload)
      .then(vmResults => {
        console.log(vmResults);
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
    return new HullVm(code, { singleTimeout: 100 })
      .runSingle({})
      .then(vmResult => {
        console.log(vmResult.errors);
      });
  });

  it("should allow to set a total timeout for script multiple executions", () => {
    const code = `
      return new Promise((resolve) => {
        setTimeout(resolve, item * 100);
      });
    `;
    const payload = [{ item: 1 }, { item: 2 }, { item: 3 }];
    return new HullVm(code, { totalTimeout: 250, singleTimeout: 150 })
      .runMultiple(payload)
      .then(vmResults => {
        // I expect that the whole promise should be resolved,
        // first two items should be successful
        // last item should be errored out
        console.log(vmResults[0].errors);
        console.log(vmResults[1].errors);
        console.log(vmResults[2].errors);
      });
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
    return new HullVm(code, { context: { customModule } })
      .runMultiple(payload)
      .then(vmResults => {
        console.log(vmResults[0].logs);
        console.log(vmResults[1].logs);
        console.log(vmResults[2].logs);
      });
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
    return new HullVm(code).runMultiple(payload).then(vmResults => {
      console.log(vmResults[0].logs);
      console.log(vmResults[1].logs);
      console.log(vmResults[2].logs);
    });
  });
});
