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

const ccf = function(ctt)
{
    this.CoreFuncs = {
        add: function(caller, a, b)
        {
            return a.read(caller) + b.read(caller);
        },
        sub: function(caller, a, b)
        {
            return a.read(caller) - b.read(caller);
        },
        mul: function(caller, a, b)
        {
            return a.read(caller) * b.read(caller);
        },
        div: function(caller, a, b)
        {
            return a.read(caller) / b.read(caller);
        },
        getcell: function(caller, x, y)
        {
            return caller.board[y.read(caller)][x.read(caller)].cellid;
        },
        setcell: function(caller, x, y, cellid)
        {
            caller.tasks.push(
                [ctt.SET_CELL, x.read(caller), y.read(caller), cellid.read(caller)]
            );
        },
        eq: function(caller, a, b)
        {
            return a.read(caller) === b.read(caller);
        },
        ne: function(caller, a, b)
        {
            return a.read(caller) !== b.read(caller);
        },
        ge: function(caller, a, b)
        {
            return a.read(caller) >= b.read(caller);
        },
        gt: function(caller, a, b)
        {
            return a.read(caller) > b.read(caller);
        },
        le: function(caller, a, b)
        {
            return a.read(caller) <= b.read(caller);
        },
        lt: function(caller, a, b)
        {
            return a.read(caller) < b.read(caller);
        },
        reply: function(caller, string)
        {
            caller.reply(0, toString(string.read(caller)));
        },
        and: function(caller, a, b)
        {
            return a.read(caller) & b.read(caller);
        },
        or: function(caller, a, b)
        {
            return a.read(caller) | b.read(caller);
        },
        xor: function(caller, a, b)
        {
            return a.read(caller) ^ b.read(caller);
        },
        not: function(caller, a)
        {
            return !a.read(caller);
        },
        cellid_by_name: function(caller, a)
        {
            if (a.source !== null) return caller.globals[0].idlist.indexOf(a.source+'/'+a.read(caller));
            else return caller.globals[0].idlist.indexOf(a.read(caller));
        },
        min: function(caller, a, b)
        {
            return Math.min(a.read(caller), b.read(caller));
        },
        max: function(caller, a, b)
        {
            return Math.max(a.read(caller), b.read(caller));
        },
        clamp: function(caller, value, mn, mx)
        {
            return Math.max(mn.read(caller), Math.min(mx.read(caller), value.read(caller)));
        },
    };
    this.CoreFuncsString = { // for compiler_javascript_converter.cjs
        add: (a, b) => ['(', a, `+`, b, ')'],
        sub: (a, b) => ['(', a, `-`, b, ')'],
        mul: (a, b) => ['(', a, `*`, b, ')'],
        div: (a, b) => ['(', a, `/`, b, ')'],
        getcell: (x, y) => ['caller.board[', y, '][', x, '].cellid'],
        setcell: (x, y, cellid) => ['caller.tasks.push([ctt.SET_CELL,', x, ',', y, ',', cellid, '])'],
        eq: (a, b) => ['(', a, `===`, b, ')'],
        ne: (a, b) => ['(', a, `!==`, b, ')'],
        ge: (a, b) => ['(', a, `>=`, b, ')'],
        gt: (a, b) => ['(', a, `>`, b, ')'],
        le: (a, b) => ['(', a, `<=`, b, ')'],
        lt: (a, b) => ['(', a, `<`, b, ')'],
        reply: (string) => ['caller.reply(0, toString(', string, '))'],
        and: (a, b) => ['(', a, `&`, b, ')'],
        or: (a, b) => ['(', a, `|`, b, ')'],
        xor: (a, b) => ['(', a, `^`, b, ')'],
        not: (a) => [`(!`, a, ')'],
        cellid_by_name: (a) => ['caller.globals[0].idlist.indexOf(', a, ')'], // temporarily without unofficial source support
        /*cellid_by_name: function(caller, a)
        {

            if (a.source !== null) return caller.globals[0].idlist.indexOf(a.source+'/'+a.read(caller));
            else return caller.globals[0].idlist.indexOf(a.read(caller));
        },*/
        min: (a, b) => ['Math.min(', a, ',', b, ')'],
        max: (a, b) => ['Math.max(', a, ',', b, ')'],
        clamp: (value, mn, mx) => ['Math.max(', mn, ',', 'Math.min(', mx, ',', value, ')', ')'],
    }
};

var _ctt = require('../../compiler_task_types.cjs');

let _ccf = new ccf(_ctt);

module.exports = {_ccf, ccf};