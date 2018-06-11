# Hull VM

This is an unified VM runtime for running customer scripts.

```js
// First initialize the VM
// do it once per script and context
const vm = new HullVm(`
  console.log(user.traits_coconuts);
`);

// then call `run` with different payloads
vm.run({
  user: {
    traits_coconuts: 11
  }
})
.then((vmResult) => {
  console.log(vmResults.logs[0]);
});
````
