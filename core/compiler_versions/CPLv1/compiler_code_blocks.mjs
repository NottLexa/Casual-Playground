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

const [UNKNOWNBLOCK, SETVAR, RUNFUNC] = Array(3).keys();
const [EMPTY, FUNC, LOCALVAR, TECHVAR, GLOBALVAR, GLOBALTECHVAR, FIXEDVAR] = Array(7).keys();
const writable = (type) => {[LOCALVAR, TECHVAR, GLOBALVAR].includes(type)};
const back_funcs = (value_to_name) => ['UNKNOWNBLOCK', 'SETVAR', 'RUNFUNC'][value_to_name];

const BlockSequence = function(blocks=[])
{
    let _ = this;

    this.blocks = blocks;
    this.add = function(...other){this.blocks.push(...other)};
    this.unite = function(other){return BlockSequence(this.blocks.concat(other.blocks))};
    this.get = (index)=>{this.blocks[index]};
    this.set = (index,value)=>{this.blocks[index]=value};
    this.exec = function(caller)
    {
        for (let b of this.blocks) b.exec(caller);
    }
    this[Symbol.iterator] = function()
    {
        let index = 0;
        return {
            next: function(){
                return index < _.blocks.length ? {
                    value: _.blocks[index++],
                    done: false,
                } : {
                    done: true,
                }
            }
        };
    };
}

const Gate = function(cond_blocks=[], else_block=null)
{
    let _ = this;
    this.cb = cond_blocks;
    this.fb = else_block;
    this.exec = function(caller)
    {
        let cond, block;
        let _else = true;
        for (let c in this.cb)
        {
            if (this.cb[c][0].read(caller))
            {
                this.cb[c][1].exec(caller);
                _else = false;
                break;
            }
        }
        if (_else && this.fb !== null) this.fb.exec(caller);
    };
    this[Symbol.iterator] = function()
    {
        let index = 0;
        return {
            next: function(){
                return index < (_.cb.length + (_.fb !== null)) ? {
                    value: (index++ === _.cb.length) ? _.fb : _.cb[index-1],
                    done: false,
                } : {
                    done: true,
                }
            }
        };
    };
}

const While = function(cond, block)
{
    let _ = this;
    this.cond = cond;
    this.block = block;
    this.exec = function(caller)
    {
        while (this.cond.read(caller)) this.block.exec(caller);
    }
    this[Symbol.iterator] = function()
    {
        let index = 0;
        return {
            next: function(){
                switch (index++)
                {
                    case 0: return {value: _.cond, done: false};
                    case 1: return {value: _.block, done: false};
                    default: return {done: true};
                }
            }
        };
    };
}

const Block = function(type, ...data)
{
    let _ = this;
    this.type = type;
    this.data = data;
    this.exec = function(caller)
    {
        switch (this.type)
        {
            case SETVAR:
                this.data[0].write(this.data[1].read(caller), caller)
                break;
            case RUNFUNC:
                this.data[0].read(caller);
                break;
        }
    }
    this[Symbol.iterator] = function()
    {
        let index = 0;
        return {
            next: function(){
                switch (index++)
                {
                    case 0: return {value: back_funcs(_.type), done: false};
                    case 1: return {value: _.data, done: false};
                    default: return {done: true};
                }
            }
        };
    };
}

const Value = function(type, value=null, source=null, args)
{
    this.type = type;
    this.value = value;
    this.source = source;
    this.args = args;
    this.write = function(newvalue, caller){};
    this.read = function(caller){};
    switch (this.type)
    {
        case FUNC:
            if (this.source.hasOwnProperty(this.value))
                this.read = (caller)=>{return this.source[this.value](caller, ...this.args)};
            else if (this.source.hasOwnProperty('_'+this.value))
                this.read = (caller)=>{return this.source['_'+this.value](caller, ...this.args)};
            break;
        case LOCALVAR:
            this.read = (caller)=>{return caller.locals[this.value]};
            this.write = (nv, caller)=>{caller.locals[this.value] = nv};
            break;
        case TECHVAR:
            this.read = (caller)=>{return caller.techvars[this.value]};
            this.write = (nv, caller)=>{caller.techvars[this.value] = nv};
            break;
        case GLOBALVAR:
            this.read = (caller)=>{return caller.globals[1][this.value]};
            this.write = (nv, caller)=>{caller.globals[1][this.value] = nv};
            break;
        case GLOBALTECHVAR:
            this.read = (caller)=>{return caller.globals[0][this.value]};
            break;
        case FIXEDVAR:
            this.read = (caller)=>{return this.value};
            break;
    }
}

export {
    Block, BlockSequence, Gate, While, Value, EMPTY, FIXEDVAR, FUNC, GLOBALTECHVAR, GLOBALVAR,
    LOCALVAR, RUNFUNC, SETVAR, TECHVAR, UNKNOWNBLOCK, writable
};