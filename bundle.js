(function(modules) {
    var installedModules = {};

    function require(moduleName) {
        //如果模块已经导入，那么直接返回它的exports
        if (installedModules[moduleName]) {
            return installedModules[moduleName].exports;
        }

        //模块初始化
        var module = installedModules[moduleName] = {
            exports: {},
            name: moduleName,
            loaded: false
        };

        //执行模块内部的代码，这里的 modules 变量即为我们在上面写好的 modules 对象
        modules[moduleName].call(module.exports, module, module.exports, require);
        //模块导入完成
        module.loaded = true;
        //将模块的exports返回
        return module.exports;
    }
    return require(0);
})([function(module, exports, require, global) {
        var module1 = require(1);
        module1.foo();

        function hello() {
            console.log("Hello!");
        }
        module.exports = hello;
    },
    function(module, exports, require, global) {
        var module2 = require(2);
        console.log("initialize module1");

        console.log("this is module2.foo() in module1:");
        module2.foo();
        console.log("\n")

        module.exports = {
            foo: function() {
                console.log("module1 foo !!!");
            }
        };

    },
    function(module, exports, require, global) {
        console.log("initialize module2");
        module.exports = {
            foo: function() {
                console.log("module2 foo !!!");
            }
        };

    },
])