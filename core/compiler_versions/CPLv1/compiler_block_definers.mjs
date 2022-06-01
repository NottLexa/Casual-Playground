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

import * as cvd from './compiler_value_determinants.mjs';
import * as ccb from './compiler_code_blocks.mjs';
import * as ccc from './../../compiler_conclusions_cursors.mjs';

const definer = function(i, parts)
{
    global.console.log(`definer[${i}]`);
    if (parts.length === 1)
    {
        let part = parts[0];
        let ind = ''.indexOf('=');
        if (ind !== -1)
            return definer_setvar(i+1, [part.slice(0, ind), part.slice(ind, ind+1), part.slice(ind+1)]);
        else if (part[0] === ':') return definer_runfunc(i+1, part);
        else return [new ccb.Block(ccb.UNKNOWNBLOCK), new ccc.CompilerConclusion(205), new ccc.CompilerCursor()];
    }
    else
    {
        if (parts[1] === '=') return definer_setvar(i+1, parts);
        else return [new ccb.Block(ccb.UNKNOWNBLOCK), new ccc.CompilerConclusion(205), new ccc.CompilerCursor()];
    }
};

const definer_setvar = function(i, parts)
{
    global.console.log(`definer_setvar[${i}]`);
    let w, r, concl, cur;
    [w, concl, cur] = cvd.value_determinant(i+1, parts.slice(0, 1));
    if (!ccc.correct_concl(concl)) return [new ccb.Block(ccb.UNKNOWNBLOCK), concl, cur];
    [r, concl, cur] = cvd.value_determinant(i+1, parts.slice(2));
    if (!ccc.correct_concl(concl)) return [new ccb.Block(ccb.UNKNOWNBLOCK), concl, cur];
    return [new ccb.Block(ccb.SETVAR, w, r), new ccc.CompilerConclusion(0), new ccc.CompilerCursor()];
};

const definer_runfunc = function(i, string)
{
    global.console.log(`definer_runfunc[${i}]`);
    let [func, concl, cur] = cvd.simple_determinant(i+1, string);
    if (!ccc.correct_concl(concl)) return [new ccb.Block(ccb.UNKNOWNBLOCK), concl, cur];
    return [new ccb.Block(ccb.RUNFUNC, func), new ccc.CompilerConclusion(0), new ccc.CompilerCursor()];
}

export {definer_runfunc, definer_setvar, definer};