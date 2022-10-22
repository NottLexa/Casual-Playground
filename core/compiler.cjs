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

const fs = require('fs');
const path = require('path');
//const desync = require('deasync');

//import * as CPLv1_0_0 from './compiler_versions/CPLv1.0.0/main.cjs';
var ccc = require('./compiler_conclusions_cursors.cjs');
var csc = require('./compiler_string_constants.cjs');

//const COMPILER_VERSIONS = [CPLv1.0.0];
//const LAST_COMPILER_VERSION = COMPILER_VERSIONS.length;
//const [X, Y, CELLID] = Array(3).keys();
const Globals = {
    REPLY_DEFAULT: 0,
};

const DEFAULT = {
    version: '1.0.0',
    type: 'CELL',
    name: 'Cell',
    desc: 'No description given.',
    notexture: [255, 255, 255],
    localization: {},
    script: {
        create: undefined,
        step: undefined,
    },
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
    if (code === '') return [{}, new ccc.CompilerConclusion(1), new ccc.CompilerCursor()];
    let l = 0;
    let version = '';
    if (code.slice(l, l+7) === 'VERSION')
    {
        l += 7;
        while (code.charAt(l) === ' ') l += 1;
        while (!('\n\r'.includes(code.charAt(l)))) version += code.charAt(l++);
    }
    else return [{}, new ccc.CompilerConclusion(2), new ccc.CompilerCursor()];

    //let version = Number(write);
    /*if (!(0 < version && version <= LAST_COMPILER_VERSION))
    {
        return [{}, new ccc.CompilerConclusion(3), new ccc.CompilerCursor(code, 0, 0)];
    }*/

    //let compiler = COMPILER_VERSIONS[version-1];
    let compilers = fs.readdirSync(path.join('core', 'compiler_versions'));
    let compiler;
    if (compilers.includes(version)) // exact compiler name
        {}//compiler = path.join('core', 'compiler_version', version);
    else if ([...version].every(letter => csc.s_num.has(letter)))
    {
        let versions_filtered = compilers.filter(value => value.startsWith(`CPLv${version}`))
            .sort((a, b)=>(a-b));
        if (versions_filtered.length === 0)
            return [{}, new ccc.CompilerConclusion(3), new ccc.CompilerCursor(code, 0, 0)];
        version = versions_filtered[versions_filtered.length-1];
        //compiler = path.join('core', 'compiler_version', );
    }

    let ret;

    try {
        let compiler_path = path.join('core', 'compiler_versions', version);
        //console.log(fs.readdirSync(compiler_path));
        //compiler = require(compiler_path);
        //import(compiler_path).then((compiler)=>{ret = compiler.get(code, l);});
        //console.log('B');

        let compiler = require(compiler_path); //let compiler = require('compiler_versions/CPLv1.0.0');

        ret = compiler.get(code, l);

        /*desync(()=>{
            import(compiler_path).then((compiler)=>{ret = compiler.get(code, l);});
        })();*/
    }
    catch (err) {
        ret = [{}, new ccc.CompilerConclusion(200),
            new ccc.CompilerCursor(err.message+'\n'+err.fileName+'\n'+err.lineNumber)];
    }
    /*if (ret[1] === new ccc.CompilerConclusion(0) && version !== LAST_COMPILER_VERSION)
    {
        ret[1] = new ccc.CompilerConclusion(1);
    }*/
    return [{...DEFAULT, ...ret[0]}, ret[1], ret[2]];

    /*import(compiler)
        .then((compiler)=>
            {
                //let ret;
                try {
                    ret = compiler.get(code, l);
                }
                catch (err) {
                    ret = [{}, new ccc.CompilerConclusion(200), new ccc.CompilerCursor(err.message)];
                }
                if (ret[1] === new ccc.CompilerConclusion(0) && version !== LAST_COMPILER_VERSION)
                {
                    ret[1] = new ccc.CompilerConclusion(1);
                }
                ret = [{...DEFAULT, ...ret[0]}, ret[1], ret[2]];
            })
        .catch((err)=>
            {
                ret = [{}, new ccc.CompilerConclusion(3), new ccc.CompilerCursor(code, 0, 0)];
            });
    while (ret === undefined) {};
    return ret;*/
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
    this.code = this.globals[0].objdata[this.globals[0].idlist[this.cellid]];
    if (this.code.script.create !== undefined) this.code.script.create.exec(this);

    this.step = function()
    {
        if (this.code.script.step !== undefined) this.code.script.step.exec(this);
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

    this.reset = function(cellid = 0)
    {
        this.cellid = cellid;
        this.locals = {};
        this.tasks = [];
        this.code = this.globals[0].objdata[this.globals[0].idlist[this.cellid]];
        if (this.code.script.create !== undefined) this.code.script.create.exec(this);
    }
}

module.exports = {LoggerClass, get, Cell};