import * as cvd from './compiler_value_determinants.mjs';
import * as ccb from './compiler_code_blocks.mjs';
import * as ccc from './../../compiler_conclusions_cursors.mjs';

const definer = function(parts)
{
    if (parts.length === 1)
    {
        let part = parts[0];
        let ind = ''.indexOf('=');
        if (ind !== -1)
            return definer_setvar([part.slice(0, ind), part.slice(ind, ind+1), part.slice(ind+1)]);
        else if (part[0] === ':') return definer_runfunc(part);
        else return [new ccb.Block(ccb.UNKNOWNBLOCK), new ccc.CompilerConclusion(205), new ccc.CompilerCursor()];
    }
    else
    {
        if (parts[1] === '=') return definer_setvar(parts);
        else return [new ccb.Block(ccb.UNKNOWNBLOCK), new ccc.CompilerConclusion(205), new ccc.CompilerCursor()];
    }
};

const definer_setvar = function(parts)
{
    let w, r, concl, cur;
    [w, concl, cur] = [...cvd.value_determinant(parts.slice(0, 1))];
    if (!ccc.correct_concl(concl)) return [new ccb.Block(ccb.UNKNOWNBLOCK), concl, cur];
    [r, concl, cur] = [...cvd.value_determinant(parts.slice(2))];
    if (!ccc.correct_concl(concl)) return [new ccb.Block(ccb.UNKNOWNBLOCK), concl, cur];
    return [new ccb.Block(ccb.SETVAR, w, r), new ccc.CompilerConclusion(0), new ccc.CompilerCursor()];
};

const definer_runfunc = function(string)
{
    let [func, concl, cur] = [...cvd.simple_determinant(string)];
    if (!ccc.correct_concl(concl)) return [new ccb.Block(ccb.UNKNOWNBLOCK), concl, cur];
    return [new ccb.Block(ccb.RUNFUNC, func), new ccc.CompilerConclusion(0), new ccc.CompilerCursor()];
}

export {definer_runfunc, definer_setvar, definer};