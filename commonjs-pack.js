import Promise from "bluebird";
import fs_origin from "fs";
import { js_beautify } from "js-beautify";
import path from "path";

var fs = Promise.promisifyAll(fs_origin);

//__MODULES用于映射moduleID
var __MODULES = [
    // 0: 'index',
    // 1: 'module1'
    // 2: 'test/module2'
];

//读取命令行参数
if (process.argv[2]) {
    console.log("starting bundle " + process.argv[2]);
    pack(process.argv[2]);
} else {
    console.log("No File Input");
}

var outputFile = process.argv[3] || "bundle.js"

function pack(fileName) {
    var name = fileName.replace(/\.js/, "");

    var moduleTemplate = "function(module, exports, require, global){\n{{moduleContent}}\n}";

    //递归打包
    bundleModule(name, './')
        .then(() => {
            console.log(__MODULES);

            //把模块名替换成数字ID
            return Promise.map(__MODULES, (moduleName => replaceRequireWithID(moduleName)))
        })
        .then(moduleContents => {
            //合并模块
            var modules = [];
            moduleContents.forEach(content => {
                modules.push(moduleTemplate.replace(/{{moduleContent}}/, content));
            })
            return '[\n' + modules.join(',\n') + '\n]'
        })
        //输出
        .then(modules => fs.readFileAsync("packSource.js", "utf-8")
        .then(content => content + "(" + modules + ")"))
        .then(result => js_beautify(result))
        .then(x => log(x))
        .then(result => fs.writeFileAsync(outputFile, result))
        .then(() => console.log("bundle success!"));
}


//递归打包的方法
//接收两个参数：moduleName是模块名，nowPath是当前路径
function bundleModule(moduleName, nowPath) {
    console.log("reading :", path.normalize(nowPath + moduleName + '.js'));
    return fs.readFileAsync(path.normalize(nowPath + moduleName + '.js'), 'utf-8')
        .then(contents => {
            //在__MODULES中注册这个模块名
            __MODULES.push(path.normalize(nowPath + moduleName))
            return contents;
        })
        .then(contents => matchRequire(contents))//解析出require
        .then(requires => {
            if (requires.length > 0) {
                //对每个require分别递归打包
                return Promise.map(requires, (requireName => {
                    return bundleModule(requireName, path.dirname(nowPath + moduleName) + "/")
                }))
            } else {
                return Promise.resolve();
            }
        })
}

//把模块名替换成ID的方法
//接收一个参数：moduleName即模块名
function replaceRequireWithID(moduleName) {
    var dirPath = path.dirname(moduleName) + '/';
    return fs.readFileAsync(moduleName + '.js', 'utf-8')
        .then(code => {
            matchRequire(code).forEach(item => {
                var regRequire = new RegExp(
                	"require\\(\"" + item + "\"\\)|" +
                	"require\\(\'" + item + "\'\\)"
                );
                var modulePath = path.normalize(dirPath + item);
                var moduleID = __MODULES.indexOf(modulePath);
                code = code.replace(regRequire, "require(" + moduleID + ")");
            })
            return code;
        })
}


//解析依赖的模块名
function matchRequire(code) {
    var requires = code.match(/require\("\S*"\)|require\('\S*'\)/g) || [];
    return requires
    	.map(item => item.match(/"\S*"|'\S*'/)[0])
    	.map(item => item.substring(1, item.length - 1));
}


function log(a) {
    console.log(a);
    return a;
}
