import * as coi from './compiler_other_instruments.mjs';
import * as ccb from './compiler_code_blocks.mjs';
import * as cbd from './compiler_block_definers.mjs';

const get = function(code = '', start = 0, end = null)
{
    if (end === null) end = code.length;
    else end = Math.min(end, code.length);
}

export {get};