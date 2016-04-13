var module2 = require("../module2");
console.log("initialize module1");

console.log("this is module2.foo() in module1:");
module2.foo();
console.log("\n")

module.exports = {
    foo: function() {
        console.log("module1 foo !!!");
    }
};
