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

import * as ccf from './compiler_core_functions.mjs';
import * as coi from './compiler_other_instruments.mjs';
import * as cep from './compiler_embedded_parts.mjs';
import * as ccb from './compiler_code_blocks.mjs';
import * as csc from '../../compiler_string_constants.mjs';
import * as ccc from '../../compiler_conclusions_cursors.mjs';

var MO = [['==', '!=', '>=', '>', '<=', '<'], ['+', '-'], ['*', '/']];
var LIST_MO = [];
for (let part in MO) LIST_MO.push(...MO[part]);
var SET_MO = new Set(LIST_MO);
// GLOBALTECHVARS
var gtvs = {
    board_width:  new Set(['BOARDWIDTH', 'BOARD_WIDTH', 'BW']),
    board_height: new Set(['BOARDHEIGHT', 'BOARD_HEIGHT', 'BH']),
};
var symtofunc = {
    '+':'add', '-':'sub', '*':'mul', '/':'div', '==':'eq',
    '!=':'ne', '>=':'ge', '>':'gt', '<=':'le', '<':'lt',
};

const arraysEqual = function(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length !== b.length) return false;
    for (var i = 0; i < a.length; ++i) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

const complex_determinant = function(codeparts)
{
    let joined = codeparts.join('');
    if (codeparts.some(value => SET_MO.has(value))) return math_resolver(codeparts);
    else
        return [new ccb.Value(ccb.EMPTY), new ccc.CompilerConclusion(301), new ccc.CompilerCursor()];
};

const simple_determinant = function(codepart='')
{
    let namable = (x) => {
        return ([...x].every(value => csc.s_nam.has(value))) && (!csc.s_nonam.has(x[0]))
    };
    let name1 = codepart.slice(1); let namable1 = namable(name1);
    let name2 = codepart.slice(2); let namable2 = namable(name2);

    // TECHVAR
    switch (codepart.slice(0, 2))
    {
        case '__':
            if (namable2)
                return [new ccb.Value(ccb.TECHVAR, name2), new ccc.CompilerConclusion(0), new ccc.CompilerCursor()];
    }

    let _, nv, sv, getargs, l0, l1, write, concl, cur;
    switch (codepart[0])
    {
        // EOC (EMBEDDED OPENING CHARS)
        case '"': // string
        case '\'': // string
            [l0, l1, write, concl, cur] = [...cep.string_only_embedded(codepart, 0, codepart[0])];
            if (!ccc.correct_concl(concl)) return [new ccb.Value(ccb.EMPTY), concl, cur];
            return [new ccb.Value(ccb.FIXEDVAR, write), new ccc.CompilerConclusion(0), new ccc.CompilerCursor()];
        case '(': // parentesized
            [l0, l1, write, concl, cur] = [...cep.string_only_embedded(codepart, 0, codepart[0])];
            if (!ccc.correct_concl(concl)) return [new ccb.Value(ccb.EMPTY), concl, cur];
            [_, write, concl, cur] = [...coi.split_args2(codepart, 0)];
            if (!ccc.correct_concl(concl)) return [new ccb.Value(ccb.EMPTY), concl, cur];
            return value_determinant(write);
        // VARS & FUNCS
        case ':': // function
            [l0, l1, write, concl, cur] = [...cep.string_embedded_brackets(codepart, 0, '()')];
            if (!ccc.correct_concl(concl)) return [new ccb.Value(ccb.EMPTY), concl, cur];
            [getargs, concl, cur] = [...coi.split_args3(codepart.slice(), 0, null, ',')];
            if (!ccc.correct_concl(concl)) return [new ccb.Value(ccb.EMPTY), concl, cur];
            let args = [];
            getargs.filter((value, index) => {return (index%2)===0}).forEach((v)=>{
                [_, sv, concl, cur] = [...coi.split_args2(v, 0)];
                if (!ccc.correct_concl(concl)) return [new ccb.Value(ccb.EMPTY), concl, cur];
                [nv, concl, cur] = value_determinant(sv);
                if (!ccc.correct_concl(concl)) return [new ccb.Value(ccb.EMPTY), concl, cur];
                args.push(nv);
            });
            return [new ccb.Value(ccb.FUNC, codepart.slice(1, l0), ccf.CoreFuncs, ...args),
            new ccc.CompilerConclusion(0), new ccc.CompilerCursor()];
        case '_': // localvar
            if (namable1)
            {
                return [new ccb.Value(ccb.LOCALVAR, name1),
                    new ccc.CompilerConclusion(0), new ccc.CompilerCursor()];
            }
            break;
        case '#': // cellid_by_name
            if (namable1)
            {
                return [new ccb.Value(ccb.FUNC, 'cellid_by_name', ccf.CoreFuncs, [new ccb.Value(ccb.FIXEDVAR, name1)]),
                    new ccc.CompilerConclusion(0), new ccc.CompilerCursor()];
            }
            break;
    }

    // GLOBALTECHVAR
    let a_codepart = [...codepart];

    for (let k in gtvs)
    {
        if (gtvs[k].has(codepart))
            return [new ccb.Value(ccb.GLOBALTECHVAR, k),
                new ccc.CompilerConclusion(0), new ccc.CompilerCursor()];
    }

    // NUMBER
    let numeric = a_codepart.every(value => csc.s_num.has(value));
    if (numeric && (!codepart.includes('.')))
        return [new ccb.Value(ccb.FIXEDVAR, Number(codepart)),
            new ccc.CompilerConclusion(0), new ccc.CompilerCursor()];
    let count = 0; a_codepart.forEach(value => {if (value === '.') count++});
    if (numeric && count === 1)
        return [new ccb.Value(ccb.FIXEDVAR, parseFloat(codepart)),
            new ccc.CompilerConclusion(0), new ccc.CompilerCursor()];

    // UNDEFINED
    return [new ccb.Value(ccb.EMPTY), new ccc.CompilerConclusion(301), new ccc.CompilerCursor()];
};

const value_determinant = function(codeparts)
{
    let splitted, concl, cur;
    if (codeparts.length === 1)
    {
        [splitted, concl, cur] = [...coi.split_args3(codeparts[0], 0, null, ...SET_MO)];
        if (!ccc.correct_concl(concl)) return [new ccb.Value(ccb.EMPTY), concl, cur];
        if (arraysEqual(splitted, codeparts))//(splitted === codeparts)
        {
            return simple_determinant(codeparts[0]);
        }
        else
        {
            return complex_determinant(splitted);
        }
    }
    else
    {
        return complex_determinant(codeparts);
    }
};

const math_resolver = function(allparts)
{
    let l, vd1, vd2, concl, cur, i, j, mop, mos;
    for (i in MO)
    {
        mop = MO[i];
        for (j in mop)
        {
            mos = mop[j];
            l = allparts.length - 1;
            while (l>=0 && allparts[l] !== mos) l -= 1;
            if (l === 0)
            {
                switch (mos)
                {
                    case '-':
                        vd1 = new ccb.Value(ccb.FIXEDVAR, 0)
                        [vd2, concl, cur] = [...value_determinant(allparts.slice(l+1))];
                        if (!ccc.correct_concl(concl)) return [new ccb.Value(ccb.EMPTY), concl, cur];
                        return [new ccb.Value(ccb.FUNC, 'sub', ccf.CoreFuncs, [vd1, vd2]),
                        new ccc.CompilerConclusion(0), new ccc.CompilerCursor()];
                    default:
                        return [new ccb.Value(ccb.EMPTY), new ccc.CompilerConclusion(301), new ccc.CompilerCursor()];
                }
            }
            else if (l > 0)
            {
                [vd1, concl, cur] = [...value_determinant(allparts.slice(0, l))];
                if (!ccc.correct_concl(concl)) return [new ccb.Value(ccb.EMPTY), concl, cur];
                [vd2, concl, cur] = [...value_determinant(allparts.slice(l+1))];
                if (!ccc.correct_concl(concl)) return [new ccb.Value(ccb.EMPTY), concl, cur];
                return [new ccb.Value(ccb.FUNC, symtofunc[mos], ccf.CoreFuncs, [vd1, vd2]),
                new ccc.CompilerConclusion(0), new ccc.CompilerCursor(null)];
            }
        }
    }
    return [new ccb.Value(ccb.EMPTY), new ccc.CompilerConclusion(301), new ccc.CompilerCursor()];
};

export {complex_determinant, simple_determinant, value_determinant, math_resolver};