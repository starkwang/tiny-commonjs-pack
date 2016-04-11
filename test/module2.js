var module1 = require("./module1");
        console.log("module2");
        module1.foo();
        module.exports = {
            foo: function(){
                console.log("module2 foo !!!");
            }
        };