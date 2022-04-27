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
//const fs = require('fs').promises;
//#endregion


//#region [ИНИЦИАЛИЗАЦИЯ]
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
    '  Alexey Kozhanov                                                                      #1\n' +
    '                                                                               DVLP BUILD\n')

var scale = 100;
var display = new engine.Display(document.getElementById('CasualPlaygroundCanvas'), 16*scale, 9*scale);
display.resizeCanvas(nw.Window.get().width, nw.Window.get().height);
nw.Window.get().on
(
    'resize',
    function (width, height) {display.resizeCanvas(width, height);}
)
//#endregion


//#region [LOADING FUNCTIONS]

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
        surface.fillStyle = 'white';
        surface.font = `${fontsize_default}px serif`;
        surface.textAlign = 'right';
        surface.fillText(
            `${deltatime !== 0 ? Math.round(1/deltatime) : 0} FPS`,
            surface.canvas.width-8,
            8
        );
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
            for (let args in target.board[y][x].tasks)
            {
                // INSERT TASK OPERATIONS
            }
        }
    }
    if (change_board)
    {
        target.surfaces['board'] = EntFieldBoard.draw_board(target);
    }
}

const EntFieldBoard = new engine.Entity({
    'create': function(target)
    {
        target.board_width = 32;
        target.board_height = 32;

        gvars[0].board_width = target.board_width;
        gvars[0].board_height = target.board_height;

        target.viewscale = 16;
        EntFieldBoard.center_view(target);

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

        target.linecolor_infield = 'gray10';
        target.linecolor_outfield = 'gray40';

        target.board = [];
        for (let y; y<target.board_height; y++)
        {
            target.board.push([]);
            for (let x; x<target.board_width; x++)
            {
                let celldata = comp.Cell(
                    {'X': x, 'Y': y},
                    idlist.indexOf('grass')

                    )
            }
        }
    }
})
//#endregion
//#region [FIELD STANDARD UI]
const EntFieldSUI = new engine.Entity();
//#endregion
//#endregion

//#region [INSTANCES]
var globalconsole = EntGlobalConsole.create_instance();
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
        deltatime = time - prevtime;
        prevtime = time;
        display.clear();
        engine.current_room.do_step(display.buffer);
        display.render();
        window.requestAnimationFrame(main);
    }
}

window.requestAnimationFrame(main);


//#endregion