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

//#region [IMPORT]
const platform = document.getElementById('script').hasAttribute('platform')
    ? document.getElementById('script').getAttribute('platform') : 'WEB';
const httpGetAsync = function(theUrl, callback)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState === 4 && xmlHttp.status === 200)
            callback(xmlHttp.responseText);
    }
    xmlHttp.open("GET", theUrl, true); // true for asynchronous
    xmlHttp.send(null);
}

window.onerror = function(msg, url, linenumber)
{
    alert('Error message: '+msg+'\nURL: '+url+'\nLine Number: '+linenumber);
    nw.Window.get().close();
    return true;
}
const engine = require('./core/nle.cjs');
const comp = require('./core/compiler.cjs');
const ccc = require('./core/compiler_conclusions_cursors.cjs');
const ents = require('./core/entities/entities.cjs')
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

//#region [INITIALIZATION]
var version = vi.version_info.version;
var dvlp_stage = vi.version_info.stage;
var dvlp_build = ''+vi.version_info.build;

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
var display = new engine.Display(document, canvas_element, WIDTH, HEIGHT);
var top_panel = document.getElementById('top_panel');
var text_window = document.getElementById('text_window');
var button_max = document.getElementById('button_max');
display.resizeCanvas(engine.default_room, nw.Window.get().cWindow.width, nw.Window.get().cWindow.height);
var resize_window1 = function (width, height) {display.resizeCanvas(gvars[0].current_room, width, height-top_panel.offsetHeight);};
var resize_window2 = function () {
    let [w, h] = [nw.Window.get().width, nw.Window.get().height];
    display.resizeCanvas(gvars[0].current_room, w, h-top_panel.offsetHeight);
    [w, h] = [nw.Window.get().cWindow.tabs[0].width, nw.Window.get().cWindow.tabs[0].height];
    display.resizeCanvas(gvars[0].current_room, w, h-top_panel.offsetHeight);
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
                        gvars[0].update_board_fully = true;
                        gvars[0].update_objmenu = true;
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
var user_settings = JSON.parse(fs.readFileSync('./settings.json', {encoding:"utf8"}));
var loc = user_settings.localization;
var locstrings = JSON.parse(fs.readFileSync('./core/localization.json', {encoding:"utf8"})).localization;

var corefolder = path.join('core', 'corecontent');
var modsfolder = path.join('data', 'addons');
if (!fs.existsSync(corefolder)) fs.mkdirSync(corefolder);
if (!fs.existsSync(modsfolder)) fs.mkdirSync(modsfolder);

var fontsize = scale*2;
var gvars = [{'objdata':{}, // = {'grass':{CELLDATA}, 'dirt':{CELLDATA}, ...}
              'idlist':[], // = ['grass', 'dirt', ...]
              'logger':[],
              'board_width':32,
              'board_height':32,
              'linecolor_infield': [26, 26, 26],
              'linecolor_outfield': [102, 102, 102],
              'selection_color': [55, 55, 200],
              'cellbordersize': 0.125,
              'cell_fill_on_init': 'grass',
              'history_max_length': user_settings.history_max_length,
              'scale': scale,
              'WIDTH': WIDTH,
              'WIDTH2': WIDTH2,
              'HEIGHT': HEIGHT,
              'HEIGHT2': HEIGHT2,
              'fontsize': fontsize,
              'fontsize_bigger':  Math.floor(32*fontsize/scale),
              'fontsize_big':     Math.floor(24*fontsize/scale),
              'fontsize_default': Math.floor(16*fontsize/scale),
              'fontsize_small':   Math.floor(12*fontsize/scale),
              'fontsize_smaller': Math.floor( 8*fontsize/scale),
              'deltatime': 0.0,
              'prevtime': 0.0,
              'scroll_delta': 0.0,
              'update_board': false,
              'update_board_fully': false,
              'update_selection': false,
              'update_objmenu': false,
              'current_instrument': {'type': 'none'},
              'globalkeys': {},
              'mx': 0,
              'my': 0,
              'get_locstring': get_locstring,
              'display': display,
              'roundRect': roundRect,
              'rgb_to_style': rgb_to_style,
              'loc': loc,
              'cut_string': cut_string,
              'load_mod': load_mod,
              'load_modlist': load_modlist,
              'modsfolder': modsfolder,
              'get_text_width': get_text_width,
              'current_room': engine.default_room,
              'sprites': load_images('./core/sprites', true),
              'arraysEqual': arraysEqual,
              'has_focus': false,
              },
             {}];

var idlist = gvars[0].idlist;
var objdata = gvars[0].objdata;
var logger = gvars[0].logger;

// INSERT FONT LOADER

let coremods = load_mod(corefolder, 'Casual Playground', 1);
idlist.push(...Object.keys(coremods));
objdata = {...objdata, ...coremods};
gvars[0].objdata = objdata;

console.log(Object.keys(objdata));
console.log(idlist);
console.log(idlist.map((value, index) => [index, value]));

//#endregion

//#region [ROOMS]
gvars[0].global_console = ents.EntGlobalConsole.create_instance(gvars);

gvars[0].field_board = ents.EntFieldBoard.create_instance(gvars);
gvars[0].field_sui = ents.EntFieldSUI.create_instance(gvars);
gvars[0].field_sh = ents.EntFieldSH.create_instance(gvars);

gvars[0].mm_intro = ents.EntMMIntro.create_instance(gvars);
gvars[0].mm_bg = ents.EntMMBG.create_instance(gvars);
gvars[0].mm_controller = ents.EntMMController.create_instance(gvars);
gvars[0].mm_startmenu = ents.EntMMStartMenu.create_instance(gvars);

gvars[0].room_field = new engine.Room([ents.EntGlobalConsole, ents.EntFieldBoard, ents.EntFieldSUI, ents.EntFieldSH]);
gvars[0].room_mainmenu = new engine.Room([ents.EntGlobalConsole, ents.EntMMIntro, ents.EntMMController, ents.EntMMBG,
    ents.EntMMStartMenu, ents.EntMMButton]);
//#endregion

//#region [RUN]
gvars[0].current_room = gvars[0].room_mainmenu;
gvars[0].current_room.do_start()
var running = true;
document.addEventListener('keydown', function(event)
{
    gvars[0].current_room.do_kb_down(event);
    gvars[0].globalkeys[event.code] = true;
    switch (event.code)
    {
        case 'ShiftLeft':
        case 'ShiftRight':
            gvars[0].globalkeys.Shift = true;
            break;
        case 'ControlLeft':
        case 'ControlRight':
            gvars[0].globalkeys.Ctrl = true;
            break;
        case 'AltLeft':
        case 'AltRight':
            gvars[0].globalkeys.Alt = true;
            break;
        case 'MetaLeft':
        case 'MetaRight':
            gvars[0].globalkeys.Meta = true;
            break;
    }
    if (vi.devtools && event.code === 'Enter' && event.altKey) nw.Window.get().showDevTools();
});
document.addEventListener('keyup', function(event)
{
    gvars[0].current_room.do_kb_up(event);
    gvars[0].globalkeys[event.code] = false;
    switch (event.code)
    {
        case 'ShiftLeft':
        case 'ShiftRight':
            gvars[0].globalkeys.Shift = false;
            break;
        case 'ControlLeft':
        case 'ControlRight':
            gvars[0].globalkeys.Ctrl = false;
            break;
        case 'AltLeft':
        case 'AltRight':
            gvars[0].globalkeys.Alt = false;
            break;
        case 'MetaLeft':
        case 'MetaRight':
            gvars[0].globalkeys.Meta = false;
            break;
    }
});
canvas_element.addEventListener('mousemove', function(event)
{
    gvars[0].mx = (event.offsetX-display.offset_x) * display.cw() / (display.sw()-(2*display.offset_x));
    gvars[0].my = (event.offsetY-display.offset_y) * display.ch() / (display.sh()-(2*display.offset_y));
    gvars[0].current_room.do_mouse_move();
});
canvas_element.addEventListener('mousedown', function(event)
{
    switch (event.button)
    {
        case engine.LMB:
            gvars[0].globalkeys.LMB = true;
            break;
        case engine.RMB:
            gvars[0].globalkeys.RMB = true;
            break;
        case engine.MMB:
            gvars[0].globalkeys.MMB = true;
            break;
    }
    gvars[0].current_room.do_mouse_down(event.button);
});
canvas_element.addEventListener('mouseup', function(event)
{
    switch (event.button)
    {
        case engine.LMB:
            gvars[0].globalkeys.LMB = false;
            break;
        case engine.RMB:
            gvars[0].globalkeys.RMB = false;
            break;
        case engine.MMB:
            gvars[0].globalkeys.MMB = false;
            break;
    }
    gvars[0].current_room.do_mouse_up(event.button);
});
canvas_element.addEventListener('wheel', function(event)
{
    gvars[0].scroll_delta = event.deltaY;
    if (event.deltaY > 0) gvars[0].current_room.do_mouse_down(engine.WHEELDOWN);
    else gvars[0].current_room.do_mouse_down(engine.WHEELUP);
});
const main = function (time)
{
    if (running)
    {
        gvars[0].deltatime = (time - gvars[0].prevtime)/1000;
        gvars[0].prevtime = time;
        gvars[0].has_focus = document.hasFocus();
        display.clear();
        gvars[0].current_room.do_step(display.buffer);
        display.render();
        window.requestAnimationFrame(main);
    }
};
window.requestAnimationFrame(main);
//#endregion