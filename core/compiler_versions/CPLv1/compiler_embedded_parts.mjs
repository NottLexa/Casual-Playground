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

const cep = function(ccc)
{
    Object.assign(this,
        ['', 'ROUND', 'SQUARE', 'CURLY', 'COMMENT', 'DOUBLEQUOTEMARK', 'SINGLEQUOTEMARK']
            .reduce((a, v, i)=>({ ...a, [v]: i-1})));
    //const [ROUND, SQUARE, CURLY, COMMENT, DOUBLEQUOTEMARK, SINGLEQUOTEMARK] = Array(5).keys();
    this.QUOTEMARK = this.DOUBLEQUOTEMARK;
    this.EOC = ['(','[','{', '<<','"',"'"];
    this.EOC_index = {};
    Array.from(this.EOC).forEach((value, index)=>{this.EOC_index[value] = index});
    Object.freeze(this.EOC_index);
    //this.EOC_index = {this.EOC[x]:x for x in range(len(this.EOC))}
    this.SET_EOC = new Set(this.EOC);
    this.BS = '\\';

    let self = this;

    this.string_embedded_quotemark = function(text, start, sepsym, save_escapes = false)
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
                if (text[l] === self.BS)
                {
                    if (text[l+1] === self.BS)
                    {
                        write += (!save_escapes) ? self.BS : self.BS+self.BS;
                        l += 2;
                    }
                    else if (text[l+1] === sepsym)
                    {
                        write += (!save_escapes) ? sepsym : self.BS+sepsym;
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
        return [indexes[0], indexes[1]+1, write, new ccc.CompilerConclusion(0), new ccc.CompilerCursor()];
    };

    this.string_embedded_brackets = function(text, start, sepsym)
    {
        let indexes = [-1, -1];
        let l = start;
        let write = '';
        let opened = false;
        let not_break = true;
        while (l < text.length)
        {
            let found = self.EOC.filter(value => text.slice(l, l+value.length) === value);
            if (found.length > 0)
            {
                if (found[0] === sepsym[0])
                {
                    if (!opened)
                    {
                        indexes[0] = l;
                        opened = true;
                        write += text[l++];
                    }
                    else if (self.EOC_index[sepsym[0]] !== self.COMMENT)
                    {
                        let _, add, concl, cur;
                        [_, l, add, concl, cur] = self.string_embedded(text, l, self.EOC_index[found[0]]);
                        if (!ccc.correct_concl(concl)) return [0, 0, '', concl, cur];
                        write += add;
                    }
                }
                else if (self.EOC_index[sepsym[0]] !== self.COMMENT)
                {
                    let _, add, concl, cur;
                    [_, l, add, concl, cur] = self.string_embedded(text, l, self.EOC_index[found[0]]);
                    if (!ccc.correct_concl(concl)) return [0, 0, '', concl, cur];
                    write += add;
                }
            }
            else
            {
                let sliced = text.slice(l, l+sepsym[1].length);
                if (sliced === sepsym[1])
                {
                    if (opened)
                    {
                        indexes[1] = l;
                        write += sliced;
                        not_break = false;
                        break;
                    }
                    else return [0, 0, '', new ccc.CompilerConclusion(201), new ccc.CompilerCursor(text, l)];
                }
                else write += text[l++];
            }
        }
        if (not_break)
            return [0, 0, '', new ccc.CompilerConclusion(201), new ccc.CompilerCursor(text, start)];
        return [indexes[0], indexes[1]+sepsym[1].length, write, new ccc.CompilerConclusion(0), new ccc.CompilerCursor()];
    };

    this.string_embedded = function(text, start, separationtype, save_escapes = false)
    {
        let sepsym;
        if (typeof separationtype === 'string') sepsym = separationtype;
        else sepsym = [
            '()',
            '[]',
            '{}',
            ['<<', '>>'],
            '"',
            "'"][separationtype];
        if (text.slice(start, start+sepsym[0].length) !== sepsym[0]) // (text[start] !== sepsym[0])
            return [0, 0, '', new ccc.CompilerConclusion(304), new ccc.CompilerCursor()];
        if ('"\''.includes(sepsym[0]))
            return self.string_embedded_quotemark(text, start, sepsym, save_escapes);
        else
            return self.string_embedded_brackets(text, start, sepsym);
    };

    this.string_only_embedded = function(text, start, separationtype, save_escapes = false)
    {
        let ret = this.string_embedded(text, start, separationtype, save_escapes);
        if (ccc.correct_concl(ret[3]))
            return [ret[0], ret[1], ret[2].slice(1, -1), ret[3], new ccc.CompilerCursor()];
        else return ret;
    };
};

import * as _ccc from '../../compiler_conclusions_cursors.mjs';

let _cep = new cep(_ccc);

export {_cep, cep};