import Promise from "bluebird";
import fs_origin from "fs";
import * as js_beautify from "js-beautify";

var beautify = js_beautify.js_beautify;
var fs = Promise.promisifyAll(fs_origin);

if(process.argv[2]){
    console.log("starting bundle " + process.argv[2]);
    bundle(process.argv[2]);
}else{
    console.log("No File Input");
}



export default function bundle(fileName) {
    var str = "\"{{moduleName}}\":function(module, exports, require, global){\n{{codeContent}}\n},\n";

    var modulesStr = "{\n";

    fs.readFileAsync(fileName, "utf-8")
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
        .then(modulesStr => fs.readFileAsync("packSource.js", "utf-8").then(contents => contents + "(" + modulesStr + ")"))
        .then(code => fs.writeFileAsync("./bundle.js", beautify(code)))
        .then(() => console.log("bundle success"))
        .catch(err => console.log("bundle Error!\n", err))
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
