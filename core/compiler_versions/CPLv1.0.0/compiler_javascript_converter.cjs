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

const cjc = function(ccb, ccf)
{
    let self = this;
    this.convert = function(data)
    {
        let ret = '';
        switch (data.constructor)
        {
            case ccb.BlockSequence:
                for (subdata of data) ret += self.convert(subdata);
                break;
            case ccb.Gate:
                for (let i in data.cb)
                {
                    ret += ((i == 0) ? 'if' : 'else if');
                    let cond = self.convert(data.cb[i][0]);
                    let exec = self.convert(data.cb[i][1]);
                    ret += `(${cond}){${exec}}`;
                }
                if (data.fb !== null)
                {
                    ret += `else{${self.convert(data.fb)}}`
                }
                ret += ';';
                break;
            case ccb.While:
                ret += `while(${self.convert(data.cond)}){${self.convert(data.block)}};`;
                break;
            case ccb.Block:
                switch (data.type)
                {
                    case ccb.SETVAR:
                        ret += self.convert(data.data[0])+'='+self.convert(data.data[1]);
                        break;
                    case ccb.RUNFUNC:
                        ret += self.convert(data.data[0]);
                        break;
                }
                ret += ';';
                break;
            case ccb.Value:
                switch (data.type)
                {
                    case ccb.FUNC:
                        let func_list;
                        if (data.source.hasOwnProperty(data.value))
                            func_list = ccf.CoreFuncsString[data.value](...data.args);
                        else if (data.source.hasOwnProperty('_'+data.value))
                            func_list = ccf.CoreFuncsString['_'+data.value](...data.args);
                        for (let i of func_list)
                        {
                            if (i.constructor === ccb.Value) ret += self.convert(i);
                            else ret += i;
                        }
                        break;
                    case ccb.LOCALVAR:
                        ret += `caller.locals.${data.value}`;
                        break;
                    case ccb.TECHVAR:
                        ret += `caller.techvars.${data.value}`;
                        break;
                    case ccb.GLOBALVAR:
                        ret += `caller.globals[1].${data.value}`;
                        break;
                    case ccb.GLOBALTECHVAR:
                        ret += `caller.globals[0].${data.value}`;
                        break;
                    case ccb.FIXEDVAR:
                        ret += JSON.stringify(data.value);
                        break;
                }
        }
        return ret;
    };
};

var {_ccb} = require('./compiler_code_blocks.cjs');
var {_ccf} = require('./compiler_core_functions.cjs');

let _cjc = new cjc(_ccb, _ccf);

module.exports = {_cjc, cjc};