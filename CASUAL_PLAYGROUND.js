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
    nw.Window.get().close();
    return true;
}
import * as engine from './core/nle.mjs';
import * as comp from './core/compiler.mjs';
import * as ctt from './core/compiler_task_types.mjs';
import * as ccc from './core/compiler_conclusions_cursors.mjs';
const fs = require('fs');
const path = require('path');
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
var canvas_element = document.getElementById('CasualPlaygroundCanvas');
var display = new engine.Display(canvas_element, 16*scale, 9*scale);
var top_panel = document.getElementById('top_panel');
var text_window = document.getElementById('text_window');
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

nw.Window.get().show();
//#endregion


//#region [LOADING FUNCTIONS]

const get_text_width = function(txt, font)
{
    text_window.style.font = font;
    text_window.innerHTML = txt;
    return text_window.offsetWidth;
};

const arraysEqual = function(a, b)
{
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length !== b.length) return false;
    for (var i = 0; i < a.length; ++i) {
        if (a[i] !== b[i]) return false;
    }
    return true;
};

const roundRect = function(ctx, x, y, width, height, radius, stroke = false)
{
    if (typeof radius === 'number') {
        radius = {tl: radius, tr: radius, br: radius, bl: radius};
    } else {
        radius = {...{tl: 0, tr: 0, br: 0, bl: 0}, ...radius};
    }
    let half = stroke ? Math.round(ctx.lineWidth/2) : 0;
    ctx.beginPath();
    ctx.moveTo(x + radius.tl + half, y + half);
    ctx.lineTo(x + width - radius.tr - half, y + half);
    ctx.quadraticCurveTo(x + width - half, y + half,
        x + width - half, y + radius.tr + half);
    ctx.lineTo(x + width - half, y + height - radius.br - half);
    ctx.quadraticCurveTo(x + width - half, y + height - half,
        x + width - radius.br - half, y + height - half);
    ctx.lineTo(x + radius.bl + half, y + height - half);
    ctx.quadraticCurveTo(x + half, y + height - half,
        x + half, y + height - radius.bl - half);
    ctx.lineTo(x + half, y + radius.tl + half);
    ctx.quadraticCurveTo(x + half, y + half,
        x + radius.tl + half, y + half);
    ctx.closePath();
    if (stroke) ctx.stroke();
    else ctx.fill();
};

const rgb_to_style = (r,g,b) => `rgb(${r}, ${g}, ${b})`;

const cut_string = function(string, upto)
{
    if (string.length <= upto) return string;
    else return string.slice(0, upto-3) + '...';
};

const load_fonts = function(fontsfolder)
{
    for (let m of fs.readdirSync(fontsfolder, {encoding: "utf8"}))
    {
        let filepath = path.join(fontsfolder, m);
        if (fs.lstatSync(filepath).isFile() && filepath.slice(-4) === '.ttf')
        {
            $("head").prepend("<style type=\"text/css\">" +
                "@font-face {\n" +
                "\tfont-family: \"myFont\";\n" +
                `\tsrc: local('☺'), url('${filepath}') format('opentype');\n` +
                "}\n" +
                "\tp.myClass {\n" +
                "\tfont-family: myFont !important;\n" +
                "}\n" +
                "</style>");
        }
    }
};

const load_modlist = function(modsfolder)
{
    return fs.readdirSync(modsfolder, {encoding: "utf8"})
        .filter(filepath => fs.lstatSync(path.join(modsfolder, filepath)).isDirectory());
};

const load_mod = function(modfolder, mod_origin, official)
{
    let mods = {};
    for (let filename of fs.readdirSync(modfolder, {encoding: "utf8"}))
    {
        let filepath = path.join(modfolder, filename);
        if (fs.lstatSync(filepath).isFile())
        {
            if (filepath.slice(-4).toLowerCase() === '.mod') {
                let f = fs.readFileSync(filepath, {encoding: "utf8"});
                let [moddata, concl, cur] = comp.get(f);
                if (!ccc.correct_concl(concl)) {
                    logger.push([
                        comp.LoggerClass.ERROR,
                        new Date(),
                        `Couldn't load ${filepath}`,
                        `CasualPlayground Compiler encountered an error: ${concl.code}`,
                        concl.full_conclusion(),
                        cur.highlight(),
                        cur.string(),
                    ])
                }
                let modname = filename.slice(0, -4);
                moddata.origin = mod_origin;
                moddata.official = official;
                let imgpath = filepath.slice(0, -4) + '.png';
                if (fs.existsSync(imgpath) && fs.lstatSync(imgpath).isFile())
                    moddata.texture = imgpath;
                if (official) mods[modname] = moddata;
                else mods[`${mod_origin}/${modname}`] = moddata;

            }
        }
    }
    return mods;
}

//#endregion

//#region [SETTINGS]
var loc = 'rus';
var locstrings = JSON.parse(fs.readFileSync('./core/localization.json', {encoding:"utf8"})).localization;
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

// INSERT FONT LOADER

var corefolder = path.join('core', 'corecontent');
var modsfolder = path.join('data', 'mods');

let coremods = load_mod(corefolder, 'Casual Playground', 1);
idlist.push(...Object.keys(coremods));
objdata = {...objdata, ...coremods};

for (let moddir of load_modlist(modsfolder))
{
    let modpath = path.join(modsfolder, moddir);
    let mod = load_mod(modpath, moddir, 0);
    idlist.push(...Object.keys(mod));
    objdata = {...objdata, ...mod};
}

gvars[0].objdata = objdata;

global.console.log(Object.keys(objdata));
global.console.log(idlist);
global.console.log(idlist.map((value, index) => [index, value]));

var cell_fill_on_init = idlist.indexOf('grass');
var cellbordersize = 0.125;

//#endregion

//#region [ENTITIES]
//#region [GLOBAL CONSOLE]
const EntGlobalConsole = new engine.Entity({
    create: function(target)
    {
        target.log = [];
        target.logger_i = 0;
    },

    step: function (target)
    {
        while (target.logger_i < logger.length)
        {
            let log = logger[target.logger_i];
            let type_string = comp.LoggerClass.types[log[0]];//'ERROR';
            let time_string = '00:00:00'; //let time_string = timeformat(log[1], 1);
            let prefix = `[${type_string} ${time_string}]` + ' ';
            let prefix_l = prefix.length;
            //process.stdout.write(prefix + log[2]);
            global.console.log(prefix + log[2]);
            target.log.push(prefix + log[2]);
            for (let line of log.slice(3))
            {
                //process.stdout.write(' '.repeat(prefix_l) + line);
                global.console.log(' '.repeat(prefix_l) + line);
                target.log.push(' '.repeat(prefix_l) + line);
            }
            target.logger_i++;
        }
    },
    draw_after: function (target, surface)
    {
        engine.draw_text(surface, surface.canvas.width-10, 10,
            `${(deltatime !== 0) ? Math.round(1/deltatime) : 0} FPS`, 'fill', fontsize_default,
            'right', 'top', 'white');
        for (let i in target.log)
        {
            engine.draw_text(surface, 10,
                surface.canvas.height-100-(target.log.length*fontsize_smaller)+(i*fontsize_smaller),
                target.log[i], 'fill', fontsize_smaller, 'left', 'bottom', 'white', 'monospace');
        }
    }
});
//#endregion
//#region [FIELD BOARD]
const board_step = function(target)
{
    let start = Date.now();
    for (let y = 0; y < target.board_height; y++)
    {
        for (let x = 0; x < target.board_width; x++)
        {
            target.board[y][x].step();
        }
    }
    target.time_elapsed = (Date.now() - start)/1000;
};

const board_tasks = function(target)
{
    let taskcount = 0;
    let change_board = false;
    for (let y = 0; y < target.board_height; y++)
    {
        for (let x = 0; x < target.board_width; x++)
        {
            for (let args of target.board[y][x].tasks)
            {
                switch (args[0])
                {
                    case ctt.SET_CELL:
                        let [_x, _y, _cellid] = args.slice(1);
                        target.board[_y][_x] = new comp.Cell({X: _x, Y: _y}, _cellid, target.board,
                            gvars);
                        change_board = true;
                        break;
                }
                taskcount++;
            }
            target.board[y][x].tasks = [];
        }
    }
    if (change_board)
    {
        target.surfaces.board = draw_board(target);
    }
};

const draw_board = function(target)
{
    let bw = target.board_width;
    let bh = target.board_height;
    let bordersize = target.viewscale*cellbordersize;
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
            let celldata = target.board[iy][ix].code;
            surface.fillStyle = rgb_to_style(...celldata.notexture);
            //surface.fillStyle = rgb_to_style(109, 183, 65);
            surface.fillRect(cx, cy, target.viewscale, target.viewscale);
        }
    }
    return surface;
};

const board_center_view = function(target)
{
    target.viewx = Math.floor(target.viewscale*target.board_width/2) - (WIDTH2);
    target.viewy = Math.floor(target.viewscale*target.board_height/2) - (HEIGHT2);
};

const board_zoom_in = function(target, mul)
{
    let oldvs = target.viewscale;
    target.viewscale = engine.clamp(
        target.viewscale + engine.clamp(Math.floor(0.2 * mul * target.viewscale), 1, 64),
        2, 64);
    let newvs = target.viewscale;

    target.viewx = (target.viewx + (WIDTH2)) * newvs / oldvs - (WIDTH2);
    target.viewy = (target.viewy + (HEIGHT2)) * newvs / oldvs - (HEIGHT2);

    target.surfaces.board = draw_board(target);
};
const board_zoom_out = function(target, mul)
{
    let oldvs = target.viewscale;
    target.viewscale = engine.clamp(
        target.viewscale - engine.clamp(Math.floor(0.2 * mul * target.viewscale), 1, 64),
        2, 64);
    let newvs = target.viewscale;

    target.viewx = (target.viewx + (WIDTH2)) * newvs / oldvs - (WIDTH2);
    target.viewy = (target.viewy + (HEIGHT2)) * newvs / oldvs - (HEIGHT2);

    target.surfaces.board = draw_board(target);
};
const board_do_instrument = function(target)
{
    let bordersize = target.viewscale*cellbordersize;
    let cellsize = bordersize + target.viewscale;
    let rx = mx + target.viewx - bordersize;
    let ry = my + target.viewy - bordersize;
    let cx = Math.floor(rx/cellsize);
    let cy = Math.floor(ry/cellsize);
    let maxcx = target.board_width;
    let maxcy = target.board_height;
    switch (current_instrument.type)
    {
        case 'pencil':
            scale = current_instrument.scale-1
            if (current_instrument.penciltype === true) // round
            {

            }
            else // square
            {
                if (((rx % cellsize) < target.viewscale) && ((ry % cellsize) < target.viewscale))
                {
                    for (let ix = cx-scale; ix < cx+scale+1; ix++)
                    {
                        for (let iy = cy-scale; iy < cy+scale+1; iy++)
                        {
                            if ((0 <= ix) && (ix < maxcx) && (0 <= iy) && (iy < maxcy))
                            {
                                let cellid = current_instrument.cell;
                                target.board[iy][ix] = new comp.Cell({X:ix,Y:iy},cellid, target.board,
                                    gvars);
                                target.surfaces.board = draw_board(target);
                            }
                        }
                    }
                }
            }
    }
};

const EntFieldBoard = new engine.Entity({
    create: function(target)
    {
        target.board_width = 32;
        target.board_height = 32;

        gvars[0].board_width = target.board_width;
        gvars[0].board_height = target.board_height;

        target.viewscale = 16;
        board_center_view(target);

        target.keys = {
            'up': false,
            'left': false,
            'right': false,
            'down': false,
            'speedup': false,
            'speeddown': false,
            'rmb': false,
            'plus': false,
            'minus': false,
            'shift': false,
        };

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
        for (let y = 0; y<target.board_height; y++)
        {
            target.board.push([]);
            for (let x = 0; x<target.board_width; x++)
            {
                let celldata = new comp.Cell(
                    {'X': x, 'Y': y},
                    cell_fill_on_init,
                    target.board,
                    gvars,
                    );
                target.board[target.board.length-1].push(celldata);
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
    step: function(target)
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

        if (target.keys.rmb) board_do_instrument(target);

        if (!target.time_paused) target.time += deltatime;
        if (target.time > target.timepertick) board_step(target);
    },
    step_after: function(target)
    {
        if (target.time > target.timepertick)
        {
            board_tasks(target);
            target.time = 0;
        }
    },
    draw: function(target, surface)
    {
        let bordersize = target.viewscale*cellbordersize;
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
                if (startx-2 > 0) surface.fillRect(0, liney, startx, bordersize);
                if (WIDTH > endx) surface.fillRect(endx+bordersize, liney, WIDTH-endx, bordersize);
            }
            else surface.fillRect(0, liney, WIDTH, bordersize);
        }

        // speed
        engine.draw_text(surface, WIDTH-2, HEIGHT-2,
            `Max speed: ${Math.pow(2, target.cameraspeed)}`,
            'fill', fontsize_default, 'right', 'bottom', 'white');
        engine.draw_text(surface, WIDTH-2, HEIGHT-fontsize_default,
            `hsp: ${Math.round(target.hsp)} / vsp: ${Math.round(target.vsp)}`,
            'fill', fontsize_default, 'right', 'bottom', 'white');

        // time per tick
        engine.draw_text(surface,
            5, -5 + surface.canvas.height - fontsize_default,
            `${target.timepertick}s`+(target.time_paused ? ' | Paused' : ''),
            'fill', fontsize_default, 'left', 'top', 'white');

        // time elapsed
        let clr = target.time_elapsed <= target.timepertick ? 'white' : rgb_to_style(17*14, 17, 17);
        engine.draw_text(surface,
            5, -10 + surface.canvas.height - fontsize_default - 2*fontsize_small,
            `${Math.round(target.time_elapsed*100000)/100000} s`,
            'fill', fontsize_small, 'left', 'top', clr);
        engine.draw_text(surface,
            5, -10 + surface.canvas.height - fontsize_default - fontsize_small,
            `${Math.round(target.time_elapsed/(target.board_width*target.board_height)*100000)/100000} s/cell`,
            'fill', fontsize_small, 'left', 'top', clr);

        // instrument
        switch (current_instrument.type)
        {
            case 'pencil':
                let string = `Pencil[${current_instrument.scale}] | ${idlist[current_instrument.cell]}` +
                    ` | ${current_instrument.penciltype ? 'Round' : 'Square'}`
                engine.draw_text(surface,
                    surface.canvas.width - 2, surface.canvas.height - 2 - 2*(fontsize_default-2),
                    string, 'fill', fontsize_default, 'right', 'bottom', 'white');
        }
    },
    kb_down: function(target, key)
    {
        let setkey = true;
        switch (key.code)
        {
            case 'ArrowUp':
            case 'KeyW':
                target.keys.up = setkey;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                target.keys.left = setkey;
                break;
            case 'ArrowDown':
            case 'KeyS':
                target.keys.down = setkey;
                break;
            case 'ArrowRight':
            case 'KeyD':
                target.keys.right = setkey;
                break;
            case 'Equal':
                target.keys.plus = setkey;
                break;
            case 'Minus':
                target.keys.minus = setkey;
                break;
            case 'ShiftLeft':
            case 'ShiftRight':
                target.keys.shift = setkey;
                break;
            case 'KeyQ':
                target.cameraspeed = engine.clamp(target.cameraspeed-1, target.mincamspeed, target.maxcamspeed);
                break;
            case 'KeyE':
                target.cameraspeed = engine.clamp(target.cameraspeed+1, target.mincamspeed, target.maxcamspeed);
                break;
            case 'KeyC':
                board_center_view(target);
                target.hsp = 0;
                target.vsp = 0;
                break;
            case 'KeyF':
                target.time_paused = !target.time_paused;
                break;
            case 'KeyR':
                target.tpt_power = Math.max(target.tpt_min, target.tpt_power-1);
                target.timepertick = target.get_tpt(target.tpt_power);
                break;
            case 'KeyT':
                target.tpt_power = Math.max(target.tpt_min, target.tpt_power+1);
                target.timepertick = target.get_tpt(target.tpt_power);
                break;
        }
    },
    kb_up: function(target, key)
    {
        let setkey = false;
        switch (key.code)
        {
            case 'ArrowUp':
            case 'KeyW':
                target.keys.up = setkey;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                target.keys.left = setkey;
                break;
            case 'ArrowDown':
            case 'KeyS':
                target.keys.down = setkey;
                break;
            case 'ArrowRight':
            case 'KeyD':
                target.keys.right = setkey;
                break;
            case 'Equal':
                target.keys.plus = setkey;
                break;
            case 'Minus':
                target.keys.minus = setkey;
                break;
            case 'ShiftLeft':
            case 'ShiftRight':
                target.keys.shift = setkey;
                break;
        }
    },
    mouse_down: function (target, mb)
    {
        let setkey = true;
        switch (mb)
        {
            case engine.RMB:
                target.keys.rmb = setkey;
                break;
            case engine.WHEELUP:
                if (target.keys.shift) current_instrument.scale++;
                else board_zoom_in(target, 1);
                break;
            case engine.WHEELDOWN:
                if (target.keys.shift)
                    current_instrument.scale = Math.max(current_instrument.scale-1, 1);
                else board_zoom_out(target, 1);
                break;
        }
    },
    mouse_up: function (target, mb)
    {
        let setkey = false;
        switch (mb)
        {
            case engine.RMB:
                target.keys.rmb = setkey;
                break;
        }
    },
});
//#endregion
//#region [FIELD STANDARD UI]
const FieldSUI_mouse_on_cell = function(target)
{
    let [ds, eb, ws] = [target.display_scale, target.element_border, target.window_spacing];
    let measure = Math.floor(target.cellmenu_width*1.5);
    let phase_offset = Math.floor(measure*target.show_step)-measure;
    let inoneline = Math.floor((target.cellmenu_width - ws) / (ds + eb));
    let mousex = mx-phase_offset;
    let mousey = my;
    let [detectwidth, detectheight] = [ds + eb, ds + fontsize_smaller + (1.5 * eb)];
    let ci = Math.floor((mousex-eb)/detectwidth) + (Math.floor((mousey-eb)/detectheight) * inoneline);
    let cx = ws + eb + ((ds + eb)*(ci%inoneline));
    let cy = ws + eb + ((ds + eb + fontsize_smaller)*Math.floor(ci/inoneline));
    if (cx <= mousex && mousex <+ cx + detectwidth - eb)
        if (cy <= mousey && mousey <= cy + detectheight - eb)
            if (ci < idlist.length && ci >= 0)
                return ci;
    return null;
};

const FieldSUI_draw_desc_window = function(target, cellid)
{
    //let widths = [];
    let cellname = idlist[cellid];
    let [border, padding, divider] = [4, 8, 12].map(value => Math.round(value*scale/100));
    let padding2 = padding*2;
    let canvaswidth = target.desc_window_width - padding2;
    let name_size = fontsize_big;
    let origin_size = fontsize_smaller;
    let description_size = fontsize_smaller;
    //let space_scale = 1/3;

    let celldata = objdata[cellname];
    let localization = celldata.localization;
    let name_string = localization.hasOwnProperty(loc) ? localization[loc].name : celldata.name;
    let origin_string = celldata.origin;
    let origin_color = celldata.official ? 'green' : 'white';
    let from_string = locstrings.from.hasOwnProperty(loc) ? locstrings.from[loc] : locstrings.from.__noloc;
    let desc_string = localization.hasOwnProperty(loc) ? localization[loc].desc : celldata.desc;

    let border_color = '#4d4d4d';
    let bg_color = 'rgba(77,77,77,0.5)';

    let surface = document.createElement('canvas').getContext('2d');
    surface.font = `${name_size}px sans-serif`;
    let txt_size1 = get_text_width(name_string, surface.font);//surface.measureText(name_string);
    name_size = name_size * Math.min(1, canvaswidth / txt_size1);

    let linewidth = 0;
    let y_offset = 0;
    let lines = [''];
    surface.font = `${description_size*100}px sans-serif`;
    for (let letter of desc_string)
    {
        let letter_width = get_text_width(letter, surface.font)/100;//surface.measureText(letter).width;
        //widths.push(letter_width);
        if (linewidth + letter_width > canvaswidth)
        {
            linewidth = 0;
            lines.push(['']);
            y_offset += description_size;
        }
        lines[lines.length-1] += letter;
        linewidth += letter_width;
    }

    surface.canvas.width = target.desc_window_width;
    surface.canvas.height = name_size + origin_size + divider + padding2 +
        y_offset + description_size + origin_size;
    surface.globalCompositeOperation = 'destination-atop';
    surface.fillStyle = bg_color;
    roundRect(surface, 0, 0, surface.canvas.width, surface.canvas.height,
        8, false);
    surface.globalCompositeOperation = 'source-over';
    surface.strokeStyle = border_color;
    surface.lineWidth = border;
    roundRect(surface, 0, 0, surface.canvas.width, surface.canvas.height,
        8, true);

    let y = padding;
    engine.draw_text(surface, padding, y, name_string, 'fill', name_size,
        'left', 'top', 'white');

    y += name_size + Math.floor(divider/2);
    engine.draw_line(surface, padding, y, target.desc_window_width - padding,
        y, border_color, border);

    y += Math.floor(divider/2);
    surface.font = `${description_size}px`;
    for (let line of lines)
    {
        let x = padding;
        engine.draw_text(surface, x, y, line, 'fill', description_size,
            'left', 'top', 'white');
        x += get_text_width(line, surface.font);//surface.measureText(line);
        y += description_size;
    }

    y += Math.floor(divider/2);
    engine.draw_line(surface, padding, y, target.desc_window_width - padding,
        y, border_color, border);

    y += Math.floor(divider/2);
    engine.draw_text(surface, target.desc_window_width - padding, y,
        origin_string, 'fill', origin_size, 'right', 'top', origin_color);
    engine.draw_text(surface, padding, y, from_string, 'fill', origin_size,
        'left', 'top', origin_color);

    /*let ow = 0;
    for (let w of widths)
    {
        let x = ow+padding;
        let y = padding+divider+name_size;
        engine.draw_line(surface, x, y, x+w, y, `hsl(${(10*ow) % 360}, 100%, 50%)`);
        ow += w;
    }*/

    return surface;
};

const EntFieldSUI = new engine.Entity({
    create: function (target)
    {
        target.keys = {ctrl: false};
        target.show_step = 0.0;
        target.show_menu = false;
        target.show_all = true;
        target.element_number = 5;
        let en = target.element_number;
        target.window_spacing = Math.round(8*scale/100);
        let ws = target.window_spacing;
        target.display_scale = Math.round(80*scale/100);
        let ds = target.display_scale;
        target.element_border = Math.round(target.display_scale/4);
        let eb = target.element_border;
        target.cellmenu_width = ws + en*(ds + eb) + eb;

        target.desc_window_width = 256+128;
        target.desc_window_surface = document.createElement('canvas').getContext('2d');
        target.desc_window_id = -1;
        target.desc_window_show = false;
        target.desc_window_offset = [0,0];

        target.cell_window_surface = document.createElement('canvas').getContext('2d');
        target.cell_window_surface.canvas.width = target.cellmenu_width + Math.floor(ws/2);
        target.cell_window_surface.canvas.height = display.ch() - (2*ws);

        let alphabg = document.createElement('canvas').getContext('2d');
        alphabg.canvas.width = target.cell_window_surface.canvas.width;
        alphabg.canvas.height = target.cell_window_surface.canvas.height;
        alphabg.fillStyle = '#1a1a1a';
        roundRect(alphabg, ws, ws, target.cellmenu_width-ws, target.cell_window_surface.canvas.height - (2*ws), 5);
        alphabg.strokeStyle = '#7f7f7f';
        alphabg.lineWidth = Math.floor(ws/2);
        roundRect(alphabg, ws, ws, target.cellmenu_width-ws, target.cell_window_surface.canvas.height - (2*ws), 5, true);
        alphabg.globalCompositeOperation = 'destination-in';
        alphabg.fillStyle = 'rgba(0, 0, 0, 0.8)';
        alphabg.fillRect(0, 0, alphabg.canvas.width, alphabg.canvas.height);
        alphabg.globalCompositeOperation = 'source-over';

        target.cell_window_surface.drawImage(alphabg.canvas, 0, 0);

        let inoneline = Math.floor((target.cellmenu_width - ws) / (ds + eb));
        let ci = -1
        for (let o of idlist)
        {
            let obj = objdata[o];
            switch (obj.type)
            {
                case 'CELL':
                    ci++;
                    let cx = ws + eb + ((ds + eb) * (ci % inoneline));
                    let cy = ws + eb + ((ds + eb + fontsize_smaller) * Math.floor(ci/inoneline));
                    target.cell_window_surface.fillStyle = rgb_to_style(...obj.notexture);
                    target.cell_window_surface.fillRect(cx, cy, ds, ds);
                    let name_string = (obj.localization.hasOwnProperty(loc)
                        ? obj.localization[loc].name
                        : obj.name);
                    engine.draw_text(target.cell_window_surface, cx + (ds/2), cy + ds + (eb/2),
                        name_string, 'fill', fontsize_smaller, 'center', 'top', 'white');
            }
        }
        alphabg.canvas.remove();
    },
    step: function (target)
    {
        target.show_step = engine.interpolate(target.show_step, Math.floor(target.show_menu), 3);

        if (Math.round(target.show_step*100000)/100000 === 0.0) target.show_step = 0;
        else if (Math.round(target.show_step*100000)/100000 === 1.0) target.show_step = 1;
    },
    draw: function (target, surface)
    {
        if (target.show_all)
        {
            let [ds, eb, ws] = [target.display_scale, target.element_border, target.window_spacing];
            let measure = Math.floor(target.cellmenu_width*1.5);
            let phase_offset = Math.floor(measure*target.show_step)-measure;
            surface.drawImage(target.cell_window_surface.canvas, phase_offset, 0);
            if (target.desc_window_show)
                surface.drawImage(target.desc_window_surface.canvas, ...target.desc_window_offset);
        }
    },
    kb_down: function (target, key)
    {
        switch (key.code)
        {
            case 'Tab':
                if (target.keys.ctrl)
                    target.show_all = !target.show_all;
                else
                    target.show_menu = !target.show_menu;
        }
    },
    mouse_move: function (target)
    {
        if (target.show_all)
        {
            let ci = FieldSUI_mouse_on_cell(target);
            if (ci !== null)
            {
                if (!arraysEqual(target.desc_window_id, [0, ci]))
                {
                    target.desc_window_surface = FieldSUI_draw_desc_window(target, ci);
                    target.desc_window_id = [0, ci];
                }
                target.desc_window_show = true;
                target.desc_window_offset = [mx+16, my+16];
            }
            else target.desc_window_show = false;
        }
    },
    mouse_down: function (target, buttonid)
    {
        if (target.show_all)
        {
            let ci = FieldSUI_mouse_on_cell(target);
            if (ci !== null)
            {
                switch (buttonid)
                {
                    case engine.LMB:
                        current_instrument = {type: 'pencil', cell: ci, penciltype: false, scale: 1};
                }
            }
        }
    }
});
//#endregion
//#endregion

//#region [INSTANCES]
var globalconsole = EntGlobalConsole.create_instance();
var fieldboard = EntFieldBoard.create_instance();
var fieldsui = EntFieldSUI.create_instance();
//#endregion

//#region [ROOMS]
var room_field = new engine.Room([EntGlobalConsole, EntFieldBoard, EntFieldSUI]);

engine.change_current_room(room_field);
//#endregion

//#region [RUN]
var running = true;
var prevtime = 0.0;
var deltatime = 0.0;

var mx = 0;
var my = 0;
document.addEventListener('keydown', function(event)
{
    engine.current_room.do_kb_down(event);
});
document.addEventListener('keyup', function(event)
{
    engine.current_room.do_kb_up(event);
});
canvas_element.addEventListener('mousemove', function(event)
{
    mx = (event.offsetX - display.offset_x) * display.cw() / display.sw();
    my = (event.offsetY - display.offset_y) * display.ch() / display.sh();
    engine.current_room.do_mouse_move();
});
canvas_element.addEventListener('mousedown', function(event)
{
    engine.current_room.do_mouse_down(event.button);
});
canvas_element.addEventListener('mouseup', function(event)
{
    engine.current_room.do_mouse_up(event.button);
});
canvas_element.addEventListener('wheel', function(event)
{
    if (event.deltaY > 0) engine.current_room.do_mouse_down(engine.WHEELDOWN);
    else engine.current_room.do_mouse_down(engine.WHEELUP);
});
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
};

window.requestAnimationFrame(main);


//#endregion