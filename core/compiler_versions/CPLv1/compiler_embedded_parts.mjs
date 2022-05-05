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
    let _break = false
    while (l < text.length)
    {
        if (code[l] === sepsym) indexes[count++] = l;
        if (count > 0)
        {
            if (code[l] === BS)
            {
                if (code[l+1] === BS)
                {
                    write += ((!save_escapes) ? BS : BS+BS)
                    l += 2;
                }
                else if (code[l+1] === sepsym)
                {
                    write += ((!save_escapes) ? sepsym : BS+sepsym);
                    l += 2;
                }
                else return [0, 0, '', new ccc.CompilerConclusion(202),
                        new ccc.CompilerCursor(text, l)];
            }
            else write += code[l++];
        }
        if (count >= 2) break;
    }
    if (!_break)
        return [0, 0, '', new ccc.CompilerConclusion(201), new ccc.CompilerCursor(text, start)];
    return [indexes[0], indexes[1]+1, write, new ccc.CompilerConclusion(0),
        new ccc.CompilerCursor(null)];
}