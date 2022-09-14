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
catch (err) {
    vi = {
        version_info: {
            version: "Unknown Version",
                stage: "Unknown Stage",
                build: 0,
        },
        devtools: false,
    };
}

//#endregion


//#region [ИНИЦИАЛИЗАЦИЯ]
let version = vi.version_info.version;
let dvlp_stage = vi.version_info.stage;
let dvlp_build = ''+vi.version_info.build;

global.console.log('\n'+
    ' _____                       _    ______ _                                             _ \n' +
    '/  __ \\                     | |   | ___ \\ |                                           | |\n' +
    '| /  \\/ __ _ ___ _   _  __ _| |   | |_/ / | __ _ _   _  __ _ _ __ ___  _   _ _ __   __| |\n' +
    '| |    / _` / __| | | |/ _` | |   |  __/| |/ _` | | | |/ _` | \'__/ _ \\| | | | \'_ \\ / _` |\n' +
    '| \\__/\\ (_| \\__ \\ |_| | (_| | |   | |   | | (_| | |_| | (_| | | | (_) | |_| | | | | (_| |\n' +
    ' \\____/\\__,_|___/\\__,_|\\__,_|_|   \\_|   |_|\\__,_|\\__, |\\__, |_|  \\___/ \\__,_|_| |_|\\__,_|\n' +
    '                                                  __/ | __/ |                            \n' +
    '                                                 |___/ |___/                             \n' +
    'by:                                                                            version:  \n' +
    '  Alexey Kozhanov' +
    (' '.repeat(72-version.length-4-dvlp_build.length)) + `${version} [#${dvlp_build}]`    + '\n' +
    (' '.repeat(89-dvlp_stage.length))                  + dvlp_stage                       + '\n')

document.getElementById('window-name').innerText = `Casual Playground - ${dvlp_stage} ${version}`;

var scale = 100;
var WIDTH = 16*scale;
var HEIGHT = 9*scale;
var WIDTH2 = Math.floor(WIDTH/2);
var HEIGHT2 = Math.floor(HEIGHT/2);
var canvas_element = document.getElementById('CasualPlaygroundCanvas');
var display = new engine.Display(canvas_element, WIDTH, HEIGHT);
var top_panel = document.getElementById('top_panel');
var text_window = document.getElementById('text_window');
var button_max = document.getElementById('button_max');
display.resizeCanvas(nw.Window.get().cWindow.width, nw.Window.get().cWindow.height);
var resize_window1 = function (width, height) {display.resizeCanvas(width, height-top_panel.offsetHeight);};
var resize_window2 = function () {
    let [w, h] = [nw.Window.get().width, nw.Window.get().height];
    display.resizeCanvas(w, h-top_panel.offsetHeight);
    [w, h] = [nw.Window.get().cWindow.tabs[0].width, nw.Window.get().cWindow.tabs[0].height];
    display.resizeCanvas(w, h-top_panel.offsetHeight);
};
nw.Window.get().on
(
    'resize',
    resize_window1
);
nw.Window.get().on
(
    'restore',
    function(){
        resize_window2();
        button_max.onclick = function(){nw.Window.get().maximize()};
        button_max.children[0].style = 'text-shadow: initial; transform: translate(0)';
    }
);
nw.Window.get().on
(
    'maximize',
    function(){
        resize_window2();
        button_max.onclick = function(){nw.Window.get().restore()};
        button_max.children[0].style = 'text-shadow: -4px 4px; transform: translate(2px, -2px)';
    }
);
nw.Window.get().resizeTo(Math.round(window.screen.width*3/4),
    Math.round(window.screen.height*3/4) + top_panel.offsetHeight);
nw.Window.get().moveTo(Math.round(window.screen.width/8),
    Math.round(window.screen.height/8) - Math.round(top_panel.offsetHeight/2));

nw.Window.get().show();
//#endregion


//#region [LOADING FUNCTIONS]

const get_text_width = function(txt, font)
{
    text_window.style.font = font;
    text_window.innerHTML = txt;
    return text_window.offsetWidth;
};

const get_locstring = function(locstring_id)
{
    let nodes = locstring_id.split('/');
    let pth = locstrings;
    for (let i=0; i<nodes.length; i++)
    {
        let dir = nodes[i];
        if (pth.hasOwnProperty(dir))
        {
            if (i === nodes.length-1)
                return pth[dir].hasOwnProperty(loc)
                    ? pth[dir][loc]
                    : pth[dir].__noloc;
            else pth = pth[dir];
        }
        else return '';
    }
}

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

const cut_string = function(string, font, upto)
{
    if (get_text_width(string, font) <= upto) return string;

    let [left, right] = [0, string.length];
    let mid = 0;
    while (right-left !== 1)
    {
        mid = Math.floor((left+right)/2);
        let txt_slice = string.slice(0, Math.max(0, mid-3))+'...';
        if (get_text_width(txt_slice, font) > upto) right = mid;
        else left = mid;
    }
    return string.slice(0, Math.max(0, mid-3))+'...';
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
            if (filepath.slice(-4).toLowerCase() === '.cpl') {
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
                {
                    moddata.texture = new Image();
                    moddata.texture_ready = false;
                    moddata.texture.onload = function()
                    {
                        moddata.texture_ready = true;
                        update_board = true;
                    };
                    moddata.texture.src = imgpath;
                }
                if (official) mods[modname] = moddata;
                else mods[`${mod_origin}/${modname}`] = moddata;

            }
        }
    }
    return mods;
}

const load_img = function(path)
{
    let img = new Image();
    img.src = path;
    return img;
}

const load_images = function(folder, preload=false)
{
    let loaded = {};
    for (let folder_element of fs.readdirSync(folder))
    {
        let element_path = path.join(folder, folder_element);
        let name = path.parse(folder_element).name;
        if (fs.lstatSync(element_path).isDirectory())
            loaded[folder_element] = load_images(element_path, preload);
        else
        {
            loaded[name] = load_img(element_path);
            if (preload) loaded[name].onload = ()=>{};
        }
    }
    return loaded;
}
//#endregion

//#region [SETTINGS]
let user_settings = JSON.parse(fs.readFileSync('./settings.json', {encoding:"utf8"}));

var loc = user_settings.localization;
var locstrings = JSON.parse(fs.readFileSync('./core/localization.json', {encoding:"utf8"})).localization;
var current_instrument = {'type': 'none'};
var gvars = [{'objdata':{},
              'idlist':[],
              'logger':[],
              'board_width':32,
              'board_height':32,
              'linecolor_infield': [26, 26, 26],
              'linecolor_outfield': [102, 102, 102]},
             {}];
var sprites = load_images('./core/sprites', true);

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
if (!fs.existsSync(corefolder)) fs.mkdirSync(corefolder);
if (!fs.existsSync(modsfolder)) fs.mkdirSync(modsfolder);

let coremods = load_mod(corefolder, 'Casual Playground', 1);
idlist.push(...Object.keys(coremods));
objdata = {...objdata, ...coremods};
gvars[0].objdata = objdata;

global.console.log(Object.keys(objdata));
global.console.log(idlist);
global.console.log(idlist.map((value, index) => [index, value]));

var cell_fill_on_init = idlist.indexOf('grass');
var cellbordersize = 0.125;
var update_board = false;

//#endregion

//#region [ROOMS]

//#region [GLOBAL]
//#region [CONSOLE]
const EntGlobalConsole = new engine.Entity({
    create: function(target)
    {
        target.log = [];
        target.logger_i = 0;

        target.fps_size_origin = fontsize_default/6;
        target.fps_size = target.fps_size_origin;

        target.log_size_origin = fontsize_default/6;
        target.log_size = target.log_size_origin;

        target.padding_size_origin = 2;
        target.padding_size = target.padding_size_origin;
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
        engine.draw_text(surface, surface.canvas.width-target.padding_size, target.padding_size,
            `${(deltatime !== 0) ? Math.round(1/deltatime) : 0} FPS`, 'fill', target.fps_size,
            'right', 'top', 'white', '"DejaVu Sans Mono"');
        for (let i in target.log)
        {
            engine.draw_text(surface, target.padding_size,
                surface.canvas.height-100-(target.log.length*target.log_size)+(i*target.log_size),
                target.log[i], 'fill', target.log_size, 'left', 'bottom', 'white', '"DejaVu Sans Mono"');
        }
    },
    canvas_resize: function(target, width, height)
    {
        let measure = Math.min(height/150, width/300);
        target.fps_size = target.fps_size_origin * measure;
        target.padding_size = target.padding_size_origin * measure;
        target.log_size = target.log_size_origin * measure;
    },
});

var globalconsole = EntGlobalConsole.create_instance();
//#endregion
//#endregion

//#region [FIELD]
//#region [ENTITIES]
//#region [BOARD]
const EntFieldBoard = new engine.Entity({
    create: function(target)
    {
        // target.cameraspeed = Math.round(Math.log2(Math.pow(2, 9)*scale/100));
        target.mincamspeed = Math.round(Math.log2(Math.pow(2, 6)*scale/100));
        target.maxcamspeed = Math.round(Math.log2(Math.pow(2, 14)*scale/100));
        // target.hsp = 0;
        // target.vsp = 0;
        target.acceleration = 8;
        target.zoomspeed = 1;

        target.get_tpt = (n) => ((n%9 !== 0)
            ? ((10**(Math.floor(n/9)))*(n%9))
            : 10**((Math.floor(n/9))-1)*9) / 1000;
        target.tpt_min = 1;
        target.tpt_max = 60;

        target.text_size_default_origin = fontsize_default;
        target.text_size_default = target.text_size_default_origin;
        target.text_size_small_origin = fontsize_small;
        target.text_size_small = target.text_size_small_origin;

        // See other initiations in room_start
    },
    room_start: function(target)
    {
        target.board_width = gvars[0].board_width;
        target.board_height = gvars[0].board_height;

        target.viewscale_origin = 16;
        target.viewscale = target.viewscale_origin;

        this.board_center_view(target);
        target.cameraspeed = Math.round(Math.log2(Math.pow(2, 9)*scale/100));
        target.hsp = 0;
        target.vsp = 0;

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

        target.linecolor_infield = gvars[0].linecolor_infield;
        target.linecolor_outfield = gvars[0].linecolor_outfield;
        target.surfaces = {board: this.draw_board(target)};

        target.time = 0.0;
        target.tpt_power = 28;
        target.timepertick = 1.0;
        target.time_paused = false;
        target.time_elapsed = 0.0;
    },
    step: function(target)
    {
        if (!globalkeys.Shift && globalkeys.Equal) this.board_zoom_in(target, target.zoomspeed*deltatime);
        if (!globalkeys.Shift && globalkeys.Minus) this.board_zoom_out(target, target.zoomspeed*deltatime);

        let limitspeed = 2**target.cameraspeed;
        let acc = limitspeed*target.acceleration;

        let right = ~~(globalkeys.ArrowRight||globalkeys.KeyD);
        let left = ~~(globalkeys.ArrowLeft||globalkeys.KeyA);
        let down = ~~(globalkeys.ArrowDown||globalkeys.KeyS);
        let up = ~~(globalkeys.ArrowUp||globalkeys.KeyW);

        let hmov = right - left;
        let vmov = down - up;

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

        if (globalkeys.LMB && !fieldsui.show) this.board_do_instrument(target);

        if (!target.time_paused) target.time += deltatime;
        if (target.time > target.timepertick) this.board_step(target);
    },
    step_after: function(target)
    {
        if (target.time > target.timepertick)
        {
            this.board_tasks(target);
            target.time = 0;
        }
        if (update_board)
        {
            target.surfaces.board = this.draw_board(target);
        }
    },
    draw: function(target, surface)
    {
        let bordersize = target.viewscale * cellbordersize;
        let cellsize = target.viewscale + bordersize;
        let ox = -target.viewx%cellsize;
        let oy = -target.viewy%cellsize;
        let lx = Math.ceil(surface.canvas.width/cellsize);
        let ly = Math.ceil(surface.canvas.height/cellsize);
        let realx = -target.viewx - (target.viewx > 0);
        let realy = -target.viewy - (target.viewy > 0);
        /*let realx, realy;
        if (target.viewx > 0) { realx = -target.viewx-1; }
        else { realx = -target.viewx; }
        if (target.viewy > 0) { realy = -target.viewy-1; }
        else { realy = -target.viewy; }*/
        surface.drawImage(target.surfaces.board.canvas, realx, realy);

        let linex, liney, startx, starty, endx, endy;
        surface.fillStyle = rgb_to_style(...target.linecolor_outfield);

        for (let ix = -1; ix < lx; ix++)
        {
            linex = ox+(ix*cellsize);
            starty = engine.clamp(0, -target.viewy, -target.viewy+(cellsize*target.board_height));
            endy = engine.clamp(surface.canvas.height, -target.viewy, -target.viewy+(cellsize*target.board_height));
            if (!((linex+target.viewx < 0) || (linex+target.viewx > (cellsize*target.board_width))))
            {
                if (starty-2 > 0) surface.fillRect(linex, 0, bordersize, starty);
                if (surface.canvas.height > endy)
                    surface.fillRect(linex, endy+bordersize, bordersize, surface.canvas.height-endy)
            }
            else surface.fillRect(linex, 0, bordersize, surface.canvas.height);
        }
        for (let iy = -1; iy < ly; iy++)
        {
            liney = oy+(iy*cellsize)
            startx = engine.clamp(0, -target.viewx, -target.viewx+(cellsize*target.board_width));
            endx = engine.clamp(surface.canvas.width, -target.viewx, -target.viewx+(cellsize*target.board_width));
            if (!((liney+target.viewy < 0) || (liney+target.viewy > (cellsize*target.board_height))))
            {
                if (startx-2 > 0) surface.fillRect(0, liney, startx, bordersize);
                if (surface.canvas.width > endx)
                    surface.fillRect(endx+bordersize, liney, surface.canvas.width-endx, bordersize);
            }
            else surface.fillRect(0, liney, surface.canvas.width, bordersize);
        }

        // speed
        engine.draw_text(surface, surface.canvas.width-2, surface.canvas.height-2,
            `Max speed: ${Math.pow(2, target.cameraspeed)}`, 'fill', target.text_size_default, 'right', 'bottom', 'white',
            '"Source Sans Pro"');
        /*engine.draw_text(surface, WIDTH-2, HEIGHT-fontsize_default,
            `hsp: ${Math.round(target.hsp)} / vsp: ${Math.round(target.vsp)}`,
            'fill', fontsize_default, 'right', 'bottom', 'white');*/

        // time per tick
        engine.draw_text(surface,
            5, -5 + surface.canvas.height - target.text_size_default,
            `${target.timepertick}s`+(target.time_paused ? ' | Paused' : ''),
            'fill', target.text_size_default, 'left', 'top', 'white', '"Source Sans Pro"');

        // time elapsed
        let clr = target.time_elapsed <= target.timepertick ? 'white' : rgb_to_style(17*14, 17, 17);
        engine.draw_text(surface,
            5, -10 + surface.canvas.height - target.text_size_default - 2*target.text_size_small,
            `${Math.round(target.time_elapsed*100000)/100000} s`,
            'fill', target.text_size_small, 'left', 'top', clr, '"DejaVu Sans Mono"');
        engine.draw_text(surface,
            5, -10 + surface.canvas.height - target.text_size_default - target.text_size_small,
            `${Math.round(target.time_elapsed/(target.board_width*target.board_height)*100000)/100000} s/cell`,
            'fill', target.text_size_small, 'left', 'top', clr, '"DejaVu Sans Mono"');

        // instrument
        switch (current_instrument.type)
        {
            case 'brush':
                let string = `${get_locstring('instrument/brush')} [${current_instrument.scale}]` +
                    ` | ${idlist[current_instrument.cell]}` +
                    ` | ${current_instrument.brushtype ? 'Round' : 'Square'}`
                engine.draw_text(surface,
                    surface.canvas.width - 2, surface.canvas.height - 2 - 2*(target.text_size_default-2),
                    string, 'fill', target.text_size_default, 'right', 'bottom', 'white', '"Source Sans Pro"');
        }
    },
    kb_down: function(target, key)
    {
        let setkey = true;
        switch (key.code)
        {
            case 'KeyQ':
                target.cameraspeed = engine.clamp(target.cameraspeed-1, target.mincamspeed, target.maxcamspeed);
                break;
            case 'KeyE':
                target.cameraspeed = engine.clamp(target.cameraspeed+1, target.mincamspeed, target.maxcamspeed);
                break;
            case 'KeyC':
                this.board_center_view(target);
                target.hsp = 0;
                target.vsp = 0;
                break;
            case 'Space':
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
            case 'Escape':
                engine.change_current_room(room_mainmenu);
                break;
            case 'Equal':
                if (globalkeys.Shift) current_instrument.scale++;
                break;
            case 'Minus':
                if (globalkeys.Shift)
                    current_instrument.scale = Math.max(current_instrument.scale-1, 1);
                break;
        }
    },
    mouse_down: function(target, mb)
    {
        if (!fieldsui.show)
        {
            let setkey = true;
            switch (mb)
            {
                case engine.WHEELUP:
                    if (globalkeys.Shift) current_instrument.scale++;
                    else this.board_zoom_in(target, 1);
                    break;
                case engine.WHEELDOWN:
                    if (globalkeys.Shift)
                        current_instrument.scale = Math.max(current_instrument.scale-1, 1);
                    else this.board_zoom_out(target, 1);
                    break;
            }
        }

    },
    board_step: function(target)
    {
        let start = Date.now();
        for (let y = 0; y < target.board_height; y++)
        {
            for (let x = 0; x < target.board_width; x++)
            {
                try {target.board[y][x].step();}
                catch (err)
                {
                    let concl = new ccc.CompilerConclusion(400);
                    let cur = new ccc.CompilerCursor();
                    logger.push([
                        comp.LoggerClass.ERROR,
                        new Date(),
                        `Runtime error for cell (${x}, ${y}) with CellID ${idlist[target.board[y][x].cellid]}`,
                        `CasualPlayground Compiler encountered an error: ${concl.code}`,
                        concl.full_conclusion(),
                        cur.highlight(),
                        cur.string(),
                    ])
                }
            }
        }
        target.time_elapsed = (Date.now() - start)/1000;
    },
    board_tasks: function(target)
    {
        let taskcount = 0;
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
                            update_board = true;
                            break;
                    }
                    taskcount++;
                }
                target.board[y][x].tasks = [];
            }
        }
    },
    draw_board: function(target)
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
                surface.imageSmoothingEnabled = false;
                if (celldata.hasOwnProperty('texture') && celldata.texture_ready)
                {
                    surface.drawImage(celldata.texture, cx, cy, target.viewscale, target.viewscale);
                }
                else
                {
                    surface.fillStyle = rgb_to_style(...celldata.notexture);
                    //surface.fillStyle = rgb_to_style(109, 183, 65);
                    surface.fillRect(cx, cy, target.viewscale, target.viewscale);
                }
            }
        }
        update_board = false;
        return surface;
    },
    board_center_view: function(target)
    {
        let [x, y] = this.board_get_center(target);
        target.viewx = x;
        target.viewy = y;
    },
    board_zoom_in: function(target, mul)
    {
        let oldvs = target.viewscale;
        target.viewscale = engine.clamp(
            target.viewscale + engine.clamp(Math.floor(0.2 * mul * target.viewscale), 1, 64),
            2, 64);
        let newvs = target.viewscale;
        let ratio = newvs/oldvs;

        target.viewx = ((target.viewx+mx) * ratio) - mx;
        target.viewy = ((target.viewy+my) * ratio) - my;

        target.surfaces.board = this.draw_board(target);
    },
    board_zoom_out: function(target, mul)
    {
        let oldvs = target.viewscale;
        target.viewscale = engine.clamp(
            target.viewscale - engine.clamp(Math.floor(0.2 * mul * target.viewscale), 1, 64),
            2, 64);
        let newvs = target.viewscale;
        let ratio = newvs/oldvs;

        target.viewx = ((target.viewx+mx) * ratio) - mx;
        target.viewy = ((target.viewy+my) * ratio) - my;

        target.surfaces.board = this.draw_board(target);
    },
    board_get_center: function(target)
    {
        let cellsize = target.viewscale * (cellbordersize+1);
        let w = cellsize*target.board_width + (target.viewscale * cellbordersize);
        let h = cellsize*target.board_height + (target.viewscale * cellbordersize);
        return [(w-display.cw())/2, (h-display.ch())/2];
    },
    board_do_instrument: function(target)
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
            case 'brush':
                scale = current_instrument.scale-1
                if (((rx % cellsize) < target.viewscale) && ((ry % cellsize) < target.viewscale))
                {
                    for (let ix = cx-scale; ix < cx+scale+1; ix++)
                    {
                        for (let iy = cy-scale; iy < cy+scale+1; iy++)
                        {
                            if ((0 <= ix) && (ix < maxcx) && (0 <= iy) && (iy < maxcy))
                            {
                                if (current_instrument.brushtype === true) // round
                                {
                                    let dx = ix-cx;
                                    let dy = iy-cy;
                                    if (Math.round(Math.sqrt(dx*dx + dy*dy)) <= scale)
                                        target.board[iy][ix].reset(current_instrument.cell);
                                }
                                else target.board[iy][ix].reset(current_instrument.cell);
                                /*target.board[iy][ix] = new comp.Cell({X:ix,Y:iy},cellid, target.board,
                                    gvars);*/
                            }
                        }
                    }
                    target.surfaces.board = this.draw_board(target);
                }
                break;
        }
    },
    canvas_resize: function(target, width, height)
    {
        let measure = Math.min(height/HEIGHT, width/WIDTH);
        target.viewscale = target.viewscale_origin * measure;
        target.text_size_default = target.text_size_default_origin * measure;
        target.text_size_small = target.text_size_small_origin * measure;

        update_board = true;
    },
});
//#endregion
//#region [STANDARD UI]
const EntFieldSUI = new engine.Entity({
    create: function(target)
    {
        target.show_step = 0.0;
        target.show = false;

        target.element_number = 5; // number of objects in one line
        target.window_spacing_origin = Math.round(20*scale/100); // space between object menu's edge and objects
        target.window_spacing = target.window_spacing_origin;
        target.window_margin_origin = Math.round(16*scale/100); // space between object menu and the game window's edge
        target.window_margin = target.window_margin_origin;
        target.display_scale_origin = Math.round(80*scale/100); // the size of each object's image in object menu
        target.display_scale = target.display_scale_origin;
        target.window_border_origin = 4; // thickness of borders
        target.window_border = target.window_border_origin;
        target.objmenu_heading_size_origin = 48; // size of object menu title
        target.objmenu_heading_size = target.objmenu_heading_size_origin;
        target.instrmenu_heading_size_origin = 36; // size of instrument menu title
        target.instrmenu_heading_size = target.instrmenu_heading_size_origin;
        target.instrmenu_heading_size_minimized_origin = 20; // size of minimized instrument menu title
        target.instrmenu_heading_size_minimized = target.instrmenu_heading_size_minimized_origin;
        target.instrmenu_imgbox_ratio = 0.9;
        target.border_width_origin = 5;
        target.border_width = target.border_width_origin;
        target.object_name_size_origin = fontsize_smaller;
        target.object_name_size = target.object_name_size_origin;
        target.descmenu_name_size_origin = fontsize_big;
        target.descmenu_name_size = target.descmenu_name_size_origin;
        target.descmenu_properties_size_origin = fontsize_smaller;
        target.descmenu_properties_size = target.descmenu_properties_size_origin;
        target.descmenu_description_size_origin = fontsize_smaller;
        target.descmenu_description_size = target.descmenu_description_size_origin;
        target.descmenu_border_origin = Math.round(4*scale/100);
        target.descmenu_border = target.descmenu_border_origin;
        target.descmenu_padding_origin = Math.round(8*scale/100);
        target.descmenu_padding = target.descmenu_padding_origin;
        target.descmenu_divider_origin = Math.round(12*scale/100);
        target.descmenu_divider = target.descmenu_divider_origin;
        let en = target.element_number;
        let ws = target.window_spacing;
        let wm = target.window_margin;
        let ds = target.display_scale;
        let wb = target.window_border;
        target.width_part = Math.round(display.cw()/3 - 4*wm); // equal parts of screen's width (currently a third)
        target.objmenu_height = display.ch() - (2*wm); // object menu height
        target.instrmenu_height = display.ch()/3 - (3*wm); // instrument menu height
        target.instrmenu_height_minimized = wb+ws+target.instrmenu_heading_size_minimized;
        target.element_border = Math.round((target.width_part-(2*ws)-(en*ds))/(en-1));

        target.desc_window_width_origin = 256+128;
        target.desc_window_width =  target.desc_window_width_origin;
        target.desc_window_surface = document.createElement('canvas').getContext('2d');
        target.desc_window_id = -1;
        target.desc_window_show = false;
        target.desc_window_offset = [0,0];

        target.objmenu_surface = this.draw_objmenu(target);

        /*target.objmenu_surface = document.createElement('canvas').getContext('2d'); // object menu
        target.objmenu_surface.canvas.width = target.width_part;
        target.objmenu_surface.canvas.height = target.objmenu_height;*/

        /*target.instrmenu_surface = document.createElement('canvas').getContext('2d'); // instrument menu
        target.instrmenu_surface.canvas.width = target.width_part;
        target.instrmenu_surface.canvas.height = target.instrmenu_height;*/
    },
    room_start: function(target)
    {
        this.canvas_resize(target, display.cw(), display.ch()); // is needed for some reason
    },
    step: function(target)
    {
        let new_step = engine.linear_interpolation(target.show_step, Math.floor(target.show), 3);
        if (target.show_step !== new_step)
        {
            target.show_step = new_step;

            if (Math.round(target.show_step * 1000) / 1000 === 0.0) target.show_step = 0;
            else if (Math.round(target.show_step * 1000) / 1000 === 1.0) target.show_step = 1;
            this.mouse_move(target);
        }
    },
    draw: function(target, surface)
    {
        let wm = target.window_margin;
        let ih = target.instrmenu_height;
        let ihm = target.instrmenu_height_minimized;
        if (target.show_step !== 0.0)
        {
            surface.fillStyle = `rgba(0,0,0,${target.show_step/2})`;
            surface.fillRect(0,0,surface.canvas.width,surface.canvas.height);
            let [ds, eb, ws] = [target.display_scale, target.element_border, target.window_spacing];
            let measure = Math.floor(target.width_part*1.5);
            let phase_offset = Math.floor(measure*target.show_step)-measure;
            surface.drawImage(target.objmenu_surface.canvas, phase_offset+wm, wm);
            if (target.desc_window_show && target.show)
                surface.drawImage(target.desc_window_surface.canvas, ...target.desc_window_offset);
            target.objmenu_surface.canvas.remove();
        }
        let instrmenu = this.draw_instrmenu(target);
        surface.drawImage(instrmenu.canvas, surface.canvas.width-wm-target.width_part,
            surface.canvas.height+((1-target.show_step)*(ih+wm))-ihm-wm-target.instrmenu_height);
        instrmenu.canvas.remove();
    },
    kb_down: function(target, key)
    {
        switch (key.code)
        {
            case 'Tab':
                if (globalkeys.Shift)
                {
                    if (current_instrument.hasOwnProperty('brushtype'))
                        current_instrument.brushtype = !current_instrument.brushtype;
                }
                else target.show = !target.show;
                break;
        }
    },
    mouse_move: function(target)
    {
        if (target.show)
        {
            let ci = this.mouse_on_cell(target);
            if (ci !== null)
            {
                if (!arraysEqual(target.desc_window_id, [0, ci]))
                {
                    target.desc_window_surface = this.draw_desc_window(target, ci);
                    target.desc_window_id = [0, ci];
                }
                target.desc_window_show = true;
                target.desc_window_offset = [mx+16, my+16];
            }
            else target.desc_window_show = false;
        }
    },
    mouse_down: function(target, buttonid)
    {
        if (target.show)
        {
            let ci = this.mouse_on_cell(target);
            if (ci !== null)
            {
                switch (buttonid)
                {
                    case engine.LMB:
                        current_instrument =
                            {
                                type: 'brush',
                                cell: ci,
                                brushtype: current_instrument.hasOwnProperty('brushtype')
                                    ? current_instrument.brushtype
                                    : false,
                                scale: current_instrument.hasOwnProperty('scale')
                                    ? current_instrument.scale
                                    : 1,
                            };
                        break;
                }
            }
        }
    },
    mouse_on_cell: function(target)
    {
        let [ds, eb, ws, ons] = [target.display_scale, target.element_border, target.window_spacing,
            target.object_name_size];
        let [hs, wm] = [target.objmenu_heading_size, target.window_margin];
        let measure = Math.floor(target.width_part*1.5);
        let phase_offset = Math.floor(measure*target.show_step)-measure;
        let inoneline = target.element_number;
        let mousex = mx-phase_offset-wm-ws;
        let mousey = my-wm-ws;
        let [detectwidth, detectheight] = [ds + eb, ds + ons + eb];
        let ci = Math.floor(mousex/detectwidth)
            + (Math.floor((mousey-ws-hs)/detectheight) * inoneline);
        let cx = ((ds + eb)*(ci%inoneline));
        let cy = (ws + hs) + ((ds + eb + ons)*Math.floor(ci/inoneline));
        if (cx <= mousex && mousex <= cx + ds)
            if (cy <= mousey && mousey <= cy + ds)
                if (ci < idlist.length && ci >= 0)
                    return ci;
        return null;
    },
    draw_desc_window: function(target, cellid)
    {
        //let widths = [];
        let cellname = idlist[cellid];
        let [border, padding, divider] = [target.descmenu_border, target.descmenu_padding, target.descmenu_divider];
        let padding2 = padding*2;
        let canvaswidth = target.desc_window_width - padding2;
        let name_size =  target.descmenu_name_size;
        let properties_size = target.descmenu_properties_size;
        let description_size = target.descmenu_description_size;
        //let space_scale = 1/3;

        let celldata = objdata[cellname];
        let localization = celldata.localization;
        let name_string = localization.hasOwnProperty(loc) ? localization[loc].name : celldata.name;
        let origin_string = celldata.origin;
        let origin_color = celldata.official ? 'lime' : 'white';
        let from_string = get_locstring('descwin/from');
        let desc_string = localization.hasOwnProperty(loc) ? localization[loc].desc : celldata.desc;

        let border_color = '#4d4d4d';
        let bg_color = 'rgba(0,0,0,0.5)';

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
        surface.canvas.height = name_size + properties_size + divider + padding2 +
            y_offset + description_size + properties_size;
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
            'left', 'top', 'white', '"Source Sans Pro"');

        y += name_size + Math.floor(divider/2);
        engine.draw_line(surface, padding, y, target.desc_window_width - padding,
            y, border_color, border);

        y += Math.floor(divider/2);
        surface.font = `${description_size}px`;
        for (let line of lines)
        {
            let x = padding;
            engine.draw_text(surface, x, y, line, 'fill', description_size,
                'left', 'top', 'white', '"Source Sans Pro"');
            x += get_text_width(line, surface.font);//surface.measureText(line);
            y += description_size;
        }

        y += Math.floor(divider/2);
        engine.draw_line(surface, padding, y, target.desc_window_width - padding,
            y, border_color, border);

        y += Math.floor(divider/2);
        engine.draw_text(surface, target.desc_window_width - padding, y,  origin_string, 'fill', properties_size,
            'right', 'top', origin_color, '"Source Sans Pro"');
        engine.draw_text(surface, padding, y, from_string, 'fill', properties_size, 'left', 'top', origin_color,
            '"Source Sans Pro"');

        /*let ow = 0;
        for (let w of widths)
        {
            let x = ow+padding;
            let y = padding+divider+name_size;
            engine.draw_line(surface, x, y, x+w, y, `hsl(${(10*ow) % 360}, 100%, 50%)`);
            ow += w;
        }*/

        return surface;
    },
    draw_objmenu: function(target)
    {
        let ctx = document.createElement('canvas').getContext('2d');
        ctx.canvas.width = target.width_part;
        ctx.canvas.height = target.objmenu_height;
        
        let ws = target.window_spacing;
        let ds = target.display_scale;
        let eb = target.element_border;
        let wb = target.window_border;
        let wb2 = wb/2;

        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        let alphabg = document.createElement('canvas').getContext('2d');
        alphabg.canvas.width = ctx.canvas.width;
        alphabg.canvas.height = ctx.canvas.height;
        alphabg.fillStyle = '#1a1a1a';
        roundRect(alphabg, wb2, wb2, target.width_part-wb, target.objmenu_height-wb, target.border_width);
        alphabg.strokeStyle = '#7f7f7f';
        alphabg.lineWidth = wb;
        roundRect(alphabg, wb2, wb2, target.width_part-wb, target.objmenu_height-wb, target.border_width, true);
        alphabg.globalCompositeOperation = 'destination-in';
        alphabg.fillStyle = 'rgba(0, 0, 0, 0.8)';
        alphabg.fillRect(0, 0, alphabg.canvas.width, alphabg.canvas.height);
        alphabg.globalCompositeOperation = 'source-over';

        ctx.drawImage(alphabg.canvas, 0, 0);

        alphabg.canvas.remove();

        let textsize = target.objmenu_heading_size;
        engine.draw_text(ctx, ws, ws+Math.round(textsize/2), 'Objects', 'fill', textsize,
            'left', 'center', 'white', '"Source Sans Pro"', 'italic');

        let oy = ws+textsize;

        let inoneline = target.element_number; //Math.floor(target.cellmenu_width / (ds + eb));
        let ci = -1
        for (let o of idlist)
        {
            let obj = objdata[o];
            switch (obj.type)
            {
                case 'CELL':
                    ci++;
                    let cx = ws + ((ds + eb) * (ci % inoneline));
                    let cy = ws + oy + ((ds + eb + target.object_name_size) * Math.floor(ci/inoneline));
                    ctx.fillStyle = rgb_to_style(...obj.notexture);
                    ctx.fillRect(cx, cy, ds, ds);
                    let name_string = (obj.localization.hasOwnProperty(loc)
                        ? obj.localization[loc].name
                        : obj.name);

                    engine.draw_text(ctx, cx + (ds/2), cy + ds + (eb/2),
                        cut_string(name_string, `${target.object_name_size}px "Source Sans Pro"`, ds), 'fill',
                        target.object_name_size, 'center', 'top', 'white', '"Source Sans Pro"');
            }
        }
        
        return ctx;
    },
    draw_instrmenu: function(target)
    {
        let ctx = document.createElement('canvas').getContext('2d');
        ctx.canvas.width = target.width_part;
        ctx.canvas.height = target.instrmenu_height;
        
        let ws = target.window_spacing;
        let ws2 = Math.round(ws/2);
        let ds = target.display_scale;
        let eb = target.element_border;
        let wb = target.window_border;
        let wb2 = Math.round(wb/2);
        let ih = target.instrmenu_height;
        let ihm = target.instrmenu_height_minimized;
        let ihs = target.instrmenu_heading_size;
        let ihsm = target.instrmenu_heading_size_minimized;

        ctx.clearRect(0, 0,
            ctx.canvas.width, ctx.canvas.height);

        let alphabg = document.createElement('canvas').getContext('2d');
        alphabg.canvas.width = ctx.canvas.width;
        alphabg.canvas.height = ctx.canvas.height;
        alphabg.fillStyle = '#1a1a1a';
        roundRect(alphabg, wb2, wb2, target.width_part-wb, target.instrmenu_height-wb, 5);
        alphabg.strokeStyle = '#7f7f7f';
        alphabg.lineWidth = wb;
        roundRect(alphabg, wb2, wb2, target.width_part-wb, target.instrmenu_height-wb, 5, true);
        alphabg.globalCompositeOperation = 'destination-in';
        alphabg.fillStyle = 'rgba(0, 0, 0, 0.8)';
        alphabg.fillRect(0, 0, alphabg.canvas.width, alphabg.canvas.height);
        alphabg.globalCompositeOperation = 'source-over';

        ctx.drawImage(alphabg.canvas, 0, 0);

        alphabg.canvas.remove();

        let textsize = ihsm+(target.show_step*(ihs-ihsm)); //target.instrmenu_heading_size;
        engine.draw_text(ctx, target.width_part - (ws2+(target.show_step*(ws2-wb))),
            wb+ws2+(target.show_step*(-wb+ws2)) + Math.round(textsize/2),
            get_locstring(`instrument/${current_instrument.type}`),
            'fill', textsize, 'right', 'center', 'white', '"Source Sans Pro"', 'italic');

        let oy = textsize + ws2 + (target.show_step*ws2);

        let img_box = ihm - ws + (target.show_step*(ih - 2*ws - oy - ihm + ws));

        let local_ws = Math.round(ws/(2-target.show_step));

        ctx.fillStyle = 'rgba(102, 102, 102, 0.5)';
        roundRect(ctx, local_ws, local_ws + (target.show_step*oy), img_box, img_box, 2+(target.show_step*6));

        let iip = img_box * (1-target.instrmenu_imgbox_ratio);

        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(sprites.instruments[current_instrument.type],
            local_ws+iip, local_ws+(target.show_step*oy)+iip, img_box-iip-iip, img_box-iip-iip);

        return ctx;
    },
    canvas_resize: function(target, width, height)
    {
        let measure = Math.min(height/HEIGHT, width/WIDTH);
        target.window_spacing = target.window_spacing_origin * measure;
        target.window_margin = target.window_margin_origin * measure;
        target.display_scale = target.display_scale_origin * measure;
        target.window_border = target.window_border_origin * measure;
        target.objmenu_heading_size = target.objmenu_heading_size_origin * measure;
        target.instrmenu_heading_size = target.instrmenu_heading_size_origin * measure;
        target.instrmenu_heading_size_minimized = target.instrmenu_heading_size_minimized_origin * measure;
        target.border_width = target.border_width_origin * measure;
        target.object_name_size = target.object_name_size_origin * measure;
        target.descmenu_name_size = target.descmenu_name_size_origin * measure;
        target.descmenu_properties_size = target.descmenu_properties_size_origin * measure;
        target.descmenu_description_size = target.descmenu_description_size_origin * measure;
        target.descmenu_border = target.descmenu_border_origin * measure;
        target.descmenu_padding = target.descmenu_padding_origin * measure;
        target.descmenu_divider = target.descmenu_divider_origin * measure;

        let en = target.element_number;
        let ws = target.window_spacing;
        let wm = target.window_margin;
        let ds = target.display_scale;
        let wb = target.window_border;
        target.width_part = Math.round(display.cw()/3 - 4*wm); // equal parts of screen's width (currently a third)
        target.objmenu_height = display.ch() - (2*wm); // object menu height
        target.instrmenu_height = display.ch()/3 - (3*wm); // instrument menu height
        target.instrmenu_height_minimized = wb+ws+target.instrmenu_heading_size_minimized;
        target.element_border = Math.round((target.width_part-(2*ws)-(en*ds))/(en-1));

        target.desc_window_width =  target.desc_window_width_origin * measure;
        target.objmenu_surface = this.draw_objmenu(target);
    },
});
//#endregion
//#endregion
//#region [INSTANCES]
var fieldboard = EntFieldBoard.create_instance();
var fieldsui = EntFieldSUI.create_instance();
//#endregion
//#endregion

//#region [MAINMENU]
//#region [ENTITIES]
//#region [INTRO]
const EntMMIntro = new engine.Entity({
    create: function(target)
    {
        /*target.icon2 = new Image();
        target.icon2.src = 'https://www.gnu.org/graphics/gplv3-or-later-sm.png';*/
        target.time = 0;

        target.licence_text_size_origin = 12;
        target.licence_text_size = target.licence_text_size_origin;

        target.name_text_size_origin = 100;
        target.name_text_size = target.name_text_size_origin;

        target.author_text_size_origin = 60;
        target.author_text_size = target.author_text_size_origin;
    },
    step: function(target)
    {
        target.time += deltatime;
    },
    draw_after: function(target, surface)
    {
        /*
        engine.draw_line(surface, 0, surface.canvas.height/4, surface.canvas.width, surface.canvas.height/4, 'blue', 2);
        engine.draw_line(surface, 0, surface.canvas.height*3/4, surface.canvas.width, surface.canvas.height*3/4, 'blue', 2);
        engine.draw_line(surface, surface.canvas.width/4, 0, surface.canvas.width/4, surface.canvas.height, 'blue', 2);
        engine.draw_line(surface, surface.canvas.width*3/4, 0, surface.canvas.width*3/4, surface.canvas.height, 'blue', 2);
        engine.draw_line(surface, 0, surface.canvas.height/2, surface.canvas.width, surface.canvas.height/2, 'red', 2);
        engine.draw_line(surface, surface.canvas.width/2, 0, surface.canvas.width/2, surface.canvas.height, 'red', 2);
        */
        let moment_func = (start, end) => engine.range2range(engine.clamp(target.time, start, end), start, end, 0, 1);

        let moment2 = 1-moment_func(4, 4.5);
        moment2 = Math.cos((1-moment2)/2*Math.PI);
        moment2 = Math.pow(moment2, 2/3);
        let moment3 = 1-moment_func(4.5, 5);
        moment3 = Math.cos(moment3/2*Math.PI);
        moment3 = 1-Math.pow(moment3, 2/3);
        //moment3 = Math.sin(moment3/2*Math.PI);
        surface.beginPath();
        surface.moveTo(0, 0);
        surface.lineTo(surface.canvas.width*moment3, 0);
        surface.lineTo(surface.canvas.width*moment3, surface.canvas.height*moment2);
        surface.lineTo(surface.canvas.width*moment2, surface.canvas.height*moment3);
        surface.lineTo(0, surface.canvas.height*moment3);
        surface.fillStyle = 'black';
        surface.fill();

        let moment1 = moment_func(0, 2)*(1-moment_func(4, 5));
        engine.draw_text(surface, surface.canvas.width/2, surface.canvas.height/2,
            'Casual Playground', 'fill', target.name_text_size, 'center', 'center', `rgba(255, 255, 255, ${moment1})`,
            '"Montserrat", serif');
        engine.draw_text(surface, surface.canvas.width/2, surface.canvas.height/2 + target.author_text_size*1.5,
            'by NotLexa', 'fill', target.author_text_size, 'center', 'top', `rgba(255, 255, 255, ${moment1})`,
            '"Montserrat", serif');

        let draw_copyright = function (txt, y)
        {
            engine.draw_text(surface, surface.canvas.width/2, surface.canvas.height - y,
                txt, 'fill', target.licence_text_size, 'center', 'bottom',
                `rgba(255, 255, 255, ${moment1})`, '"Montserrat", serif');
        };

        let copyright_offset = 5;
        let copyright_spacing = target.licence_text_size+2;

        draw_copyright("Casual Playground / " +
            'Copyright © 2022 Alexey Kozhanov', copyright_offset+(3*copyright_spacing));
        draw_copyright('This program is free software: you can redistribute it and/or modify ' +
            'it under the terms of the GNU General Public License as published by ' +
            'the Free Software Foundation, either version 3 of the License, or ' +
            '(at your option) any later version.', copyright_offset+(2*copyright_spacing));
        draw_copyright('This program is distributed in the hope that it will be useful, ' +
            'but WITHOUT ANY WARRANTY; without even the implied warranty of ' +
            'MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the ' +
            'GNU General Public License for more details.', copyright_offset+copyright_spacing);
        draw_copyright('You should have received a copy of the GNU General Public License along with this program.' +
            'If not, see <https://www.gnu.org/licenses/>.', copyright_offset);
        /*surface.drawImage(target.icon2,
            surface.canvas.width-target.icon2.width-4,
            surface.canvas.height-target.icon2.height-copyright_offset-(14*4));*/

        if (4 <= target.time && target.time < 5)
        {
            let prerender = (fonts, weight_style='')=>{
                fonts.forEach((name)=>{engine.draw_text(surface, 0, 0, 'abc', 'fill', 16, 'left', 'top',
                    'rgba(0,0,0,0)', name, weight_style)})};
            prerender(['"DejaVu Sans Mono"', '"Montserrat"', '"Source Sans Pro"']);
            prerender(['"Source Sans Pro"'], 'italic');
        }
    },
    kb_down: function(target, key)
    {
        target.time = Math.max(4, target.time);
    },
    mouse_down: function(target, key)
    {
        target.time = Math.max(4, target.time);
    },
    canvas_resize: function(target, width, height)
    {
        let measure = Math.min(height/HEIGHT, width/WIDTH);
        target.licence_text_size = target.licence_text_size_origin * measure;
        target.name_text_size = target.name_text_size_origin * measure;
        target.author_text_size = target.author_text_size_origin * measure;
    }
});
//#endregion
//#region [BACKGROUND]
const EntMMBG_board = function(x, y, width, height, matrix)
{
    let bordersize = 8;
    let cellsize = 32;
    let fullsize = cellsize+bordersize;
    let ox = engine.wrap(x, 0, fullsize);
    let oy = engine.wrap(y, 0, fullsize);
    let surface = document.createElement('canvas').getContext('2d');
    surface.canvas.width = width;
    surface.canvas.height = height;
    surface.fillStyle = rgb_to_style(...gvars[0].linecolor_infield);
    surface.fillRect(0, 0, surface.canvas.width, surface.canvas.height);
    let ix = engine.wrap(Math.floor(-x/fullsize), 0, matrix[0].length);
    for (let mx = ox-fullsize; mx < width; mx += fullsize)
    {
        let iy = engine.wrap(Math.floor(-y/fullsize), 0, matrix.length);
        for (let my = oy-fullsize; my < height; my += fullsize)
        {
            surface.fillStyle = rgb_to_style(...matrix[iy][ix]);
            surface.fillRect(mx+bordersize, my+bordersize, cellsize, cellsize);
            iy = engine.wrap(iy+1, 0, matrix.length);
        }
        ix = engine.wrap(ix+1, 0, matrix[0].length);
    }
    return surface;
}

const EntMMBG = new engine.Entity({
    create: function(target)
    {
        target.ox = 0;
        target.oy = 0;
        target.angle = Math.random()*360;
        target.speed = 64;
        target.colors = idlist.map(value => objdata[value].notexture);
        target.matrix = Array(100).fill().map(()=>
            Array(100).fill().map(()=>
                target.colors[Math.floor(Math.random()*target.colors.length)]
            )
        );
        target.controls_strings = [get_locstring('mm/controls/heading'),
            ...[...Array(7).keys()].map(val => get_locstring('mm/controls/'+(val+1)))];
        target.controls_keys = [null, 'WASD', 'QE', 'RT', 'Space', 'C', 'Tab', 'LMB', 'Esc'];

        target.controls_text_size_origin = 32;
        target.controls_text_size = target.controls_text_size_origin;

        target.controls_padding_origin = 16;
        target.controls_padding = target.controls_padding_origin;
    },
    step: function(target)
    {
        let bordersize = 8;
        let cellsize = 32;
        let fullsize = cellsize+bordersize;
        target.ox = engine.wrap(target.ox+engine.lengthdir_x(target.speed*deltatime, target.angle),
            0, fullsize*target.matrix[0].length);
        target.oy = engine.wrap(target.oy+engine.lengthdir_y(target.speed*deltatime, target.angle),
            0, fullsize*target.matrix.length);
    },
    draw_before: function(target, surface)
    {
        surface.drawImage(
            EntMMBG_board(target.ox, target.oy,
                surface.canvas.width, surface.canvas.height,
                target.matrix, 0, 0).canvas,
            0, 0);
        surface.fillStyle = 'rgba(0, 0, 0, 0.3)';
        surface.fillRect(0, 0, surface.canvas.width, surface.canvas.height);
        for (let i = 0; i < target.controls_strings.length; i++)
        {
            let txt = target.controls_strings[target.controls_strings.length - 1 - i];
            engine.draw_text(surface, surface.canvas.width - target.controls_padding,
                surface.canvas.height - target.controls_padding - (target.controls_text_size*1.0625)*i,
                (i !== target.controls_strings.length-1)
                    ? `${target.controls_keys[target.controls_keys.length - 1 - i]} - ${txt}`
                    : txt,
                'fill', target.controls_text_size, 'right', 'bottom', 'white', '"Montserrat", serif')
        }
    },
    canvas_resize: function(target, width, height)
    {
        let measure = Math.min(height/HEIGHT, width/WIDTH);
        target.controls_text_size = target.controls_text_size_origin * measure;
        target.controls_padding = target.controls_padding_origin * measure;
    },
});
//#endregion
//#region [CONTROLLER]
const EntMMController = new engine.Entity({
    create: function(target)
    {
        // target.time = 0;
        // target.time_paused = false;
        let create_button = function(width, height, text, x_offset, y_offset, trigger)
        {
            let bttn = EntMMButton.create_instance();
            bttn.box_width = width;
            bttn.box_height = height;
            bttn.text = get_locstring(text);
            bttn.const_x = (display.cw() - bttn.box_width)/2 - bttn.triangle_width + x_offset;
            bttn.const_y = (display.ch() - bttn.box_height)/2 + y_offset;
            bttn.offset_x = -display.cw()/2 - bttn.box_width - bttn.triangle_width;
            bttn.trigger = trigger;
            return bttn;
        }

        target.play_button_width_origin = 256+32;
        target.play_button_width = target.play_button_width_origin;
        target.play_button_height_origin = 80;
        target.play_button_height = target.play_button_height_origin;
        target.play_button_yoffset_origin = -60;
        target.play_button_yoffset = target.play_button_yoffset_origin;
        target.exit_button_width_origin = 256+32;
        target.exit_button_width = target.exit_button_width_origin;
        target.exit_button_height_origin = 80;
        target.exit_button_height = target.exit_button_height_origin;
        target.exit_button_yoffset_origin = 60;
        target.exit_button_yoffset = target.exit_button_yoffset_origin;
        target.button_triangle_width_origin = 20;
        target.button_triangle_width = target.button_triangle_width_origin;

        target.play_button = create_button(target.play_button_width, target.play_button_height, 'mm/play_button', 0,
            target.play_button_yoffset, ()=>
            {
                mainmenu_startmenu.show = true;
                target.play_button.offset_animate = false;
                target.exit_button.offset_animate = false;
                target.play_button.offset_x = -display.cw()/2 - target.play_button.box_width
                    - target.play_button.triangle_width;
                target.exit_button.offset_x = -display.cw()/2 - target.exit_button.box_width
                    - target.exit_button.triangle_width;
                target.time = 4;
                target.time_paused = true;
            }
        );

        target.exit_button = create_button(target.exit_button_width, target.exit_button_height, 'mm/exit_button', 0, 
            target.exit_button_yoffset, ()=>{nw.Window.get().close()}
        );
    },
    step: function(target)
    {
        if (!target.time_paused) target.time += deltatime;
        if (target.time > 5)
        {
            target.play_button.offset_animate = true;
            target.exit_button.offset_animate = true;
        }
    },
    kb_down: function(target, key)
    {
        target.time = Math.max(4, target.time);
    },
    mouse_down: function(target, key)
    {
        target.time = Math.max(4, target.time);
    },
    room_start: function(target, prev_room)
    {
        target.time = prev_room === room_field ? 5 : 0;
        target.time_paused = false;
    },
    canvas_resize: function(target, width, height)
    {
        let measure = Math.min(height/HEIGHT, width/WIDTH);
        
        target.play_button_width = target.play_button_width_origin * measure;
        target.play_button_height = target.play_button_height_origin * measure;
        target.play_button_yoffset = target.play_button_yoffset_origin * measure;

        target.exit_button_width = target.exit_button_width_origin * measure;
        target.exit_button_height = target.exit_button_height_origin * measure;
        target.exit_button_yoffset = target.exit_button_yoffset_origin * measure;

        target.button_triangle_width = target.button_triangle_width_origin * measure;
        
        target.play_button.box_width = target.play_button_width;
        target.play_button.box_height = target.play_button_height;
        
        target.play_button.const_x = (width - target.play_button.box_width)/2
            - target.play_button.triangle_width;
        target.play_button.const_y = (height - target.play_button.box_height)/2 + target.play_button_yoffset;
        target.play_button.triangle_width = target.button_triangle_width;

        target.exit_button.box_width = target.exit_button_width;
        target.exit_button.box_height = target.exit_button_height;

        target.exit_button.const_x = (width - target.exit_button.box_width)/2
            - target.exit_button.triangle_width;
        target.exit_button.const_y = (height - target.exit_button.box_height)/2 + target.exit_button_yoffset;
        target.exit_button.triangle_width = target.button_triangle_width;
        
        if (target.play_button.offset_animate)
            target.play_button.offset_x = -width/2 - target.play_button.box_width - target.play_button.triangle_width;
        if (target.exit_button.offset_animate)
            target.exit_button.offset_x = -width/2 - target.exit_button.box_width - target.exit_button.triangle_width;
    },
});
//#endregion
//#region [BUTTON]
const EntMMButton = new engine.Entity({
    create: function(target)
    {
        target.pressed = false;
        target.text = '???';
        target.trigger = ()=>{};
        target.box_width = 256;
        target.box_height = 40;
        target.triangle_width = 20;
        target.const_x = 0;
        target.const_y = 0;
        target.offset_animate = false;
        target.offset_x = 0;
        target.offset_y = 0;
        target.mouse_on = false;
    },
    step: function(target)
    {
        let move = false;

        let interpolate = function(what_to)
        {
            let new_offset = engine.linear_interpolation(what_to, 0, 3);
            if (new_offset !== what_to)
            {
                what_to = new_offset;
                if (Math.round(what_to*1000)/1000 === 0.0) what_to = 0;
                move = true;
            }
            return what_to;
        };

        if (target.offset_animate)
        {
            target.offset_x = interpolate(target.offset_x);
            target.offset_y = interpolate(target.offset_y);
        }
    },
    draw: function(target, surface)
    {
        let bx = target.const_x + target.offset_x;
        let by = target.const_y + target.offset_y;
        let bw = target.box_width;
        let bh = target.box_height;
        let tw = target.triangle_width;
        let draw_box = function(surface, style, stroke = false)
        {
            surface.beginPath();
            surface.moveTo(bx+tw, by);
            surface.lineTo(bx+tw+bw+tw, by);
            surface.lineTo(bx+tw+bw, by+bh);
            surface.lineTo(bx, by+bh);
            surface.lineTo(bx+tw, by);
            if (stroke)
            {
                surface.lineWidth = 3;
                surface.strokeStyle = style;
                surface.stroke();
            }
            else
            {
                surface.fillStyle = style;
                surface.fill();
            }
        };

        draw_box(surface, 'rgba(0,0,0,0.7)');
        draw_box(surface, target.mouse_on ? 'rgb(255, 255, 255)' : 'rgb(0, 0, 0)', true);

        engine.draw_text(surface, bx+tw+bw/2, by+bh/2, target.text, 'fill', bh-4, 'center', 'center', 'white',
            '"Montserrat", serif');

    },
    mouse_move: function(target)
    {
        let bx = target.const_x + target.offset_x;
        let by = target.const_y + target.offset_y;
        let bw = target.box_width;
        let bh = target.box_height;
        let tw = target.triangle_width;
        let in_rect = (
            (bx+tw <= mx && mx <= bx+tw+bw)
            && (by <= my && my <= by+bh)
        );
        let in_tri1 = (
            (bx <= mx && mx <= bx+tw)
            && (by <= my && my <= by+tw)
            && (((mx-bx)/tw)+((my-by)/bh) >= 1)
        );
        let in_tri2 = (
            (bx+tw+bh <= mx && mx <= bx+tw+bh+tw)
            && (by <= my && my <= by+tw)
            && (((mx-bx-tw-bh)/tw)+((my-by)/bh) <= 1)
        );
        target.mouse_on = (in_rect || in_tri1 || in_tri2);
    },
    mouse_down: function(target, buttonid)
    {
        if (target.mouse_on && buttonid === engine.LMB) target.pressed = true;
    },
    mouse_up: function(target, buttonid)
    {
        if (target.mouse_on && target.pressed) target.trigger();
        target.pressed = false;
    },
});
//#endregion
//#region [STARTMENU]
const EntMMStartMenu = new engine.Entity({
    create: function(target)
    {
        target.modlist = load_modlist(modsfolder).map(value => ({name: value, enabled: false}));
        target.line_height_origin = 30;
        target.line_height = target.line_height_origin;
        target.line_separation_origin = 2;
        target.line_separation = target.line_separation_origin;
        target.window_width_origin = 512+128;
        target.window_width = target.window_width_origin;
        target.window_height_origin = 512+256+64+32;
        target.window_height = target.window_height_origin;
        target.border_width_origin = 2;
        target.border_width = target.border_width_origin;
        target.inline_padding_origin = 4;
        target.inline_padding = target.inline_padding_origin;
        target.subwindow_padding = Math.round(target.window_width*0.05);
        target.subwindow_width = target.window_width-(2*target.subwindow_padding);
        target.mods_height = Math.round((target.window_height-(4*target.subwindow_padding))*3/6);
        target.settings_height = Math.round((target.window_height-(4*target.subwindow_padding))*2/6);
        // target.show_step = 0;
        // target.show = false;
        // target.scroll = [0, 0];
        // target.old_scroll = [0, 0];
        // target.new_scroll = [0, 0];
        // target.scroll_step = [0, 0];
        target.max_scroll_step = [0.25, 0.25];
        target.settings = [
            {
                name: 'board_width', type: 'integer-scale', value: 32, min: 1, max: 999, step: 1, number_count: 3,
                display_name: get_locstring('start_menu/settings/board_width'),
            },
            {
                name: 'board_height', type: 'integer-scale', value: 32, min: 1, max: 999, step: 1, number_count: 3,
                display_name: get_locstring('start_menu/settings/board_height'),
            },
        ];
        target.settings_consts = {
            integer_scale: {
                triangle_height: target.line_height - (2*target.inline_padding),
                triangle_width: target.line_height/2 - target.inline_padding,
                spacing: target.inline_padding/2,
            },
        };

        let create_button = function(width, height, text, x_offset, y_offset, trigger)
        {
            let bttn = EntMMButton.create_instance();
            bttn.box_width = width;
            bttn.box_height = height;
            bttn.text = get_locstring(text);
            bttn.const_x = (display.cw() - bttn.box_width)/2 - bttn.triangle_width + x_offset;
            bttn.const_y = (display.ch() - target.window_height)/2 + y_offset;
            bttn.trigger = trigger;
            return bttn;
        };

        target.start_button_width = target.window_width*0.8;
        target.start_button_height = Math.round((target.window_height-(4*target.subwindow_padding))/6);
        target.start_button_triangle_width_origin = 20;
        target.start_button_triangle_width = target.start_button_triangle_width_origin;

        target.start_button = create_button(target.start_button_width, target.start_button_height, 'start_menu/start_button',
            0, 3*target.subwindow_padding + target.mods_height + target.settings_height, ()=>
            {
                gvars[0].board_width = target.settings.filter(x => x.name === 'board_width')[0].value;
                gvars[0].board_height = target.settings.filter(x => x.name === 'board_height')[0].value;

                gvars[0].objdata = {};
                objdata = gvars[0].objdata;
                gvars[0].idlist = [];
                idlist = gvars[0].idlist;

                let loaded_mod = load_mod(path.join('core', 'corecontent'), 'Casual Playground', true);
                idlist.push(...Object.keys(loaded_mod));
                for (let k in loaded_mod) objdata[k] = loaded_mod[k];

                for (let mod of target.modlist.filter(x => x.enabled))
                {
                    let loaded_mod = load_mod(path.join('data', 'mods', mod.name), mod.name, false);
                    idlist.push(...Object.keys(loaded_mod));
                    for (let k in loaded_mod) objdata[k] = loaded_mod[k];
                }

                engine.change_current_room(room_field);
            }
        );
    },
    step: function(target)
    {
        for (let i = 0; i < target.scroll.length; i++)
        {
            target.scroll_step[i] = engine.clamp(target.scroll_step[i] + deltatime, 0, target.max_scroll_step[i]);
            let step = engine.range2range(target.scroll_step[i], 0, target.max_scroll_step[i], 0, 1);
            step = Math.sin(Math.PI * step / 2);
            target.scroll[i] = target.old_scroll[i] + (target.new_scroll[i] - target.old_scroll[i]) * step;
        }

        let move = false;
        let interpolate = function(what_to, to)
        {
            let new_offset = engine.linear_interpolation(what_to, to, 3);
            if (new_offset !== what_to)
            {
                what_to = new_offset;
                if (Math.round(what_to*1000)/1000 === to) what_to = to;
                move = true;
            }
            return what_to;
        };

        target.show_step = interpolate(target.show_step, Math.floor(target.show));
        if (move) this.mouse_move(target);
    },
    draw: function(target, surface)
    {
        let ww = target.window_width;
        let wh = target.window_height;
        let border = '#333'; // border color
        let bg = '#666'; // bg color
        let bg_darker = '#555'; // bg darker color
        let bg_lighter = '#777'; // bg lighter color
        let textcolor = 'white'; // mod text color
        let sww = target.subwindow_width; // subwindow width
        let mh = target.mods_height; // mods window height
        let sh = target.settings_height; // settings window height
        let padding = target.subwindow_padding; // subwindow padding
        let lh = target.line_height; // mod line height
        let bw = target.border_width;

        target.start_button.const_x = -surface.canvas.width/2 - target.start_button.box_width/2
            - target.start_button.triangle_width + (surface.canvas.width*target.show_step);

        let surf1 = document.createElement('canvas').getContext('2d');
        surf1.canvas.width = ww;
        surf1.canvas.height = wh;
        surf1.fillStyle = bg;
        surf1.lineWidth = bw;
        surf1.strokeStyle = border;
        roundRect(surf1, bw, bw,
            ww-(2*bw), wh-(2*bw), bw*2, false);
        roundRect(surf1, 0, 0, ww, wh, bw*2, true);

        let surf2 = this.draw_mod_list(target);
        surf1.lineWidth = bw;
        surf1.strokeStyle = border;
        surf1.strokeRect(padding-bw, padding-bw, sww+bw, mh+bw);
        if (surf2.canvas.width !== 0 && surf2.canvas.height !== 0)
            surf1.drawImage(surf2.canvas, padding, padding);
        surf2.canvas.remove();

        let surf3 = this.draw_board_settings(target);
        surf1.lineWidth = bw;
        surf1.strokeStyle = border;
        surf1.strokeRect(padding-bw, mh+(2*padding), sww+bw, sh+bw);
        if (surf3.canvas.width !== 0 && surf3.canvas.height !== 0)
            surf1.drawImage(surf3.canvas, padding, padding*2 + mh + bw);
        surf3.canvas.remove();

        /*surf.globalCompositeOperation = 'destination-in';
        surf.fillStyle = 'rgba(255, 255, 255, 0.95)';
        surf.fillRect(0, 0, ww, wh);
        surf.globalCompositeOperation = 'source-over';*/
        surface.drawImage(surf1.canvas, -surface.canvas.width/2 - ww/2 + (surface.canvas.width*target.show_step),
            (surface.canvas.height-wh)/2);

        surf1.canvas.remove();
    },
    mouse_down: function(target, mb)
    {
        let oneline = (target.line_height + target.line_separation);
        switch (mb)
        {
            case engine.WHEELDOWN:
            case engine.WHEELUP:
            {
                let padding = target.subwindow_padding;
                let subwindow_xoffset = (display.cw()-target.window_width)/2 + padding;
                let modswindow_yoffset = (display.ch()-target.window_height)/2 + padding;
                let move = function(xoffset, yoffset, wwidth, wheight, ind, linesnum)
                {
                    let mouse_x = mx - xoffset;
                    let mouse_y = my - yoffset;
                    if (0 <= mouse_x && mouse_x <= wwidth && 0 <= mouse_y && mouse_y <= wheight)
                    {
                        let limit = (oneline * linesnum < wheight) ? 0 : wheight;
                        target.new_scroll[ind] = Math.max(0, engine.clamp(target.new_scroll[ind] + scroll_delta, 0,
                            linesnum * oneline - limit));
                        target.old_scroll[ind] = target.scroll[ind];
                        target.scroll_step[ind] = 0;
                    }
                }

                // Mod list
                move(subwindow_xoffset, modswindow_yoffset, target.subwindow_width, target.mods_height,
                    0, target.modlist.length);

                // Setting list
                move(subwindow_xoffset, modswindow_yoffset + padding + target.mods_height, target.subwindow_width,
                    target.settings_height, 1, target.settings.length);
                break;
            }
            case engine.LMB:
            {
                let padding = target.subwindow_padding;
                let ip = target.inline_padding;

                let click = function(xoffset, yoffset, wwidth, wheight, ind, func)
                {
                    let mouse_x = mx - xoffset;
                    let mouse_y = my - yoffset;
                    let iy = Math.floor(mouse_y/oneline) + Math.floor(target.scroll[ind]/oneline);
                    let oy = mouse_y % oneline;
                    if (0 <= mouse_x && mouse_x <= wwidth && 0 <= mouse_y && mouse_y <= wheight)
                        func(iy, mouse_x, oy);
                };

                // Mod list
                click(
                    (display.cw()-target.window_width)/2 + padding, (display.ch()-target.window_height)/2 + padding,
                    target.subwindow_width, target.mods_height, 0, (lineindex, ox, oy)=>
                    {
                        if (ip <= ox && ox <= target.line_height-(2*ip) && ip <= oy && oy <= target.line_height-(2*ip))
                            target.modlist[lineindex].enabled = !target.modlist[lineindex].enabled;
                    }
                );

                // Settings
                click(
                    (display.cw()-target.window_width)/2 + padding, (display.ch()-target.window_height)/2
                    + (2*padding) + target.mods_height, target.subwindow_width, target.settings_height, 0,
                    (lineindex, ox, oy)=>
                    {
                        if (lineindex < target.settings.length)
                        {
                            let sww = target.subwindow_width;
                            let triw = target.settings_consts.integer_scale.triangle_width;
                            let trih = target.settings_consts.integer_scale.triangle_height;
                            let box = target.line_height - (2 * ip);
                            switch (target.settings[lineindex].type) {
                                case "integer-scale":
                                    let tx = sww - ip - triw;
                                    let num_width = get_text_width('0'.repeat(target.settings[lineindex].number_count),
                                        `${box}px "DejaVu Sans Mono"`);

                                    if (tx <= ox && ox < tx + triw && ip <= oy && oy < ip + trih)
                                        target.settings[lineindex].value =
                                            engine.clamp(target.settings[lineindex].value + 1,
                                            target.settings[lineindex].min, target.settings[lineindex].max);

                                    tx -= 2 * ip + num_width;
                                    if (tx - triw <= ox && ox < tx && ip <= oy && oy < ip + trih)
                                        target.settings[lineindex].value =
                                            engine.clamp(target.settings[lineindex].value - 1,
                                            target.settings[lineindex].min, target.settings[lineindex].max);
                                    break;
                            }
                        }
                    }
                );

                /*// Mod list
                let mouse_x = mx - (display.cw()-target.window_width)/2 - padding - 4;
                let mouse_y = my - (display.ch()-target.window_height)/2 - padding - 4;
                let iy = Math.floor(mouse_y/oneline) + Math.floor(target.scroll[0]/oneline);
                let oy = mouse_y % oneline;
                if (0 <= mouse_x && mouse_x <= target.subwindow_width && 0 <= mouse_y && mouse_y <= target.mods_height)
                if (0 <= mouse_x && mouse_x <= target.line_height-4 && 0 <= oy && oy <= target.line_height-4)
                    target.modlist[iy].enabled = !target.modlist[iy].enabled;*/

                break;
            }
        }
    },
    draw_mod_list: function (target)
    {
        let bg_darker = '#555'; // bg darker color
        let bg_lighter = '#777'; // bg lighter color
        let textcolor = 'white'; // mod text color
        let sww = target.subwindow_width; // mods window width
        let swh = target.mods_height; // mods window height
        let lh = target.line_height; // mod line height
        let ls = target.line_separation; // mod separation line width
        let box_color = 'white'; // box color
        let ip = target.inline_padding;
        let box = lh-(2*ip);
        let bw = target.border_width;

        let surf = document.createElement('canvas').getContext('2d');
        surf.canvas.width = sww;
        surf.canvas.height = swh;
        surf.fillStyle = bg_darker;
        surf.fillRect(0, 0, sww, swh);
        let oneline = lh+ls;
        let mi = Math.floor(target.scroll[0]/oneline)-1; // mod index
        for (let oy = -target.scroll[0] % oneline; oy < swh; oy += oneline)
        {
            if (++mi >= target.modlist.length) break;
            surf.fillStyle = bg_lighter;
            surf.fillRect(0, oy, sww, lh);
            surf.lineWidth = bw;
            if (target.modlist[mi].enabled)
            {
                surf.fillStyle = box_color;
                surf.fillRect(ip, ip, box, box);
            }
            else
            {
                surf.strokeStyle = box_color;
                surf.strokeRect(ip + bw/2, oy + ip + bw/2,
                    box - bw, box - bw);
            }
            engine.draw_text(surf, lh, oy+lh/2, target.modlist[mi].name, 'fill', box, 'left',
                'center', textcolor, '"Montserrat", serif');
        }
        return surf;
    },
    draw_board_settings: function (target)
    {
        let bg_darker = '#555'; // bg darker color
        let bg_lighter = '#777'; // bg lighter color
        let textcolor = 'white'; // mod text color
        let sww = target.subwindow_width; // mods window width
        let swh = target.settings_height; // mods window height
        let lh = target.line_height; // mod line height
        let ls = target.line_separation; // mod separation line width
        let box_color = 'white'; // box color
        let ip = target.inline_padding;
        let triw = target.settings_consts.integer_scale.triangle_width;
        let trih = target.settings_consts.integer_scale.triangle_height;
        let box = lh-(2*ip);
        let bw = target.border_width;

        let surf = document.createElement('canvas').getContext('2d');
        surf.canvas.width = sww;
        surf.canvas.height = swh;
        surf.fillStyle = bg_darker;
        surf.fillRect(0, 0, sww, swh);
        let oneline = lh+ls;
        let si = Math.floor(target.scroll[1]/oneline)-1; // mod index
        for (let oy = -target.scroll[1] % oneline; oy < swh; oy += oneline)
        {
            if (++si >= target.settings.length) break;
            surf.fillStyle = bg_lighter;
            surf.fillRect(0, oy, sww, lh);
            surf.lineWidth = bw;
            engine.draw_text(surf, ip, oy+lh/2, target.settings[si].display_name, 'fill', box, 'left', 'center',
                textcolor, '"Montserrat", serif');

            switch (target.settings[si].type)
            {
                case "integer-scale":
                    let tx = sww-ip-triw;
                    let ty = oy+ip;
                    let num_width = get_text_width('0'.repeat(target.settings[si].number_count),
                        `${box}px "DejaVu Sans Mono"`);
                    surf.beginPath();
                    surf.moveTo(tx, ty);
                    surf.lineTo(tx+triw, ty+trih/2);
                    surf.lineTo(tx, ty+trih);
                    surf.fillStyle = 'white';
                    surf.fill();

                    let number = target.settings[si].value.toString();
                    number = '0'.repeat(target.settings[si].number_count-number.length) + number;

                    tx -= ip;
                    engine.draw_text(surf, tx, ty-ip+(lh/2), number, 'fill', box, 'right', 'center', 'white',
                        `"DejaVu Sans Mono"`);

                    tx -= num_width + ip + triw;
                    surf.beginPath();
                    surf.moveTo(tx+triw, ty);
                    surf.lineTo(tx, ty+trih/2);
                    surf.lineTo(tx+triw, ty+trih);
                    surf.fillStyle = 'white';
                    surf.fill();
                    break;
            }
        }

        return surf;
    },
    room_start: function (target)
    {
        target.show_step = 0;
        target.show = false;
        target.scroll = [0, 0];
        target.old_scroll = [0, 0];
        target.new_scroll = [0, 0];
        target.scroll_step = [0, 0];
    },
    canvas_resize: function (target, width, height)
    {
        let measure = Math.min(height/HEIGHT, width/WIDTH);

        target.line_height = target.line_height_origin * measure;
        target.line_separation = target.line_separation_origin * measure;
        target.window_width = target.window_width_origin * measure;
        target.window_height = target.window_height_origin * measure;
        target.border_width = target.border_width_origin * measure;
        target.inline_padding = target.inline_padding_origin * measure;

        target.subwindow_padding = Math.round(target.window_width*0.05);
        target.subwindow_width = target.window_width-(2*target.subwindow_padding);
        target.mods_height = Math.round((target.window_height-(4*target.subwindow_padding))*3/6);
        target.settings_height = Math.round((target.window_height-(4*target.subwindow_padding))*2/6);

        target.start_button_width = target.window_width*0.8;
        target.start_button_height = Math.round((target.window_height-(4*target.subwindow_padding))/6);
        target.start_button_triangle_width = target.start_button_triangle_width_origin * measure;

        target.start_button.const_x = (width - target.start_button.box_width)/2 - target.start_button.triangle_width;
        target.start_button.const_y = (height - target.window_height)/2 + 3*target.subwindow_padding
            + target.mods_height + target.settings_height;
        target.start_button.box_width = target.start_button_width;
        target.start_button.box_height = target.start_button_height;
        target.start_button.triangle_width = target.start_button_triangle_width

        target.settings_consts = {
            integer_scale: {
                triangle_height: target.line_height - (2*target.inline_padding),
                triangle_width: target.line_height/2 - target.inline_padding,
                spacing: target.inline_padding/2,
            },
        };
    },
});
//#endregion
//#endregion
//#region [INSTANCES]
var mainmenu_intro = EntMMIntro.create_instance();
var mainmenu_bg = EntMMBG.create_instance();
var mainmenu_controller = EntMMController.create_instance();
var mainmenu_startmenu = EntMMStartMenu.create_instance();
//#endregion
//#endregion

var room_field = new engine.Room([EntGlobalConsole, EntFieldBoard, EntFieldSUI]);
var room_mainmenu = new engine.Room([EntGlobalConsole, EntMMIntro, EntMMController, EntMMBG,
    EntMMStartMenu, EntMMButton]);
//#endregion

//#region [RUN]
engine.change_current_room(room_mainmenu);
var running = true;
var prevtime = 0.0;
var deltatime = 0.0;

var mx = 0;
var my = 0;
var scroll_delta = 0;
var globalkeys = {};
document.addEventListener('keydown', function(event)
{
    engine.current_room.do_kb_down(event);
    globalkeys[event.code] = true;
    switch (event.code)
    {
        case 'ShiftLeft':
        case 'ShiftRight':
            globalkeys.Shift = true;
            break;
        case 'ControlLeft':
        case 'ControlRight':
            globalkeys.Ctrl = true;
            break;
        case 'AltLeft':
        case 'AltRight':
            globalkeys.Alt = true;
            break;
        case 'MetaLeft':
        case 'MetaRight':
            globalkeys.Meta = true;
            break;
    }
    if (vi.devtools && event.code === 'Enter' && event.altKey) nw.Window.get().showDevTools();
});
document.addEventListener('keyup', function(event)
{
    engine.current_room.do_kb_up(event);
    globalkeys[event.code] = false;
    switch (event.code)
    {
        case 'ShiftLeft':
        case 'ShiftRight':
            globalkeys.Shift = false;
            break;
        case 'ControlLeft':
        case 'ControlRight':
            globalkeys.Ctrl = false;
            break;
        case 'AltLeft':
        case 'AltRight':
            globalkeys.Alt = false;
            break;
        case 'MetaLeft':
        case 'MetaRight':
            globalkeys.Meta = false;
            break;
    }
});
canvas_element.addEventListener('mousemove', function(event)
{
    mx = (event.offsetX-display.offset_x) * display.cw() / (display.sw()-(2*display.offset_x));
    my = (event.offsetY-display.offset_y) * display.ch() / (display.sh()-(2*display.offset_y));
    engine.current_room.do_mouse_move();
});
canvas_element.addEventListener('mousedown', function(event)
{
    engine.current_room.do_mouse_down(event.button);
    switch (event.button)
    {
        case engine.LMB:
            globalkeys.LMB = true;
            break;
        case engine.RMB:
            globalkeys.RMB = true;
            break;
        case engine.MMB:
            globalkeys.MMB = true;
            break;
    }
});
canvas_element.addEventListener('mouseup', function(event)
{
    engine.current_room.do_mouse_up(event.button);
    switch (event.button)
    {
        case engine.LMB:
            globalkeys.LMB = false;
            break;
        case engine.RMB:
            globalkeys.RMB = false;
            break;
        case engine.MMB:
            globalkeys.MMB = false;
            break;
    }
});
canvas_element.addEventListener('wheel', function(event)
{
    scroll_delta = event.deltaY;
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