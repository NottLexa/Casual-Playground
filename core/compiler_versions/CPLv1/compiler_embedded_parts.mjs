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

import * as ccc from '../../compiler_conclusions_cursors.mjs';

const [ROUND, SQUARE, CURLY, DOUBLEQUOTEMARK, SINGLEQUOTEMARK] = [...Array(5).keys()];
const QUOTEMARK = DOUBLEQUOTEMARK;
const EOC = '([{"\'';
var EOC_index = {};
for (let i in EOC)
{
    EOC_index[EOC.charAt(i)] = i;
}
Object.freeze(EOC_index);
//EOC_index = {EOC[x]:x for x in range(len(EOC))}
const SET_EOC = new Set(EOC);
const BS = '\\';

const string_embedded_quotemark = function(text, start, sepsym, save_escapes = false)
{
    let indexes = [-1, -1];
    let l = start;
    let write = '';
    let count = 0;
    let not_break = true;
    while (l < text.length)
    {
        if (text[l] === sepsym) indexes[count++] = l;
        if (count > 0)
        {
            if (text[l] === BS)
            {
                if (text[l+1] === BS)
                {
                    write.concat((!save_escapes) ? BS : BS+BS);
                    l += 2;
                }
                else if (text[l+1] === sepsym)
                {
                    write.concat((!save_escapes) ? sepsym : BS+sepsym);
                    l += 2;
                }
                else return [0, 0, '', new ccc.CompilerConclusion(202),
                        new ccc.CompilerCursor(text, l)];
            }
            else write.concat(text[l++]);
        }
        if (count >= 2)
        {
            not_break = false;
            break;
        }
    }
    if (not_break)
        return [0, 0, '', new ccc.CompilerConclusion(201), new ccc.CompilerCursor(text, start)];
    return [indexes[0], indexes[1]+1, write, new ccc.CompilerConclusion(0), new ccc.CompilerCursor()];
}

const string_embedded_brackets = function(text, start, sepsym)
{
    let indexes = [-1, -1];
    let l = start;
    let write = '';
    let count = 0;
    let opened = false;
    let not_break = true;
    while (l < text.length)
    {
        if (SET_EOC.has(text[l]))
        {
            if (text[l] === sepsym[0])
            {
                if (!opened)
                {
                    indexes[0] = l;
                    opened = true;
                    write.concat(text[l++]);
                }
                else
                {
                    let _, add, concl, cur;
                    [_, l, add, concl, cur] = string_embedded(text, l, EOC_index[text[l]]);
                    if (!ccc.correct_concl(concl)) return [0, 0, '', concl, cur];
                    write.concat(add);
                }
            }
            else
            {
                let _, add, concl, cur;
                [_, l, add, concl, cur] = string_embedded(text, l, EOC_index[text[l]]);
                if (!ccc.correct_concl(concl)) return [0, 0, '', concl, cur];
                write.concat(add);
            }
        }
        else if (text[l] === sepsym[1])
        {
            if (opened)
            {
                indexes[1] = l;
                write.concat(text[l]);
                not_break = false;
                break;
            }
            else
                return [0, 0, '', new ccc.CompilerConclusion(201), new ccc.CompilerCursor(text, l)];
        }
        else write.concat(text[l++]);
    }
    if (not_break)
        return [0, 0, '', new ccc.CompilerConclusion(201), new ccc.CompilerCursor(text, start)];
    return [indexes[0], indexes[1]+1, write, new ccc.CompilerConclusion(0), new ccc.CompilerCursor()];
}

const string_embedded = function(text, start, separationtype, save_escapes = false)
{
    let sepsym;
    if (typeof separationtype === 'string') sepsym = separationtype;
    else sepsym = ['()', '[]', '{}', '"', "'"][separationtype];
    if (text[start] !== sepsym[0])
        return [0, 0, '', new ccc.CompilerConclusion(304), new ccc.CompilerCursor()];
    if (separationtype === DOUBLEQUOTEMARK || separationtype === SINGLEQUOTEMARK)
        return string_embedded_quotemark(text, start, sepsym, save_escapes);
    else
        return string_embedded_brackets(text, start, sepsym);
}

const string_only_embedded = function(text, start, separationtype, save_escapes = false)
{
    let ret = string_embedded(text, start, separationtype, save_escapes)
    if (ccc.correct_concl(ret[3]))
        return [ret[0], ret[1], ret[2].slice(1, -1), ret[3], new ccc.CompilerCursor()];
    else return ret;
}

export {string_embedded, string_embedded_brackets, string_embedded_quotemark, string_only_embedded,
    DOUBLEQUOTEMARK, SINGLEQUOTEMARK, QUOTEMARK, BS, CURLY, EOC, EOC_index, ROUND, SET_EOC, SQUARE};