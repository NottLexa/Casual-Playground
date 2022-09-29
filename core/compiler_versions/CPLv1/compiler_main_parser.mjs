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

import {_coi} from './compiler_other_instruments.mjs';
import {_ccb} from './compiler_code_blocks.mjs';
import {_cep} from './compiler_embedded_parts.mjs';
import {_cbd} from './compiler_block_definers.mjs';
import {_cvd} from './compiler_value_determinants.mjs';
import * as _ccc from "../../compiler_conclusions_cursors.mjs";

const cmp = function(coi, ccb, cep, cbd, cvd, ccc)
{
    this.LineType = {
        UNKNOWN: 0,
        ADDNEW: 1,
        ADDCONDBLOCK: 2,
        ADDFALSEBLOCK: 3,
    };
    this.CodeStructures = new Set(['WHILE', 'IF', 'ELSEIF', 'ELSE']);

    let self = this;

    this.cut_comments = function(code, start)
    {
        let new_code = '';
        let l0, l1, emb, concl, cur;
        for (let i = start; i < code.length; i++)
        {
            [l0, l1, emb, concl, cur] = cep.string_embedded(code, i, cep.COMMENT);
            if (ccc.correct_concl(concl)) i = l1;
            if (i < code.length) new_code += code[i];
            else break;
        }
        return new_code;
    };

    this.chapter_cell = function(code, startl)
    {
        let _, write, concl, cur;
        let l = startl;
        let ret = {};
        if (code.slice(l, l+4) === 'CELL')
        {
            l += 4;
            ret.type = 'CELL';
            [write, concl, cur] = coi.split_args1(code, l, '\n');
            if (!ccc.correct_concl(concl)) return [0, {}, concl, cur];
            if (write.length > 0)
            {
                [_, _, ret.name, concl, cur] = cep.string_only_embedded(write[0], 0, cep.DOUBLEQUOTEMARK);
                if (!ccc.correct_concl(concl)) return [0, {}, concl, cur];
            }
            if (write.length > 1)
            {
                [_, _, ret.desc, concl, cur] = cep.string_only_embedded(write[1], 0, cep.DOUBLEQUOTEMARK);
                if (!ccc.correct_concl(concl)) return [0, {}, concl, cur];
            }
        }
        return [l, ret, new ccc.CompilerConclusion(0), new ccc.CompilerCursor(null)];
    };

    this.chapter_notexture = function(code, startl)
    {
        let write, concl, cur;
        let l = startl;
        let ret = {};
        if (code.slice(l, l+9) === 'NOTEXTURE')
        {
            ret.notexture = [0, 0, 0];
            l += 9;
            [l, write, concl, cur] = coi.split_args2(code, l);
            if (!ccc.correct_concl(concl)) return [0, {}, concl, cur];
            if (write.length > 0) ret.notexture[0] = parseInt(write[0]);
            if (write.length > 1) ret.notexture[1] = parseInt(write[1]);
            if (write.length > 2) ret.notexture[2] = parseInt(write[2]);
        }
        return [l, ret, new ccc.CompilerConclusion(0), new ccc.CompilerCursor()];
    };

    this.chapter_localization = function(code, startl)
    {
        let _1, _2;
        let l = startl;
        let ret_localization = {};
        if (code.slice(l, l+12) === 'LOCALIZATION')
        {
            l += 12;
            while (code[l++] !== '\n'){}
            while (code.slice(l, l+4) === '    ')
            {
                l += 4;
                let [write, concl, cur] = coi.split_args1(code, l, '\n');
                if (!ccc.correct_concl(concl)) return [0, {}, concl, cur];
                ret_localization[write[0]] = {};
                if (write.length > 1)
                {
                    [_1, _2, ret_localization[write[0]].name, concl, cur] =
                        cep.string_only_embedded(write[1], 0, cep.DOUBLEQUOTEMARK);
                    if (!ccc.correct_concl(concl)) return [0, {}, concl, cur];
                }
                if (write.length > 2)
                {
                    [_1, _2, ret_localization[write[0]].desc, concl, cur] =
                        cep.string_only_embedded(write[2], 0, cep.DOUBLEQUOTEMARK);
                    if (!ccc.correct_concl(concl)) return [0, {}, concl, cur];
                }
            }
        }
        return [l, ret_localization, new ccc.CompilerConclusion(0), new ccc.CompilerCursor()];
    };

    this.chapter_script = function(code, startl, version)
    {
        let concl, cur;
        let l = startl;
        let ret_script = {};
        if (code.slice(l, l+6) === 'SCRIPT')
        {
            l += 6;
            while (code[l] === ' ') l++;
            let write = '';
            while (!('\n\r '.includes(code[l]))) write += code[l++];
            let script_type = write.toLowerCase();
            while (code[l++] !== '\n'){}
            [l, ret_script[script_type], concl, cur] = self.read_code(code, l, version, 1);
            if (!ccc.correct_concl(concl)) return [0, {}, concl, cur];
        }
        return [l, ret_script, new ccc.CompilerConclusion(0), new ccc.CompilerCursor()];
    };

    this.get = function(native_code = '', start = 0, end_at = null)
    {
        let code = self.cut_comments(native_code, start);

        let end;
        if (end_at === null) end = code.length;
        else end = Math.min(end_at, code.length);
        let ret = {
            version: 1,
            type: 'CELL',
            name: 'Cell',
            desc: 'No description given.',
            notexture: [255, 255, 255],
            localization: {},
            script: {
                create: undefined,
                step: undefined,
            },
        };
        let l = 0;
        let ret_expand, concl, cursor;
        while (l < end)
        {
            [l, ret_expand, concl, cursor] = self.chapter_cell(code, l);
            if (!ccc.correct_concl(concl)) return [{}, concl, cursor];
            ret = {...ret, ...ret_expand};
            [l, ret_expand, concl, cursor] = self.chapter_notexture(code, l);
            if (!ccc.correct_concl(concl)) return [{}, concl, cursor];
            ret = {...ret, ...ret_expand};
            [l, ret_expand, concl, cursor] = self.chapter_localization(code, l);
            if (!ccc.correct_concl(concl)) return [{}, concl, cursor];
            ret.localization = {...ret.localization, ...ret_expand};
            [l, ret_expand, concl, cursor] = self.chapter_script(code, l, ret.version);
            if (!ccc.correct_concl(concl)) return [{}, concl, cursor];
            ret.script = {...ret.script, ...ret_expand};
            l++;
        }
        return [ret, new ccc.CompilerConclusion(0), new ccc.CompilerCursor()];
    };

    this.read_code = function(code, startl, version, tab = 0)
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
                let [linetype, block, l1, concl, cur] = self.read_line(code, l-spaces, version, tab);
                cur = new ccc.CompilerCursor(code, l, l1, cur.sl, cur.el);
                l = l1;
                if (!ccc.correct_concl(concl)) return [0, new ccb.BlockSequence(), concl, cur];
                switch (linetype)
                {
                    case self.LineType.ADDNEW:
                        code_sequence.add(block);
                        break;
                    case self.LineType.ADDCONDBLOCK:
                        if (code_sequence.blocks[code_sequence.blocks.length-1].constructor === ccb.Gate)
                            code_sequence.blocks[code_sequence.blocks.length-1].cb.push(block);
                        else
                            return [0, new ccb.BlockSequence(),
                                new ccc.CompilerConclusion(207), new ccc.CompilerCursor()];
                        break;
                    case self.LineType.ADDFALSEBLOCK:
                        if (code_sequence.blocks[code_sequence.blocks.length-1].constructor === ccb.Gate)
                        {
                            if (code_sequence.blocks[code_sequence.blocks.length-1].fb === null)
                                code_sequence.blocks[code_sequence.blocks.length-1].fb = block;
                            else return [0, new ccb.BlockSequence(),
                                new ccc.CompilerConclusion(209), new ccc.CompilerCursor()];
                        }
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

    this.read_line = function(code, startl, version, tab = 0)
    {
        let l = startl;
        let value, block, seq, write, concl, cur;
        [l, write, concl, cur] = coi.split_args2(code, l);
        if (!ccc.correct_concl(concl)) return [self.LineType.ADDNEW, new ccb.Block(ccb.UNKNOWNBLOCK), 0, concl, cur];
        else if (this.CodeStructures.has(write[0]))
        {
            if (write[0] !== 'ELSE')
            {
                [value, concl, cur] = cvd.value_determinant(write.slice(1));
                if (!ccc.correct_concl(concl)) return [self.LineType.UNKNOWN, new ccb.Block(ccb.UNKNOWNBLOCK), 0, concl, cur];
            }
            [l, seq, concl, cur] = self.read_code(code, l, version, tab+1);
            switch (write[0])
            {
                case 'WHILE':
                    return [self.LineType.ADDNEW, new ccb.While(value, seq), l, concl, cur];
                case 'IF':
                    return [self.LineType.ADDNEW, new ccb.Gate([[value, seq]]), l, concl, cur];
                case 'ELSEIF':
                    return [self.LineType.ADDCONDBLOCK, [value, seq], l, concl, cur];
                case 'ELSE':
                    return [self.LineType.ADDFALSEBLOCK, seq, l, concl, cur];
            }
        }
        else
        {
            [block, concl, cur] = cbd.definer(write);
            return [self.LineType.ADDNEW, block, l, concl, cur];
        }
    };
};

let _cmp = new cmp(_coi, _ccb, _cep, _cbd, _cvd, _ccc);

export {_cmp, cmp};