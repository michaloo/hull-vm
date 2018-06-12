/**
 * This test shows how we initiate and configure the VM
 * Also shows the requirements for the library
 */

const nock = require("nock");

const HullConnectorVm = require("../src/hull-connector-vm");

describe("hull-connector-vm API usage", () => {
  it("should come with lodash out of the box", () => {
    const code = `
      return _.pick(payload, "foo", "bar");
    `;
    return new HullConnectorVm(code)
      .run({
        foo: 123,
        bar: 456,
        xyz: 789
      })
      .then(vmResult => {
        expect(vmResult.result).toEqual({
          foo: 123,
          bar: 456
        });
      });
  });

  it("should come with moment out of the box", () => {
    const code = `
      return moment("2013-02-08 09:30:26.123").format("X");
    `;
    return new HullConnectorVm(code).run().then(vmResult => {
      expect(vmResult.result).toEqual("1360312226");
    });
  });

  it("should prevent changing functions", () => {
    const code = `
      const test = _.camelCase("Foo Bar");
      _.camelCase = () => "xyz"
      return test;
    `;
    return new HullConnectorVm(code).run().then(vmResult => {
      expect(vmResult.result).toEqual("fooBar");
    });
  });

  describe("superagent", () => {
    it("should come with superagent out of the box", () => {
      nock("http://example.com")
        .get("/test")
        .reply(200, {
          foo: "bar"
        });
      const code = `
        return superagent.get("http://example.com/test")
      `;
      return new HullConnectorVm(code).run().then(vmResult => {
        expect(vmResult.result.body).toEqual({ foo: "bar" });
      });
    });

    it("should handle errors", () => {
      nock("http://example.com")
        .get("/test")
        .reply(503, {
          error: "message"
        });
      const code = `
        return superagent.get("http://example.com/test")
      `;
      return new HullConnectorVm(code).run().then(vmResult => {
        expect(vmResult.error.message).toEqual("Service Unavailable");
        expect(vmResult.error.response.body).toEqual({ error: "message" });
      });
    });

    it("should handle timeouts", () => {
      nock("http://example.com")
        .get("/test")
        .delay(200)
        .reply(200);
      const code = `
        return superagent.get("http://example.com/test")
      `;
      return new HullConnectorVm(code, {}, { timeout: 100 })
        .run()
        .then(vmResult => {
          expect(vmResult.error.message).toEqual(
            "Script timedout and cancelled"
          );
        });
    });

    it("should allow to cancel a script", done => {
      const requestInterceptor = nock("http://example.com")
        .get("/test")
        .reply(200);
      const code = `
        setTimeout(() => {
          return superagent.get("http://example.com/test")
        }, 100);
      `;
      const promise = new HullConnectorVm(code, {}, { timeout: 100 }).run();

      setTimeout(() => {
        promise.cancel();
      }, 50);
      setTimeout(() => {
        expect(requestInterceptor.isDone()).toEqual(false);
        done();
      }, 200);
    });
  });
});
