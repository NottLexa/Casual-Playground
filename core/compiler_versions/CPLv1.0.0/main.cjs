var {_cmp} = require('./compiler_main_parser.cjs');
var {_cjc} = require('./compiler_javascript_converter.cjs');

let get = _cmp.get;
let jsconvert = _cjc.convert;

module.exports = {get, jsconvert};