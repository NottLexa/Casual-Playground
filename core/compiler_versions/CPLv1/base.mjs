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
import * as cvd from './compiler_value_determinants.mjs';
import * as ccc from "../../compiler_conclusions_cursors.mjs";

const LineType = {
    UNKNOWN: 0,
    ADDNEW: 1,
    ADDCONDBLOCK: 2,
    ADDFALSEBLOCK: 3,
};
const CodeStructures = new Set(['WHILE', 'IF', 'ELSEIF', 'ELSE']);

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
    let code_sequence = new ccb.BlockSequence();
    let end = code.length;
    let l = startl;
    let spaces = 0;
    while (l < end)
    {
        spaces = 0;
        while (code[l] === ' ')
        {
            l++;
            spaces++;
        }
        if (spaces < tab*4) break;
        else if (spaces > tab*4)
            return [0, new ccb.BlockSequence(), new ccc.CompilerConclusion(206), new ccc.CompilerCursor(code, l)];
        else
        {
            let [linetype, block, l1, concl, cur] = read_line(code, l-spaces, version, tab)
            cur = new ccc.CompilerCursor(code, l, l1, cur.sl, cur.el);
            l = l1;
            if (!ccc.correct_concl(concl)) return [0, new ccb.BlockSequence(), concl, cur];
            switch (linetype)
            {
                case LineType.ADDNEW:
                    code_sequence.add(block);
                    break;
                case LineType.ADDCONDBLOCK:
                    if (code_sequence.blocks[code_sequence.blocks.length-1].constructor.name === ccb.Gate.name)
                        code_sequence[-1].cb.push(block);
                    else
                        return [0, new ccb.BlockSequence(),
                            new ccc.CompilerConclusion(207), new ccc.CompilerCursor()];
                    break;
                case LineType.ADDFALSEBLOCK:
                    if (code_sequence.blocks[code_sequence.blocks.length-1].constructor.name === ccb.Gate.name)
                        if (code_sequence[-1].fb === null) code_sequence[-1].fb = block;
                        else return [0, new ccb.BlockSequence(),
                            new ccc.CompilerConclusion(209), new ccc.CompilerCursor()];
                    else
                        return [0, new ccb.BlockSequence(),
                            new ccc.CompilerConclusion(208), new ccc.CompilerCursor()];
                    break;
                default:
                    code_sequence.add(block);
                    break;
            }
        }
    }
    return [l-spaces, code_sequence, new ccc.CompilerConclusion(0), new ccc.CompilerCursor()];
};

const read_line = function(code, startl, version, tab = 0)
{
    let l = startl;
    let value, block, seq, write, concl, cur;
    [l, write, concl, cur] = [...coi.split_args2(code, l)];
    if (!ccc.correct_concl(concl)) return [LineType.ADDNEW, new ccb.Block(ccb.UNKNOWNBLOCK), 0, concl, cur];
    else if (CodeStructures.has(write[0]))
    {
        if (write[0] !== 'ELSE')
        {
            [value, concl, cur] = [...cvd.value_determinant(write.slice(1))];
            if (!ccc.correct_concl(concl)) return [LineType.UNKNOWN, new ccb.Block(ccb.UNKNOWNBLOCK), 0, concl, cur];
        }
        [l, seq, concl, cur] = read_code(code, l, version, tab+1);
        switch (write[0])
        {
            case 'WHILE':
                return [LineType.ADDNEW, new ccb.While(value, seq), l, concl, cur];
            case 'IF':
                return [LineType.ADDNEW, new ccb.Gate([[value, seq]]), l, concl, cur];
            case 'ELSEIF':
                return [LineType.ADDCONDBLOCK, [value, seq], l, concl, cur];
            case 'ELSE':
                return [LineType.ADDFALSEBLOCK, seq, l, concl, cur];
        }
    }
    else
    {
        [block, concl, cur] = [...cbd.definer(write)];
        return [LineType.ADDNEW, block, l, concl, cur];
    }
};

export {get};