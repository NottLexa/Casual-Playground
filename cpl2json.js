const comp = require('./core/compiler.cjs');
const fs = require('fs');
const path = require('path');
var arguments = process.argv.slice(2);
var compiled = comp.get(fs.readFileSync(path.join(__dirname, arguments[0]), {encoding: "utf8"}));
var jsoned_cell = {};
for (let k in compiled[0])
{
    if (compiled[0].hasOwnProperty(k) && compiled[0][k] !== 'script') jsoned_cell[k] = compiled[0][k];
}
var jsoned_conclusion = {code: compiled[1].code, description: compiled[1].description};
var jsoned_cursor = {sl: compiled[2].sl, el: compiled[2].el, sh: compiled[2].sh, eh: compiled[2].eh, txt: compiled[2].txt};
var jsoned = {
    cell: jsoned_cell,
    conc: jsoned_conclusion,
    curs: jsoned_cursor
};
console.log(JSON.stringify(jsoned));