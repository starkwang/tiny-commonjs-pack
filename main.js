import Promise from "bluebird";
import fs_origin from "fs";
var fs = Promise.promisifyAll(fs_origin);

bundle("index.js");

default export function bundle(fileName) {
    var str = "\"{{moduleName}}\":function(module, exports, require, global){\n{{codeContent}}\n},\n";

    var modulesStr = "{\n";

    fs.readFileAsync("index.js", "utf-8")
        .then(contents => {
            var code = str.replace(/{{moduleName}}/, "entry").replace(/{{codeContent}}/, contents);
            modulesStr += code;
            return contents
        })
        .then(contents => matchRequire(contents))
        .then(requires => Promise.map(requires, (moduleName => readModule(moduleName))))
        .then(files => {
            files.forEach(file => {
                modulesStr += str.replace(/{{moduleName}}/, file.moduleName).replace(/{{codeContent}}/, file.data);
            });
            return modulesStr += "}";
        })
        .then(modulesStr => {
            return fs.readFileAsync("packSource.js", "utf-8").then(contents => contents + "(" + modulesStr + ")")
        })
        .then(code => fs.writeFileAsync("bundle.js", code))
        .then(result => log(result))
}

function log(a) {
    console.log(a);
    return a;
}

function readModule(moduleName) {
    return new Promise((resolve, reject) => {
        fs.readFile(moduleName + ".js", "utf-8", (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve({
                    moduleName: moduleName,
                    data: data
                });
            }
        })
    })
}

function matchRequire(code) {
    return code.match(/require\("\S*"\)/g)
        .map(item => item.match(/"\S*"/)[0])
        .map(item => item.substring(1, item.length - 1));
}
