import * as ctt from '../../compiler_task_types.mjs';

var CoreFuncs = {
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
    setcell: function(caller, x, y)
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
        return caller.globals[0].idlist.indexOf(a.read(caller));
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
}

export {CoreFuncs};