import Promise from "bluebird";
import fs_origin from "fs";
import { js_beautify } from "js-beautify";
import path from "path";

var fs = Promise.promisifyAll(fs_origin);

var __MODULES = [
    // 0: 'index',
    // 1: 'module1'
    // 2: 'test/module2'
];


if (process.argv[2]) {
    console.log("starting bundle " + process.argv[2]);
    pack(process.argv[2]);
} else {
    console.log("No File Input");
}


function pack(fileName) {
    var name = fileName.replace(/\.js/, "");
    var str = "function(module, exports, require, global){\n{{moduleContent}}\n},\n";
    bundleModule(name, './')
        .then(() => {
            console.log(__MODULES);
            return Promise.map(__MODULES, (moduleName => parseRequire(moduleName)))
        })
        .then(moduleContents => {
            var modules = "[";
            moduleContents.forEach(content => {
                modules += str.replace(/{{moduleContent}}/, content);
            })
            return modules += "]"
        })
        .then(modules => fs.readFileAsync("packSource.js", "utf-8").then(content => content + "(" + modules + ")"))
        .then(result => js_beautify(result))
        .then(x => log(x))
        .then(result => fs.writeFileAsync("bundle.js", result))
        .then(() => console.log("bundle success!"));
}


function bundleModule(moduleName, nowPath) {
    console.log("reading :", path.normalize(nowPath + moduleName + '.js'));
    return fs.readFileAsync(path.normalize(nowPath + moduleName + '.js'), 'utf-8')
        .then(contents => {
            __MODULES.push(path.normalize(nowPath + moduleName))
            return contents;
        })
        .then(contents => matchRequire(contents))
        .then(requires => {

            if (requires.length > 0) {
                return Promise.map(requires, (requireName => {
                    return bundleModule(requireName, path.dirname(nowPath + moduleName) + "/")
                }))
            } else {
                return Promise.resolve();
            }
        })
}


function parseRequire(moduleName) {
    var dirPath = path.dirname(moduleName) + '/';
    return fs.readFileAsync(moduleName + '.js', 'utf-8')
        .then(code => {
            matchRequire(code).forEach(item => {
                var reg1 = new RegExp("require\\(\"" + item + "\"\\)");
                var reg2 = new RegExp("require\\(\'" + item + "\'\\)");
                var modulePath = path.normalize(dirPath + item);
                var moduleID = __MODULES.indexOf(modulePath);
                code = code.replace(reg1, "require(" + moduleID + ")").replace(reg2, "require(" + moduleID + ")");
            })
            return code;
        })
}


function matchRequire(code) {
    var requires1 = code.match(/require\("\S*"\)/g) || [];
    var requires2 = code.match(/require\('\S*'\)/g) || [];
    return requires1.map(item => item.match(/"\S*"/)[0]).map(item => item.substring(1, item.length - 1))
        .concat(requires2.map(item => item.match(/'\S*'/)[0]).map(item => item.substring(1, item.length - 1)));
}


function log(a) {
    console.log(a);
    return a;
}
