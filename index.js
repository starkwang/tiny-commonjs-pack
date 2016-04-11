var module1 = require("./module1");
var module2 = require("./module2");
module1.foo();
module2.foo();
function hello(){
    console.log("Hello!");
}
module.exports = hello;