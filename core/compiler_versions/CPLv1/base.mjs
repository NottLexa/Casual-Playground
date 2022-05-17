/*
    Copyright © 2022 Alexey Kozhanov

    =====

    This file is part of Casual Playground.

    Casual Playground is free software: you can redistribute it and/or modify it under
the terms of the GNU General Public License as published by the Free Software Foundation,
either version 3 of the License, or (at your option) any later version.

    Casual Playground is distributed in the hope that it will be useful, but WITHOUT ANY
WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR
PURPOSE. See the GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along with
Casual Playground. If not, see <https://www.gnu.org/licenses/>.
*/

/*
Casual Playground Compiler - version 1 (CPLv1)

Hello World!
*/

import * as coi from './compiler_other_instruments.mjs';
import * as ccb from './compiler_code_blocks.mjs';
import * as cep from './compiler_embedded_parts.mjs';
import * as cbd from './compiler_block_definers.mjs';
import * as ccc from "../../compiler_conclusions_cursors.mjs";

const LineType = {
    UNKNOWN: 0,
    ADDNEW: 1,
    ADDCONDBLOCK: 2,
    ADDFALSEBLOCK: 3,
};

const chapter_cell = function(code, startl)
{
    let _, write, concl, cur;
    let l = startl;
    let ret = {};
    if (code.slice(l, l+4) === 'CELL')
    {
        l += 4;
        ret.type = 'CELL';
        [write, concl, cur] = [...coi.split_args1(code, l, '\n')];
        if (!ccc.correct_concl(concl)) return [0, {}, concl, cur];
        if (write.length > 0)
        {
            [_, _, ret.name, concl, cur] = [...cep.string_only_embedded(write[0], 0, cep.DOUBLEQUOTEMARK)];
            if (!ccc.correct_concl(concl)) return [0, {}, concl, cur];
        }
        if (write.length > 1)
        {
            [_, _, ret.desc, concl, cur] = [...cep.string_only_embedded(write[1], 0, cep.DOUBLEQUOTEMARK)];
            if (!ccc.correct_concl(concl)) return [0, {}, concl, cur];
        }
    }
    return [l, ret, new ccc.CompilerConclusion(0), new ccc.CompilerCursor(null)];
};

const chapter_notexture = function(code, startl)
{
    let write, concl, cur;
    let l = startl;
    let ret = {};
    if (code.slice(l, l+9) === 'NOTEXTURE')
    {
        ret.notexture = [0, 0, 0];
        l += 9;
        [l, write, concl, cur] = [...coi.split_args2(code, l)];
        if (!ccc.correct_concl(concl)) return [0, {}, concl, cur];
        if (write.length > 0) ret.notexture[0] = parseInt(write[0]);
        if (write.length > 1) ret.notexture[1] = parseInt(write[1]);
        if (write.length > 2) ret.notexture[2] = parseInt(write[2]);
    }
    return [l, ret, new ccc.CompilerConclusion(0), new ccc.CompilerCursor()];
};

const chapter_localization = function(code, startl){
    let _;
    let l = startl;
    let ret_localization = {};
    if (code.slice(l, l+12) === 'LOCALIZATION')
    {
        l += 12;
        while (code[l++] !== '\n'){}
        while (code.slice(l, l+4)) {
            l += 4;
            let [write, concl, cur] = [...coi.split_args1(code, l, '\n')];
            if (!ccc.correct_concl(concl)) return [0, {}, concl, cur];
            ret_localization[write[0]] = {};
            if (write.length > 1)
            {
                [_, _, ret_localization[write[0]].name, concl, cur] =
                    [...cep.string_only_embedded(write[1], 0, cep.DOUBLEQUOTEMARK)];
                if (!ccc.correct_concl(concl)) return [0, {}, concl, cur];
            }
            if (write.length > 2)
            {
                [_, _, ret_localization[write[0]].desc, concl, cur] =
                    [...cep.string_only_embedded(write[2], 0, cep.DOUBLEQUOTEMARK)];
                if (!ccc.correct_concl(concl)) return [0, {}, concl, cur];

            }
        }
    }
    return [l, ret_localization, new ccc.CompilerConclusion(0), new ccc.CompilerCursor()];
};

const chapter_script = function(code, startl, version)
{
    let l = startl;
    let ret_script = {};
    if (code.slice(l, l+6) === 'SCRIPT')
    {
        l += 6;
        while (code[l] === ' ') l++;
        let write = '';
        while (!('\n '.includes(code[l]))) write += code[l++];
        let script_type = write.toLowerCase();
        while (code[l++] !== '\n'){}
        [l, ret_script[script_type], concl, cur] = [...read_code(code, l, version, 1)];
        if (!ccc.correct_concl(concl)) return [0, {}, concl, cur];
    }
    return [l, ret_script, new ccc.CompilerConclusion(0), new ccc.CompilerCursor()];
};

const get = function(code = '', start = 0, end = null)
{
    if (end === null) end = code.length;
    else end = Math.min(end, code.length);
};

const read_code = function(code, startl, version, tab = 0)
{

};

export {get};