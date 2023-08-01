/*
    Copyright © 2023 Alexey Kozhanov

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

/*
NLE2 (NotLexaEngine 2) for JavaScript
Version: 1.3.0
*/

const [LMB, MMB, RMB, MBBACK, MBFORWARD, WHEELDOWN, WHEELUP] = Array(7).keys();

const lengthdir_x = function(length, dir)
{
    return Math.cos(dir*Math.PI/180)*length;
}
const lengthdir_y = function(length, dir)
{
    return -Math.sin(dir*Math.PI/180)*length;
}

const linear_interpolation = function(a, b, power = 1)
{
    let div = Math.pow(2, Math.max(power, 1));
    let reduct = Math.pow(10, Math.max(power, 1));
    let ret = (a*(div-1)/div)+(b*1/div);
    return ret;
};

const range2range = function(value, low1, upp1, low2, upp2)
{
    return ((value-low1)/(upp1-low1))*(upp2-low2) + low2;
};

const clamp = function(value, mn, mx)
{
    return Math.max(mn, Math.min(mx, value));
};

const wrap = function(value, mn, mx)
{
    let a = ((value-mn)%(mx-mn));
    if (a < 0) a += mx-mn;
    return a+mn;
};

const draw_text = function(ctx, x, y, string = 'Sample Text', type = 'fill',
                           size  = 16, hor_align = 'left', vert_align = 'top',
                           color = 'black', font_name = 'serif', weight_style = '')
{
    ctx.font = `${weight_style} ${size}px ` + font_name;

    switch (vert_align)
    {
        case 'top':
            ctx.textBaseline = 'top';
            break;
        case 'center':
            ctx.textBaseline = 'middle';
            break;
        case 'bottom':
        default:
            ctx.textBaseline = 'bottom';
            break;
    }
    ctx.textAlign = hor_align;
    if (type === 'fill')
    {
        ctx.fillStyle = color;
        ctx.fillText(string, x, y);
    }
    else
    {
        ctx.strokeStyle = color;
        ctx.strokeText(string, x, y);
    }
};

const draw_line = function(ctx, x1, y1, x2, y2, color = 'black', linewidth = 1)
{

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = linewidth;
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
};

const Display = function(canvas, canvas_width, canvas_height)
{
    this.ctx = canvas.getContext('2d');
    this.buffer = canvas.getContext('2d');
    this.buffer.canvas.width = canvas_width;
    this.buffer.canvas.height = canvas_height;

    this.original_width = canvas_width;
    this.original_height = canvas_height;

    this.cw = () => this.buffer.canvas.width;
    this.ch = () => this.buffer.canvas.height;
    this.sw = () => this.ctx.canvas.width;
    this.sh = () => this.ctx.canvas.height;
    this.ow = () => this.original_width;
    this.oh = () => this.original_height;

    // Resizes canvas.
    this.resizeCanvas = function(current_room, width, height)
    {
        this.ctx.canvas.width = width;
        this.ctx.canvas.height = height;
        this.scale_level = Math.min(this.sw()/this.ow(), this.sh()/this.oh());
        this.scaled_size = [this.ow() * this.scale_level, this.oh() * this.scale_level];
        this.resizeBuffer(current_room, ...this.scaled_size);
        this.offset_x = (this.sw() - this.scaled_size[0])/2;
        this.offset_y = (this.sh() - this.scaled_size[1])/2;
    };

    this.resizeBuffer = function(current_room, width, height)
    {
        this.buffer.canvas.width = width;
        this.buffer.canvas.height = height;
        if (current_room.hasOwnProperty('do_resize_canvas')) current_room.do_resize_canvas(width, height);
    }

    // Applies this.buffer on the real canvas element.
    this.render = function ()
    {
        /*this.buffer.fillStyle = 'white'
        this.buffer.textAlign = 'center'
        this.buffer.fonts = `normal ${120*Math.min(this.buffer.canvas.width/1920, this.buffer.canvas.height/1080)}px serif`;
        this.buffer.fillText(`Я работаю за ${Math.floor(deltatime*10)/10} миллисекунд!`,
            this.buffer.canvas.width / 2, this.buffer.canvas.height / 2 - 32);
        this.buffer.fillText(`${window.width}px, ${window.height}px`,
            this.buffer.canvas.width / 2, this.buffer.canvas.height / 2 + 32);*/

        //alert(this.offset_x + ' ' + this.offset_y + ' ' + this.scaled_size[0] + ' ' + this.scaled_size[1]);
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.drawImage(this.buffer.canvas, this.offset_x, this.offset_y, ...this.scaled_size);

        //this.ctx.strokeStyle = 'red';
        //this.ctx.strokeRect(0,0, this.sw(), this.sh());
    };

    // Clears buffer by black color.
    this.clear = function ()
    {
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0,0, this.sw(), this.sh())
        this.buffer.fillStyle = 'black';
        this.buffer.fillRect(0, 0, this.cw(), this.ch());
    };
};

var default_room = {do_step: function(){}, do_start: function(){}, do_end: function(){}, do_kb_down: function(){},
    do_kb_up: function(){}, do_mouse_down: function(){}, do_mouse_up: function(){}, do_mouse_move: function(){},
    do_resize_canvas: function(){}};

const Room = function(entities)
{
    this.entities = entities.slice();

    this.do_for_every = function(method_name)
    {
        let additional = Array.prototype.slice.call(arguments, 1);
        for (let e of this.entities)
        {
            for (let ins of e.instances)
            {
                e[method_name](ins, ...additional);
            }
        }
    }

    this.do_step = function(canvas = undefined)
    {
        let step_methods = ['step_before', 'step', 'step_after'];
        let draw_methods = ['draw_before', 'draw', 'draw_after'];
        for (let m of step_methods)
        {
            this.do_for_every(m);
        }
        if (canvas !== undefined)
        {
            for (let m of draw_methods)
            {
                this.do_for_every(m, canvas);
            }
        }
    };

    this.do_start = function(previous_room)
    {
        this.do_for_every('room_start', previous_room);
    };
    this.do_end = function(next_room)
    {
        this.do_for_every('room_end', next_room);
    };
    this.do_kb_down = function(event)
    {
        this.do_for_every('kb_down', event);
    };
    this.do_kb_up = function(event)
    {
        this.do_for_every('kb_up', event);
    };
    this.do_mouse_move = function()
    {
        this.do_for_every('mouse_move')
    };
    this.do_mouse_down = function(mb)
    {
        this.do_for_every('mouse_down', mb)
    };
    this.do_mouse_up = function(mb)
    {
        this.do_for_every('mouse_up', mb)
    };
    this.do_resize_canvas = function(width, height)
    {
        this.do_for_every('canvas_resize', width, height)
    };
};

const Entity = function(events)
{
    this.instances = [];

    this.create = function(){};
    this.step_before = function(){};
    this.step = function(){};
    this.step_after = function(){};
    this.draw_before = function(){};
    this.draw = function(){};
    this.draw_after = function(){};
    this.mouse_move = function(){};
    this.mouse_down = function(){};
    this.mouse_up = function(){};
    this.kb_down = function(){};
    this.kb_up = function(){};
    this.room_start = function(){};
    this.room_end = function(){};
    this.canvas_resize = function(){};

    for (let e in events) this[e] = events[e];

    this.create_instance = function(...create_args)
    {
        let ins = new Instance(this);
        this.instances.push(ins);
        this.create(ins, ...create_args);
        return ins;
    };
};

const Instance = function (entity)
{
    this.entity = entity;
};

const Bitarray = function () // Array of bits -- TODO: REPLACE NUMBERS WITH BIGINTS
{
    this.value = [];
    this.get = function(index)
    {
        while (index >= 32*this.value.length) this.value.push(0);
        let divd = Math.floor(index/32); let modd = index % 32;
        return (this.value[divd] & (1<<modd)) > 0;
    };
    this.invert = function(index)
    {
        while (index >= 32*this.value.length) this.value.push(0);
        let divd = Math.floor(index/32); let modd = index % 32;
        this.value[divd] ^= 1<<modd;
    };
    this.set = function(index, value)
    {
        while (index >= 32*this.value.length) this.value.push(0);
        let divd = Math.floor(index/32);
        if ((!!value) !== this.get(index)) this.invert(index);
    };
};

const create_text_blob = (text) => (new Blob([text],{type:"text/plain"}));

const save = function (content, file)
{
    let a = document.createElement('a');
    let is_blob = content.toString().indexOf("Blob") !== -1;
    let url = content;
    if (is_blob) url = window.URL.createObjectURL(content);
    a.href = url;
    a.download = file;
    a.click();
    if (is_blob) window.URL.revokeObjectURL(url);
    a.remove();
    return 'Successfully saved area!';
};

module.exports = {Display, Room, Entity, Instance, clamp, linear_interpolation,
    draw_text, LMB, RMB, MMB, MBBACK, MBFORWARD, WHEELDOWN, WHEELUP, draw_line, range2range, wrap,
    lengthdir_x, lengthdir_y, default_room, Bitarray, create_text_blob, save};