/**
 * This test shows how we initiate and configure the VM
 * Also shows the requirements for the library
 */

const Promise = require("bluebird");

const HullConnectorVm = require("../src/hull-connector-vm");

describe("hull-connector-vm API usage", () => {
  it("should come with lodash out of the box", () => {
    const code = `
      return _.pick(payload, "foo", "bar");
    `;
    return new HullConnectorVm({
      foo: 123,
      bar: 456,
      xyz: 789
    }).run().then(vmResult => {
      console.log(vmResult);
    });
  });

});
