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

//#region [IMPORT & INIT]
var platform, api_server, httpGetAsync, getapi;
var engine, comp, ccc, ents, fs, path, vi, ctt;
var version, dvlp_stage, dvlp_build;
var scale, WIDTH, HEIGHT, WIDTH2, HEIGHT2, canvas_element, canvas_container, display;
var loading_state, loading_substate, loading_spinner;
platform = document.getElementById('script').hasAttribute('platform')
    ? document.getElementById('script').getAttribute('platform') : 'WEB';
const init1 = async function ()
{
    console.log('Platform: '+platform);
    window.onerror = function(msg, url, linenumber)
    {
        alert('Error message: '+msg+'\nURL: '+url+'\nLine Number: '+linenumber);
        if (platform === 'NODE') nw.Window.get().close();
        return true;
    }
    engine = require('./core/nle.cjs');
    comp = require('./core/compiler.cjs');
    ccc = require('./core/compiler_conclusions_cursors.cjs');
    ctt = require('./core/compiler_task_types.cjs');
    ents = require('./core/entities/entities.cjs');
    if (platform === 'NODE')
    {
        fs = require('fs');
        path = require('path');
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
        version = vi.version_info.version;
        dvlp_stage = vi.version_info.stage;
        dvlp_build = ''+vi.version_info.build;
        document.getElementById('window-name').innerText = `Casual Playground - ${dvlp_stage} ${version}`;
    }
    else
    {
        loading_state = document.getElementById('LoadingState');
        loading_substate = document.getElementById('LoadingSubstate');
        loading_spinner = document.getElementById('LoadingSpinner');
        api_server = 'http://185.251.88.244/api';
        httpGetAsync = async function(theUrl)
        {
            return new Promise(function (resolve, reject) {
                let xhr = new XMLHttpRequest();
                xhr.onload = ()=>{
                    if (xhr.readyState === 4 && xhr.status === 200) resolve(xhr.response);
                    else reject({status: xhr.status, statusText: xhr.statusText});
                }
                xhr.onerror = ()=>{reject({status: xhr.status, statusText: xhr.statusText})};
                xhr.open("GET", theUrl, true); // true for asynchronous
                xhr.send(null);
            });
        }
        getapi = async function(request, options={})
        {
            options.request = request;
            let options_array = [];
            Object.keys(options).forEach((key)=>{options_array.push(key+'='+options[key])})
            return httpGetAsync(api_server+'?'+options_array.join('&'));
        };
        vi = {
            version_info: {
                version: "Unknown Version",
                stage: "Unknown Stage",
                build: 0,
            },
            devtools: false,
        };
        try {
            vi = JSON.parse(await getapi('vi'));
        }
        catch (err) {
            console.log(err.message);
        }
        version = vi.version_info.version;
        dvlp_stage = vi.version_info.stage;
        dvlp_build = ''+vi.version_info.build;
        document.title = `Casual Playground - ${dvlp_stage} ${version}`;
    }

    console.log('\n'+
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

    scale = 100;
    WIDTH = 16*scale;
    HEIGHT = 9*scale;
    WIDTH2 = Math.floor(WIDTH/2);
    HEIGHT2 = Math.floor(HEIGHT/2);
    canvas_element = document.getElementById('CasualPlaygroundCanvas');
    display = new engine.Display(document, canvas_element, WIDTH, HEIGHT);
    if (platform === 'NODE')
    {
        var top_panel = document.getElementById('top_panel');
        var text_window = document.getElementById('text_window');
        var button_max = document.getElementById('button_max');
        display.resizeCanvas(engine.default_room, nw.Window.get().cWindow.width, nw.Window.get().cWindow.height);
        var resize_window1 = function (width, height)
        {
            if (typeof gvars !== 'undefined')
                display.resizeCanvas(gvars[0].current_room, width, height-top_panel.offsetHeight);
        };
        var resize_window2 = function ()
        {
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
            function()
            {
                resize_window2();
                button_max.onclick = function(){nw.Window.get().maximize()};
                button_max.children[0].style = 'text-shadow: initial; transform: translate(0)';
            }
        );
        nw.Window.get().on
        (
            'maximize',
            function()
            {
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
    }
    else
    {
        document.body.style.overflow = 'hidden';
        canvas_container = document.getElementById('CasualPlaygroundCanvasContainer');
        let computed = getComputedStyle(canvas_container);
        window.addEventListener('resize', (event)=>{
            display.resizeCanvas(gvars[0].current_room,
                canvas_container.offsetWidth-parseInt(computed.paddingLeft)-parseInt(computed.paddingRight),
                canvas_container.offsetHeight-parseInt(computed.paddingTop)-parseInt(computed.paddingBottom));
        });
        display.resizeCanvas(engine.default_room,
            canvas_container.offsetWidth-parseInt(computed.paddingLeft)-parseInt(computed.paddingRight),
            canvas_container.offsetHeight-parseInt(computed.paddingTop)-parseInt(computed.paddingBottom));
    }
};
//#endregion

//#region [LOADING FUNCTIONS]
var get_text_width, get_locstring, arraysEqual, roundRect, rgb_to_style, cut_string;
var load_modlist, load_mod, load_img, load_images;
const init2 = async function ()
{
    get_text_width = function(txt, font)
    {
        text_window.style.font = font;
        text_window.innerHTML = txt;
        return text_window.offsetWidth;
    };

    get_locstring = function(locstring_id)
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

    arraysEqual = function(a, b)
    {
        if (a === b) return true;
        if (a == null || b == null) return false;
        if (a.length !== b.length) return false;
        for (var i = 0; i < a.length; ++i) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    };

    roundRect = function(ctx, x, y, width, height, radius, stroke = false)
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

    rgb_to_style = (r,g,b) => `rgb(${r}, ${g}, ${b})`;

    cut_string = function(string, font, upto)
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

    if (platform === 'NODE')
    {
        load_modlist = function(modsfolder)
        {
            return fs.readdirSync(modsfolder, {encoding: "utf8"})
                .filter(filepath => fs.lstatSync(path.join(modsfolder, filepath)).isDirectory());
        };
        load_mod = function(modfolder, mod_origin, official)
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
        };
        load_img = function(path)
        {
            let img = new Image();
            img.src = path;
            return img;
        };
        load_images = function(folder, preload=false)
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
        };
    }
    else
    {
        load_modlist = async function()
        {
            return JSON.parse(await getapi('addon_list'));
        };
        load_mod = async function(modfolder, mod_origin, official)
        {
            let mods = {};
            let content;
            if (official === 1) content = JSON.parse(await getapi('get_corecontent_folder'));
            else content = JSON.parse(await getapi('addon_folder', {addon: modfolder}));
            let i = 0;
            for (let k in content)
            {
                i++;
                if (content.hasOwnProperty(k) && content[k].toLowerCase().endsWith('.cpl'))
                {
                    loading_substate.innerText =
                        `Loading "${content[k]}" from "${modfolder}"... (${i}/${content.length})`;
                    let compiled;
                    if (official === 1)
                        compiled = JSON.parse(await getapi('compile_corecontent_cell', {file: content[k]}));
                    else
                        compiled = JSON.parse(await getapi('compile_addon_cell', {addon: modfolder, file: content[k]}));
                    let moddata = compiled.cell;
                    let concl = compiled.conc;
                    let cur = compiled.curs;
                    for (let jk in moddata.script_string)
                    {
                        if (moddata.script_string.hasOwnProperty(jk) && moddata.script_string[jk] !== null)
                        {
                            let jsc = moddata.script_string[jk];
                            jsc = new Function('caller', 'ctt', jsc);
                            moddata.script[jk] = (caller)=>{jsc(caller, ctt)};
                        }
                    }
                    let modname = content[k].slice(0, -4);
                    moddata.origin = mod_origin;
                    moddata.official = official;
                    let imgpath = modname + '.png';
                    let imgbase64 = await getapi('get_corecontent_file', {file: imgpath});
                    if (imgbase64 !== 'false')
                    {
                        moddata.texture = new Image();
                        moddata.texture_ready = false;
                        moddata.texture.onload = function()
                        {
                            moddata.texture_ready = true;
                            gvars[0].update_board_fully = true;
                            gvars[0].update_objmenu = true;
                        };
                        moddata.texture.src = 'data:image/png;base64,'+imgbase64;
                    }
                    if (official) mods[modname] = moddata;
                    else mods[`${mod_origin}/${modname}`] = moddata;
                }
            }
            return mods;
        };
        load_img = async function(b64)
        {
            let img = new Image();
            img.src = 'data:image/png;base64,'+b64;
            return img;
        };
        load_images = async function(folder, preload)
        {
            let loaded = {};
            let req = JSON.parse(await getapi('sprites_list', {subfolder: folder}));
            for (let i in req)
            {
                let folder_element;
                if (req.hasOwnProperty(i)) folder_element = req[i];
                if (folder_element.type === 'dir')
                    loaded[folder_element.name] = await load_images(folder+'%2F'+folder_element.name, preload);
                else
                {
                    let name = folder_element.name.slice(0, folder_element.name.lastIndexOf('.'));
                    loaded[name] = await load_img(await getapi('sprite',
                        {file: folder+'%2F'+folder_element.name}));
                    if (preload) loaded[name].onload = ()=>{};
                }
            }
            return loaded;
        };
    }
};
//#endregion

//#region [SETTINGS]
var user_settings, loc, locstrings, corefolder, modsfolder, sprites, gvars;

const init3 = async function ()
{
    if (platform === 'NODE')
    {
        user_settings = JSON.parse(fs.readFileSync('./settings.json', {encoding:"utf8"}));
        loc = user_settings.localization;
        locstrings = JSON.parse(fs.readFileSync('./core/localization.json', {encoding:"utf8"})).localization;

        corefolder = path.join('core', 'corecontent');
        modsfolder = path.join('data', 'addons');
        if (!fs.existsSync(corefolder)) fs.mkdirSync(corefolder);
        if (!fs.existsSync(modsfolder)) fs.mkdirSync(modsfolder);

        sprites = load_images('./core/sprites', true);
    }
    else
    {
        user_settings = JSON.parse(await getapi('user_settings'));
        loc = user_settings.localization;
        locstrings = JSON.parse(await getapi('localization')).localization;

        sprites = await load_images('', true);
        console.log(sprites);
    }

    let fontsize = scale*2;
    gvars = [{'objdata':{}, // = {'grass':{CELLDATA}, 'dirt':{CELLDATA}, ...}
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
              'sprites': sprites,
              'arraysEqual': arraysEqual,
              'has_focus': false,
              'platform': platform,
              'document': document,
              'navigator': navigator,
              'running': true,
              'addonlist': [],
              'loading_substate': loading_substate,
              'loading_state': loading_state,
              'loading_spinner': loading_spinner,
              },
             {}];

    var idlist = gvars[0].idlist;
    var objdata = gvars[0].objdata;
    var logger = gvars[0].logger;

    let coremods;
    if (platform === 'NODE')
    {
        coremods = load_mod(corefolder, 'Casual Playground', 1);
    }
    else
    {
        gvars[0].addonlist = await load_modlist();
        coremods = await load_mod('corecontent', 'Casual Playground', 1);
    }
    idlist.push(...Object.keys(coremods));
    objdata = {...objdata, ...coremods};
    gvars[0].objdata = objdata;

    console.log(Object.keys(objdata));
    console.log(idlist);
    console.log(idlist.map((value, index) => [index, value]));
};
//#endregion

//#region [ROOMS]
const init4 = async function ()
{
    gvars[0].global_console = ents.EntGlobalConsole.create_instance(gvars);

    gvars[0].field_board = ents.EntFieldBoard.create_instance(gvars);
    gvars[0].field_sui = ents.EntFieldSUI.create_instance(gvars);
    gvars[0].field_sh = ents.EntFieldSH.create_instance(gvars);

    gvars[0].mm_intro = ents.EntMMIntro.create_instance(gvars);
    gvars[0].mm_bg = ents.EntMMBG.create_instance(gvars);
    gvars[0].mm_controller = ents.EntMMController.create_instance(gvars);
    gvars[0].mm_startmenu = ents.EntMMStartMenu.create_instance(gvars);

    gvars[0].room_field = new engine.Room([ents.EntGlobalConsole, ents.EntFieldBoard, ents.EntFieldSUI,
        ents.EntFieldSH]);
    gvars[0].room_mainmenu = new engine.Room([ents.EntGlobalConsole, ents.EntMMIntro, ents.EntMMController,
        ents.EntMMBG, ents.EntMMStartMenu, ents.EntMMButton]);
};
//#endregion

//#region [FINISHING UP]
const init5 = async function ()
{
    gvars[0].current_room = gvars[0].room_mainmenu;
    gvars[0].current_room.do_start();
    if (platform !== 'NODE')
    {
        let computed = getComputedStyle(canvas_container);
        display.resizeCanvas(gvars[0].current_room,
            canvas_container.offsetWidth-parseInt(computed.paddingLeft)-parseInt(computed.paddingRight),
            canvas_container.offsetHeight-parseInt(computed.paddingTop)-parseInt(computed.paddingBottom));
    }
    document.addEventListener('keydown', function(event)
    {
        event.stopPropagation();
        event.preventDefault();
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
        gvars[0].current_room.do_kb_down(event);
        if (vi.devtools && event.code === 'Enter' && event.altKey)
        {
            if (platform === 'NODE') nw.Window.get().showDevTools();
        }
    });
    document.addEventListener('keyup', function(event)
    {
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
        gvars[0].current_room.do_kb_up(event);
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
};

const mainloop = async function (time)
{
    if (gvars[0].running)
    {
        gvars[0].deltatime = (time - gvars[0].prevtime)/1000;
        gvars[0].prevtime = time;
        gvars[0].has_focus = document.hasFocus();
        display.clear();
        gvars[0].current_room.do_step(display.buffer);
        display.render();
        window.requestAnimationFrame(mainloop);
    }
};
//#endregion

//#region [RUN]
const run = async function ()
{
    if (platform === 'NODE')
    {
        await init1();
        await init2();
        await init3();
        await init4();
        await init5();
        window.requestAnimationFrame(mainloop);
    }
    else
    {
        await init1(); loading_state.innerText = 'Loading... (2/5)'; loading_substate.innerText = '';
        await init2(); loading_state.innerText = 'Loading... (3/5)'; loading_substate.innerText = '';
        await init3(); loading_state.innerText = 'Loading... (4/5)'; loading_substate.innerText = '';
        await init4(); loading_state.innerText = 'Loading... (5/5)'; loading_substate.innerText = '';
        await init5(); loading_state.innerText = 'Loaded!'; loading_substate.innerText = '';
        loading_state.innerText = '';
        loading_spinner.style.display = 'none';
        window.requestAnimationFrame(mainloop);
    }
};
run();
//#endregion