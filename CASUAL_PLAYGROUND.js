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

//#region [IMPORT]
window.onerror = function(msg, url, linenumber)
{
    alert('Error message: '+msg+'\nURL: '+url+'\nLine Number: '+linenumber);
    return true;
}
import * as engine from './core/nle.mjs';
import * as comp from './core/compiler.mjs';
import * as ctt from './core/compiler_task_types.mjs';
//const vi = require('./version_info.json');
const fs = require('fs');
var vi;
try { vi = JSON.parse(fs.readFileSync('./version_info.json', {encoding: "utf8"})); }
catch (err) { vi = {version_info:{version:"Unknown Version",stage:"Unknown Stage"}}; }

//#endregion


//#region [ИНИЦИАЛИЗАЦИЯ]
let version = vi.version_info.version;
let dvlp_stage = vi.version_info.stage;

global.console.log(
    ' _____                       _    ______ _                                             _ \n' +
    '/  __ \\                     | |   | ___ \\ |                                           | |\n' +
    '| /  \\/ __ _ ___ _   _  __ _| |   | |_/ / | __ _ _   _  __ _ _ __ ___  _   _ _ __   __| |\n' +
    '| |    / _` / __| | | |/ _` | |   |  __/| |/ _` | | | |/ _` | \'__/ _ \\| | | | \'_ \\ / _` |\n' +
    '| \\__/\\ (_| \\__ \\ |_| | (_| | |   | |   | | (_| | |_| | (_| | | | (_) | |_| | | | | (_| |\n' +
    ' \\____/\\__,_|___/\\__,_|\\__,_|_|   \\_|   |_|\\__,_|\\__, |\\__, |_|  \\___/ \\__,_|_| |_|\\__,_|\n' +
    '                                                  __/ | __/ |                            \n' +
    '                                                 |___/ |___/                             \n' +
    'by:                                                                            version:  \n' +
    '  Alexey Kozhanov' + (' '.repeat(72-version.length)) + version                        + '\n' +
    (' '.repeat(89-dvlp_stage.length))                    + dvlp_stage                     + '\n')

document.getElementById('window-name').innerText = `Casual Playground - ${dvlp_stage} ${version}`;

var scale = 100;
var WIDTH = 16*scale;
var HEIGHT = 9*scale;
var WIDTH2 = Math.floor(WIDTH/2);
var HEIGHT2 = Math.floor(HEIGHT/2);
var display = new engine.Display(document.getElementById('CasualPlaygroundCanvas'), 16*scale, 9*scale);
var top_panel = document.getElementById('top_panel');
//alert(JSON.stringify(nw.Window.get().y));
display.resizeCanvas(nw.Window.get().cWindow.width, nw.Window.get().cWindow.height);
nw.Window.get().on
(
    'resize',
    function (width, height) {display.resizeCanvas(width, height-top_panel.offsetHeight);}
)
nw.Window.get().resizeTo(Math.round(window.screen.width*3/4),
    Math.round(window.screen.height*3/4) + top_panel.offsetHeight);
nw.Window.get().moveTo(Math.round(window.screen.width*1/8),
    Math.round(window.screen.height*1/8) - Math.round(top_panel.offsetHeight/2));
//#endregion


//#region [LOADING FUNCTIONS]

const rgb_to_style = (r,g,b) => `rgb(${r}, ${g}, ${b})`;

// INSERT MOD LOADER FUNCTIONS

//#endregion

//#region [SETTINGS]
var loc = 'rus';
//import * as locstrings from './core/localization.json';
var current_instrument = {'type': null};
var gvars = [{'objdata':{},
              'idlist':[],
              'logger':[],
              'board_width':10,
              'board_height':10},
             {}];
var idlist = gvars[0].idlist;
var objdata = gvars[0].objdata;
var logger = gvars[0].logger;

var fontsize = scale*2;
var fontsize_bigger  = Math.floor(32*fontsize/scale);
var fontsize_big     = Math.floor(24*fontsize/scale);
var fontsize_default = Math.floor(16*fontsize/scale);
var fontsize_small   = Math.floor(12*fontsize/scale);
var fontsize_smaller = Math.floor( 8*fontsize/scale);

// INSERT MOD LOADER

var cellbordersize = 0.125;

//#endregion

//#region [ENTITIES]
//#region [GLOBAL CONSOLE]
const EntGlobalConsole = new engine.Entity({
    'create': function(target)
    {
        target.logger_i = 0;
    },

    'step': function (target)
    {
        while (target.logger_i < logger.length)
        {
            let log = logger[target.logger_i];
            let type_string = 'ERROR'; //let type_string = LoggerClass.types[log[0]];
            let time_string = '00:00:00'; //let time_string = timeformat(log[1], 1);
            let prefix = `[${type_string} ${time_string}]` + ' ';
            let prefix_l = prefix.length;
            console.log(prefix + log[2]);
            for (let line in log.slice(3))
            {
                console.log(' '*prefix_l + line);
            }
            target.logger_i++;
        }
    },
    'draw_after': function (target, surface)
    {
        engine.draw_text(surface, surface.canvas.width-10, 10,
            `${(deltatime !== 0) ? Math.round(1/deltatime) : 0} FPS`, 'fill', fontsize_default,
            'right', 'top', 'white');
    }
})
//#endregion
//#region [FIELD BOARD]
const board_step = function(target)
{
    let start = Date.now();
    for (let y = 0; i < target.board_height; y++)
    {
        for (let x = 0; i < target.board_width; x++)
        {
            target.board[y][x].step();
        }
    }
    target.time_elapsed = Date.now() - start;
}

const board_tasks = function(target)
{
    let change_board = false;
    for (let y = 0; i < target.board_height; y++)
    {
        for (let x = 0; i < target.board_width; x++)
        {
            for (let i_args in target.board[y][x].tasks)
            {
                let args = target.board[y][x].tasks[i_args];
                switch (args[0])
                {
                    case ctt.SET_CELL:
                        break;
                }
            }
            target.board[y][x].tasks = [];
        }
    }
    if (change_board)
    {
        target.surfaces['board'] = EntFieldBoard.draw_board(target);
    }
}

const draw_board = function(target)
{
    let bw = target.board_width;
    let bh = target.board_height;
    let bordersize = Math.round(target.viewscale*cellbordersize);
    let cellsize = target.viewscale+bordersize;
    let surface = document.createElement('canvas').getContext('2d');
    surface.canvas.width = (cellsize*bw)+bordersize
    surface.canvas.height = (cellsize*bh)+bordersize;
    surface.fillStyle = rgb_to_style(...target.linecolor_infield);
    surface.fillRect(0, 0, surface.canvas.width, surface.canvas.height);
    for (let ix = 0; ix < bw; ix++)
    {
        for (let iy = 0; iy < bh; iy++)
        {
            let cx = (ix*cellsize)+bordersize;
            let cy = (iy*cellsize)+bordersize;
            //let celldata = target.board[iy][ix].code;
            //surface.fillStyle = rgb_to_style(...celldata.notexture);
            surface.fillStyle = rgb_to_style(109, 183, 65);
            surface.fillRect(cx, cy, target.viewscale, target.viewscale);
        }
    }
    return surface;
}

const board_center_view = function(target)
{
    target.viewx = Math.floor(target.viewscale*target.board_width/2) - (WIDTH2);
    target.viewy = Math.floor(target.viewscale*target.board_height/2) - (HEIGHT2);
}

const EntFieldBoard = new engine.Entity({
    'create': function(target)
    {
        target.board_width = 32;
        target.board_height = 32;

        gvars[0].board_width = target.board_width;
        gvars[0].board_height = target.board_height;

        target.viewscale = 16;
        board_center_view(target);

        target.keys = {'up': false,
                       'left': false,
                       'right': false,
                       'down': false,
                       'speedup': false,
                       'speeddown': false,
                       'rmb': false,
                       'plus': false,
                       'minus': false,};

        target.cameraspeed = Math.round(Math.log2(Math.pow(2, 9)*scale/100));
        target.mincamspeed = Math.round(Math.log2(Math.pow(2, 6)*scale/100));
        target.maxcamspeed = Math.round(Math.log2(Math.pow(2, 14)*scale/100));
        target.hsp = 0;
        target.vsp = 0;
        target.acceleration = 8;
        target.zoomspeed = 1;

        target.linecolor_infield = [26, 26, 26];
        target.linecolor_outfield = [102, 102, 102];

        target.board = [];
        for (let y; y<target.board_height; y++)
        {
            target.board.push([]);
            for (let x; x<target.board_width; x++)
            {
                let celldata = comp.Cell(
                    {'X': x, 'Y': y},
                    idlist.indexOf('grass'),
                    target.board,
                    gvars,
                    );
                target.board.at(-1).push(celldata);
            }
        }

        target.surfaces = {board: draw_board(target)}

        target.time = 0.0;
        target.tpt_power = 28;
        target.get_tpt = (n) => ((n%9 !== 0)
            ? ((10**(Math.floor(n/9)))*(n%9))
            : 10**((Math.floor(n/9))-1)*9) / 1000;
        target.tpt_min = 1;
        target.tpt_max = 60;
        target.timepertick = 1.0;
        target.time_paused = false;
        target.time_elapsed = 0.0;
    },
    'step': function(target)
    {
        if (target.keys.plus) board_zoom_in(target, target.zoomspeed*deltatime);
        if (target.keys.minus) board_zoom_out(target, target.zoomspeed*deltatime);

        let limitspeed = 2**target.cameraspeed;
        let acc = limitspeed*target.acceleration;

        let hmov = target.keys.right - target.keys.left;
        let vmov = target.keys.down - target.keys.up;

        if (hmov !== 0)
            target.hsp = engine.clamp(target.hsp + deltatime*acc*hmov, -limitspeed, limitspeed);
        else
            target.hsp = engine.clamp(target.hsp - deltatime*acc*Math.sign(target.hsp),
                Math.min(target.hsp, 0), Math.max(0, target.hsp));
        if (vmov !== 0)
            target.vsp = engine.clamp(target.vsp + deltatime*acc*vmov, -limitspeed, limitspeed);
        else
            target.vsp = engine.clamp(target.vsp - deltatime*acc*Math.sign(target.vsp),
                Math.min(target.vsp, 0), Math.max(0, target.vsp));

        target.viewx += deltatime*target.hsp;
        target.viewy += deltatime*target.vsp;

        //do_instrument(target);

        if (!target.time_paused) target.time += deltatime;
        //if (target.time > target.timepertick) board_step(target);
    },
    'step_after': function(target)
    {
        if (target.time > target.timepertick)
        {
            //board_tasks(target);
            target.time = 0;
        }
    },
    'draw': function(target, surface)
    {
        let bordersize = Math.round(target.viewscale*cellbordersize);
        let cellsize = target.viewscale + bordersize;
        let ox = -target.viewx%cellsize;
        let oy = -target.viewy%cellsize;
        let lx = Math.ceil(WIDTH/cellsize);
        let ly = Math.ceil(HEIGHT/cellsize);
        let realx, realy;
        if (target.viewx > 0) { realx = -target.viewx-1; }
        else { realx = -target.viewx; }
        if (target.viewy > 0) { realy = -target.viewy-1; }
        else { realy = -target.viewy; }
        surface.drawImage(target.surfaces.board.canvas, realx, realy);

        let linex, liney, startx, starty, endx, endy;
        surface.fillStyle = rgb_to_style(...target.linecolor_outfield);
        for (let ix = -1; ix < lx; ix++)
        {
            linex = ox+(ix*cellsize);
            starty = engine.clamp(0, -target.viewy, -target.viewy+(cellsize*target.board_height));
            endy = engine.clamp(HEIGHT, -target.viewy, -target.viewy+(cellsize*target.board_height));
            if (!((linex+target.viewx < 0) || (linex+target.viewx > (cellsize*target.board_width))))
            {
                if (starty-2 > 0) surface.fillRect(linex, 0, bordersize, starty);
                if (HEIGHT > endy) surface.fillRect(linex, endy+bordersize, bordersize, HEIGHT-endy)
            }
            else surface.fillRect(linex, 0, bordersize, HEIGHT);
        }
        for (let iy = -1; iy < ly; iy++)
        {
            liney = oy+(iy*cellsize)
            startx = engine.clamp(0, -target.viewx, -target.viewx+(cellsize*target.board_width));
            endx = engine.clamp(WIDTH, -target.viewx, -target.viewx+(cellsize*target.board_width));
            if (!((liney+target.viewy < 0) || (liney+target.viewy > (cellsize*target.board_height))))
            {
                if (starty-2 > 0) surface.fillRect(0, liney, startx, bordersize);
                if (WIDTH > endx) surface.fillRect(endx+bordersize, liney, WIDTH-endx, bordersize);
            }
            else surface.fillRect(0, liney, WIDTH, bordersize);
        }

        engine.draw_text(surface, WIDTH-2, HEIGHT-2,
            `Max speed: ${Math.pow(2, target.cameraspeed)}`,
            'fill', fontsize_default, 'right', 'bottom', 'white');
        engine.draw_text(surface, WIDTH-2, HEIGHT-fontsize_default,
            `hsp: ${Math.round(target.hsp)} / vsp: ${Math.round(target.vsp)}`,
            'fill', fontsize_default, 'right', 'bottom', 'white');

        // INSERT TIME ELAPSED & INSTRUMENT DATA
    }
})
//#endregion
//#region [FIELD STANDARD UI]
const EntFieldSUI = new engine.Entity();
//#endregion
//#endregion

//#region [INSTANCES]
var globalconsole = EntGlobalConsole.create_instance();
var fieldboard = EntFieldBoard.create_instance();
//#endregion

//#region [ROOMS]
var room_field = new engine.Room([EntGlobalConsole, EntFieldBoard, EntFieldSUI]);

engine.change_current_room(room_field);
//#endregion

//#region [RUN]
var running = true;
var prevtime = 0.0;
var deltatime = 0.0;
const main = function (time)
{
    if (running)
    {
        deltatime = (time - prevtime)/1000;
        prevtime = time;
        display.clear();
        engine.current_room.do_step(display.buffer);
        display.render();
        window.requestAnimationFrame(main);
    }
}

window.requestAnimationFrame(main);


//#endregion