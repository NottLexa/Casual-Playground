import {join} from '../../nle.mjs';

const [UNKNOWNBLOCK, SETVAR, RUNFUNC] = [...Array(3).keys()];
const [FUNC, LOCALVAR, TECHVAR, GLOBALVAR, GLOBALTECHVAR, FIXEDVAR, EMPTY] = [...Array(7).keys()];
const writable = (type) => {[LOCALVAR, TECHVAR, GLOBALVAR].includes(type)};
//const back_funcs = (value_to_name) => ['UNKNOWNBLOCK', 'SETVAR', 'RUNFUNC'][value_to_name];

const BlockSequence = function(blocks=[])
{
    this.blocks = blocks;
    this.add = function(...other){this.blocks.push(other)};
    this.unite = function(other){return BlockSequence(this.blocks.concat(other.blocks))};
    this.get = (index)=>{this.blocks[index]};
    this.set = (index,value)=>{this.blocks[index]=value};
    this.exec = function(caller)
    {
        for (let b in this.blocks) this.blocks[b].exec(caller);
    }
}

const Gate = function(cond_blocks=[], else_block=null)
{
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
}

const While = function(cond, block)
{
    this.cond = cond;
    this.block = block;
    this.exec = function(caller)
    {
        while (this.cond.read(caller)) this.block.exec(caller);
    }
}

const Block = function(type, ...data)
{
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
}

const Value = function(type, value=null, source=null, ...args)
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
                this.read = (caller)=>{this.source[this.value](caller, ...this.args)};
            else if (this.source.hasOwnProperty('_'+this.value))
                this.read = (caller)=>{this.source['_'+this.value](caller, ...this.args)};
            break;
        case LOCALVAR:
            this.read = (caller)=>{caller.locals[this.value]};
            this.write = (nv, caller)=>{caller.locals[this.value] = nv};
            break;
        case TECHVAR:
            this.read = (caller)=>{caller.techvars[this.value]};
            this.write = (nv, caller)=>{caller.techvars[this.value] = nv};
            break;
        case GLOBALVAR:
            this.read = (caller)=>{caller.globals[1][this.value]};
            this.write = (nv, caller)=>{caller.globals[1][this.value] = nv};
            break;
        case GLOBALTECHVAR:
            this.read = (caller)=>{caller.globals[0][this.value]};
            break;
        case FIXEDVAR:
            this.read = (caller)=>{this.value};
            break;
    }
}