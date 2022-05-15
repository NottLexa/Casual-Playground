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

import * as CPLv1 from './compiler_versions/CPLv1/__init__.mjs';
import * as ccc from './compiler_conclusions_cursors.mjs';
import {CompilerConclusion} from './compiler_conclusions_cursors.mjs';

const COMPILER_VERSIONS = [CPLv1];
const LAST_COMPILER_VERSION = COMPILER_VERSIONS.length;
const [X, Y, CELLID] = [...Array(3).keys()];

const Globals = {
    REPLY_DEFAULT: 0,
};

const LoggerClass = {
    types: ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'],
    DEBUG: 0,
    INFO: 1,
    WARNING: 2,
    ERROR: 3,
    CRITICAL: 4,
};

const get = function(code = '')
{
    if (code === '') return [{}, new ccc.CompilerConclusion(1), null];
    let l = 0;
    if (code.slice(l, l+7) === 'VERSION')
    {
        l += 7;
        while (code.charAt(l) === ' ') l += 1;
        let write = '';
        while (code.charAt(l) !== '\n') write.concat(code.charAt(l++));
    }
    else return [{}, new ccc.CompilerConclusion(2), null];

    let version = Number(write);
    if (!(0 < version && version <= LAST_COMPILER_VERSION))
    {
        return [{}, ccc.CompilerConclusion(3), ccc.CompilerCursor(code, 0, 0)];
    }

    let compiler = COMPILER_VERSIONS[version-1];
    let ret = compiler.get(code, l);
    if (ret[1] === CompilerConclusion(0) && version !== LAST_COMPILER_VERSION)
    {
        ret[1] = CompilerConclusion(1);
    }
    return ret;
}

const Cell = function(
    technical_values = {},
    cellid = 0,
    board = [],
    globals = [],
    )
{
    this.techvars = {
        X: 0,
        Y: 0,
    };
    this.techvars = {
        ...this.techvars,
        ...technical_values
    };
    this.cellid = cellid;
    this.locals = {};
    this.board = board;
    this.globals = globals;
    this.tasks = [];
    this.code = this.globals[0]['objdata'][this.globals[0]['idlist'][this.cellid]];
    if (this.code['script'].create !== undefined) this.code['script'].create(this);

    this.step = function()
    {
        if (this.code['script'].step !== undefined) this.code['script'].step(this);
    }

    this.reply = function(
        type = Globals.REPLY_DEFAULT,
        message = '',
        )
    {
        switch (type)
        {
            case Globals.REPLY_DEFAULT:
                this.globals[0]['logger'].push([
                    LoggerClass.DEBUG,
                    Date.now(),
                    `Reply from Cell[${this.techvars['X']}, ${this.techvars['Y']}]` +
                    ` (${this.globals[0]['idlist'][this.cellid]})`,
                    ...message.split('\n'),
                ])
                break;
        }
    }
}

export {LoggerClass, get, Cell};