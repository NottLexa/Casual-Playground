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

const CompilerCursor = function(codetxt = null, ...indexes)
{
    if (typeof codetxt === 'string')
    {
        if (indexes.length === 0)
        {
            this.sl = 0;
            this.el = -1;
            this.sh = 0;
            this.eh = -1;
            this.txt = codetxt;
        }
        else
        {
            switch (indexes.length)
            {
                case 1:
                    codetxt = '';
                    this.sl = codetxt.lastIndexOf('\n', 0, indexes[0]) + 1;
                    this.el = codetxt.indexOf('\n', indexes[0]);
                    this.sh = 0;
                    this.eh = -1;
                    break;
                case 2:
                    this.sl = indexes[0];
                    this.el = indexes[1];
                    this.sh = 0;
                    this.eh = -1;
                    break;
                case 3:
                    this.sl = indexes[0];
                    this.el = indexes[1];
                    this.sh = indexes[2];
                    this.eh = indexes[2];
                    break;
                default:
                    this.sl = indexes[0];
                    this.el = indexes[1];
                    this.sh = indexes[2];
                    this.eh = indexes[3];
                    break;
            }
            this.txt = codetxt.slice(this.sl, this.el);
        }
    }
    else
    {
        this.sl = 0;
        this.el = -1;
        this.sh = 0;
        this.eh = -1;
        this.txt = '<Not specified where>';
    }

    this.start = () => this.sl;
    this.end = () => this.el;
    this.string = () => this.txt;
    this.highlight = (sym = 'v') => (' '.repeat((this.sl-this.sh)))+(sym.repeat((this.eh-this.sh+1)));
    this.__repr__ = () => `<CompCur[${this.sl}:${this.el}]>`;
    this.__str__ = () => `<CompilerCursor[${this.sl}:${this.el}]: "${this.txt}">`;
}

const compconcl_get_description = function (code) {
    let group = Math.floor(code/100);
    let errid = code % 100;
    if (group < compconcl_ids.length && errid < compconcl_ids[group].length)
    {
        return compconcl_ids[group][errid];
    }
    else return 'Unknown Code';
}

var compconcl_ids = [
    // 0-- / Success conclusions
    Object.values({
        0: 'Success',
        1: 'Success (warning, outdated version of mod)',
    }),
    // 1-- / Format errors
    Object.values({
        0: 'Not a .mod file',
        1: 'Empty file',
        2: 'Version of code is not stated in the start of .mod file (might be unreadable encoding, use UTF-8)',
        3: 'Unknown version of mod',
    }),
    // 2-- / Syntax error
    Object.values({
        0: 'Syntax error: no specified reason',
        1: 'Syntax error: unclosed brackets or quote marks',
        2: 'Syntax error: impossible usage of backslash in quote marks',
        3: 'Syntax error: unexpected symbol/expression',
        4: 'Syntax error: unclosed math operation',
        5: 'Syntax error: undefinable code line',
        6: 'Syntax error: encountered higher tab where it mustn\'t be',
        7: 'Syntax error: unexpected ELSEIF statement (maybe you put something between IF and ELSEIF?)',
        8: 'Syntax error: unexpected ELSE statement (maybe you put something between IF and ELSE?)',
        9: 'Syntax error: unexpected ELSE statement (maybe you put ELSE twice?)',
       10: 'Syntax error: specified mod was not found',
    }),
    // 3-- / Value error
    Object.values({
        0: 'Value error: no specified reason',
        1: 'Value error: unidentifiable value',
        2: 'Value error: trying to write read-only variable',
        3: 'Value error: trying to read non-existent variable',
        4: 'Value error: put value is of incorrect type'
    }),
    // 4-- / Runtime error
    Object.values({
        0: 'Runtime error: no specified reason',
    }),
];

const CompilerConclusion = function(conclusion_code)
{
    this.code = conclusion_code;
    this.description = compconcl_get_description(this.code);
    this.__repr__ = () => `<CompCon[${this.code}]>`;
    this.__str__ = () => `<CompilerConclusion: ${this.code}>`;
    this.full_conclusion = () => `< CompilerConclusion with ID ${this.code}\n  ---\n  ${this.description} >`;
    this.short_conclusion = () => `<CompilerConclusion with ID ${this.code}: ${this.description}>`;
}

const correct_concl = (conclusion) => conclusion.code === 0;

export {CompilerConclusion, CompilerCursor, correct_concl};