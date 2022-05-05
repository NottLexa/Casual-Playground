import * as cep from './compiler_embedded_parts.mjs';
import * as ccc from '../../compiler_conclusions_cursors.mjs';

const split_args1 = function(text, start, end_at = null)
{
    let newlinestop = false;
    let end = end_at;
    if (end_at === null) end = text.length;
    else if (end_at === '\n')
    {
        newlinestop = true;
        end = text.length;
    }
    else end = Math.min(end_at, text.length);

    let args = [];
    let write = '';
    let l = start;
    while (l < end)
    {
        if (newlinestop && text[l] === '\n') break;
        if (' \n\t'.includes(text[l]))
        {
            if (write !== '')
            {
                args.push(write);
                write = '';
            }
        }
        else if ('\'"'.includes(text[l]))
        {
            let i0, i1, string, concl, cur;
            if (text[l] === '"')
                [i0, i1, string, concl, cur] = cep.string_embedded(text, l, cep.DOUBLEQUOTEMARK, true);
            else
                [i0, i1, string, concl, cur] = cep.string_embedded(text, l, cep.SINGLEQUOTEMARK, true);
            if (!ccc.correct_concl(concl))
                return [[], concl, cur];
            l = i1-1;
            write.concat(string);
        }
        else write.concat(text[l]);
        l++;
    }
    if (write !== '') args.push(write);

    return [args, new ccc.CompilerConclusion(0), new ccc.CompilerCursor()];
}

const split_args2 = function(text, start)
{
    let end = text.length;
    let args = [];
    let write = '';
    let l = start;
    while (l < end)
    {
        if (code[l] === '\n')
        {
            end = l;
            break;
        }
        if (' \n\t'.includes(text[l]))
        {
            if (write !== '')
            {
                args.push(write);
                write = '';
            }
        }
        else if (cep.SET_EOC.has(text[l]))
        {
            let [i0, i1, string, concl, cur] = cep.string_only_embedded(text, l, text[l]);
            if (!ccc.correct_concl(concl))
                return [[], concl, cur];
            l = i1-1;
            write.concat(string);
        }
        else write.concat(text[l]);
        l++;

    }
    if (write !== '') args.push(write);

    return [end+1, args, new ccc.CompilerConclusion(0), new ccc.CompilerCursor()];
}

const split_args3 = function(text, start = 0, end_at = null, ...splitters)
{
    let end;
    if (end === null) end = text.length;
    else end = end_at;

    let spls = [...splitters].sort((a,b)=>(a-b));
    let ret = [''];
    let l = start;
    while (l < end)
    {
        let not_break = true;
        let spl;
        for (let i in spls)
        {
            spl = spls[i];
            if (text.slice(l, l+spl.length) === spl)
            {
                if (ret[ret.length-1] === '') ret.pop();
                ret.push(spl, '');
                l += spl.length;
                not_break = false;
                break;
            }
        }
        if (not_break)
        {
            if (cep.SET_EOC.has(text[l]))
            {
                let [l0, l1, write, concl, cur] = cep.string_embedded(text, l, text[l])
                if (!ccc.correct_concl(concl)) return [[], concl, cur];
                ret[ret.length-1].concat(write);
                l = l1;
            }
            else ret[ret.length-1].concat(text[l++]);
        }
    }
    if (ret[ret.length-1] === '') ret.pop();
    return [ret, new ccc.CompilerCursor(0), new ccc.CompilerCursor()];
}

export {split_args1, split_args2, split_args3}