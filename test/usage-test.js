/**
 * This test shows how we initiate and configure the VM
 * Also shows the requirements for the library
 */

const HullVm = require("../src");

describe("hull-vm public API usage", () => {
  it("should allow to log stuff through console.log and console.info", () => {
    const code = `
      console.log("This log line is shown in preview, but not in the 'actual' run");
      console.info("This log line is shown both in preview and in the 'actual' run");
    `;
    // normal mode
    return new HullVm(code).runSingle({}).then(vmResult => {
      console.log(vmResult.logs);
    });
  });

  it("should handle errors and exceptions", () => {
    const code = `
      const test = getting.variable.from.undefined;
    `;
    return new HullVm(code).runSingle({}).then(vmResult => {
      console.log(vmResult.errors);
    });
  });

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

  it("should allow to use additional 'global' modules", () => {
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
    return new HullVm(code, { globalModules: { customModule } })
      .runMultiple(payload)
      .then(vmResults => {
        console.log(vmResults[0].logs);
        console.log(vmResults[1].logs);
        console.log(vmResults[2].logs);
      });
  });

  it("should allow to use additional 'runtime' modules", () => {
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
