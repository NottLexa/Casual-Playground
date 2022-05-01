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

/*
NLE2 (NotLexaEngine 2) for JavaScript
Version: 1.0.0
*/

const interpolate = function(a, b, power = 1)
{
    let div = Math.pow(2, Math.max(power, 1));
    return (a*(div-1)/div)+(b*1/div);
}

const clamp = function(value, mn, mx)
{
    return Math.max(mn, Math.min(mx, value));
}

const Display = function(canvas, canvas_width, canvas_height)
{
    this.ctx = canvas.getContext('2d');
    this.buffer = document.createElement('canvas').getContext('2d');
    this.buffer.canvas.width = canvas_width;
    this.buffer.canvas.height = canvas_height;

    this.cw = () => this.buffer.canvas.width;
    this.ch = () => this.buffer.canvas.height;
    this.sw = () => this.ctx.canvas.width;
    this.sh = () => this.ctx.canvas.height;

    // Resizes canvas.
    this.resizeCanvas = function(width, height)
    {
        this.ctx.canvas.width = width;
        this.ctx.canvas.height = height;
        this.scale_level = Math.min(this.sw()/this.cw(), this.sh()/this.ch())
        this.scaled_size = [this.cw() * this.scale_level, this.ch() * this.scale_level];
        this.offset_x = this.sw() - this.scaled_size[0];
        this.offset_y = this.sh() - this.scaled_size[1];
    };

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
        this.ctx.drawImage(this.buffer.canvas, this.offset_x/2, this.offset_y/2, ...this.scaled_size);

        //this.ctx.strokeStyle = 'red';
        //this.ctx.strokeRect(0,0, this.sw(), this.sh());
    };

    // Clears buffer by black color.
    this.clear = function ()
    {
        this.buffer.fillStyle = 'black';
        this.buffer.fillRect(0, 0, this.cw(), this.ch());
    };
};

var current_room = {do_step: function(){}, start: function(){}, end: function(){}};
const change_current_room = function(new_room)
{
    current_room.end();
    current_room = new_room;
    current_room.start();
}

const Room = function(entities)
{
    this.entities = entities.slice();

    this.do_step = function(canvas = undefined)
    {
        let step_methods = ['step_before', 'step', 'step_after'];
        let draw_methods = ['draw_before', 'draw', 'draw_after'];
        for (let i in step_methods)
        {
            let m = step_methods[i];
            for (let j in this.entities)
            {
                let ent = this.entities[j];
                for (let k in ent.instances)
                {
                    let ins = ent.instances[k];
                    ent[m](ins);
                }
            }
        }
        if (canvas !== undefined)
        {
            for (let i in draw_methods)
            {
                let m = draw_methods[i];
                for (let j in this.entities)
                {
                    let ent = this.entities[j];
                    for (let k in ent.instances)
                    {
                        let ins = ent.instances[k];
                        ent[m](ins, canvas);
                    }
                }
            }
        }
    };

    this.start = function()
    {
        for (let ent in this.entities) for (let ins in ent.instances) ent.room_start(ins);
    };
    this.end = function()
    {
        for (let ent in this.entities) for (let ins in ent.instances) ent.room_end(ins);
    };
};

const Entity = function(events)
{
    this.instances = [];

    this.create = events?.create ?? function(){};
    this.step_before = events?.step_before ?? function(){};
    this.step = events?.step ?? function(){};
    this.step_after = events?.step_after ?? function(){};
    this.draw_before = events?.draw_before ?? function(){};
    this.draw = events?.draw ?? function(){};
    this.draw_after = events?.draw_after ?? function(){};
    this.mouse_move = events?.mouse_move ?? function(){};
    this.mouse_down = events?.mouse_down ?? function(){};
    this.mouse_up = events?.mouse_up ?? function(){};
    this.kb_down = events?.kb_down ?? function(){};
    this.kb_up = events?.kb_up ?? function(){};
    this.room_start = events?.room_start ?? function(){};
    this.room_end = events?.room_end ?? function(){};

    this.create_instance = function()
    {
        let ins = new Instance(this);
        this.instances.push(ins);
        this.create(ins);
        return ins;
    };
};

const Instance = function (entity)
{
    this.entity = entity;
};

export {Display, current_room, change_current_room, Room, Entity, Instance, clamp, interpolate};

/*module.exports =
{
    Display: Display,
    current_room: current_room,
    Room: Room,
    Entity: Entity,
    Instance: Instance
};*/