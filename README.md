# Hull VM

This is an unified VM runtime for running custom, external scripts in sane and safe environment.

**First initialize the VM:**
Do it only once per code/context!
```js
const HullConnectorVm = require("hull-vm/lib/hull-connector-vm");
const vm = new HullConnectorVm(`
  console.log(user.traits_coconuts);
`);
```

**Then, run the script agains different payloads:**
You can do it multiple times without significant performance penalty!
```js
const payloads = [
  { user: { traits_coconuts: 11 } },
  { user: { traits_coconuts: 12 } },
  { user: { traits_coconuts: 10 } }
];
Promise.map(payloads, p => vm.run(p))
  .then((vmResults) => {
    console.log(vmResults[0].logs[0]);
  });
