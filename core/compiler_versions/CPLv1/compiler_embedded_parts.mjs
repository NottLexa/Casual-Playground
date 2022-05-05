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
                    write += ((!save_escapes) ? BS : BS+BS);
                    l += 2;
                }
                else if (text[l+1] === sepsym)
                {
                    write += ((!save_escapes) ? sepsym : BS+sepsym);
                    l += 2;
                }
                else return [0, 0, '', new ccc.CompilerConclusion(202),
                        new ccc.CompilerCursor(text, l)];
            }
            else write += text[l++];
        }
        if (count >= 2)
        {
            not_break = false;
            break;
        }
    }
    if (not_break)
        return [0, 0, '', new ccc.CompilerConclusion(201), new ccc.CompilerCursor(text, start)];
    return [indexes[0], indexes[1]+1, write, new ccc.CompilerConclusion(0), null];
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
                    write += text[l++];
                }
                else
                {
                    let _, add, concl, cur;
                    [_, l, add, concl, cur] = string_embedded(text, l, EOC_index[text[l]]);
                    if (!ccc.correct_concl(concl)) return [0, 0, '', concl, cur];
                    write += add;
                }
            }
            else
            {
                let _, add, concl, cur;
                [_, l, add, concl, cur] = string_embedded(text, l, EOC_index[text[l]]);
                if (!ccc.correct_concl(concl)) return [0, 0, '', concl, cur];
                write += add;
            }
        }
        else if (text[l] === sepsym[1])
        {
            if (opened)
            {
                indexes[1] = l;
                write += text[l];
                not_break = false;
                break;
            }
            else
                return [0, 0, '', new ccc.CompilerConclusion(201), new ccc.CompilerCursor(text, l)];
        }
        else write += text[l++];
    }
    if (not_break)
        return [0, 0, '', new ccc.CompilerConclusion(201), new ccc.CompilerCursor(text, start)];
    return [indexes[0], indexes[1]+1, write, new ccc.CompilerConclusion(0), null];
}

const string_embedded = function(text, start, separationtype, save_escapes = false)
{
    let sepsym;
    if (typeof separationtype === 'string') sepsym = separationtype;
    else sepsym = ['()', '[]', '{}', '"', "'"][separationtype];
    if (text[start] !== sepsym[0]) return [0, 0, '', new ccc.CompilerConclusion(304), null];
    if (separationtype === DOUBLEQUOTEMARK || separationtype === SINGLEQUOTEMARK)
        return string_embedded_quotemark(text, start, sepsym, save_escapes);
    else
        return string_embedded_brackets(text, start, sepsym);
}

const string_only_embedded = function(text, start, separationtype, save_escapes = false)
{
    let ret = string_embedded(text, start, separationtype, save_escapes)
    if (ccc.correct_concl(ret[3])) return [ret[0], ret[1], ret[2].slice(1, -1), ret[3], null];
    else return ret;
}