var module2 = require("./module2");
        console.log("module1");
        module2.foo();
        module.exports = {
            foo: function(){
                console.log("module1 foo !!!");
            }
        };