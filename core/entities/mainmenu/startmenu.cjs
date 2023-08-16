const engine = require("../../nle.cjs");
const EntMMButton = require("./button.cjs").EntMMButton;
const fs = require('fs');
const path = require('path');

const EntMMStartMenu = new engine.Entity({
    create: function(target, gvars)
    {
        target.gvars = gvars;
        let load_modlist = target.gvars[0].load_modlist;
        let modsfolder = target.gvars[0].modsfolder;
        let objdata = target.gvars[0].objdata;
        let idlist = target.gvars[0].idlist;
        let loc = target.gvars[0].loc;
        if (target.gvars[0].platform === 'NODE')
            target.modlist = load_modlist(modsfolder).map(value => ({name: value, enabled: false}));
        else
            target.modlist = target.gvars[0].addonlist.map(value => ({name: value, enabled: false}));
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
        target.pressed_start = false;
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
                display_name: target.gvars[0].get_locstring('start_menu/settings/board_width'),
            },
            {
                name: 'board_height', type: 'integer-scale', value: 32, min: 1, max: 999, step: 1, number_count: 3,
                display_name: target.gvars[0].get_locstring('start_menu/settings/board_height'),
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
            let display = target.gvars[0].display;
            let bttn = EntMMButton.create_instance(target.gvars);
            bttn.box_width = width;
            bttn.box_height = height;
            bttn.text = target.gvars[0].get_locstring(text);
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
                if (!target.pressed_start)
                {
                    target.pressed_start = true;
                    target.gvars[0].board_width = target.settings.filter(x => x.name === 'board_width')[0].value;
                    target.gvars[0].board_height = target.settings.filter(x => x.name === 'board_height')[0].value;
                    if (target.gvars[0].platform === 'NODE')
                    {
                        target.gvars[0].objdata = {};
                        objdata = target.gvars[0].objdata;
                        target.gvars[0].idlist = [];
                        idlist = target.gvars[0].idlist;
                        let loaded_mod = target.gvars[0].load_mod(path.join('core', 'corecontent'), 'Casual Playground', true);
                        idlist.push(...Object.keys(loaded_mod));
                        for (let k in loaded_mod) objdata[k] = loaded_mod[k];

                        for (let mod of target.modlist.filter(x => x.enabled))
                        {
                            let loaded_mod = target.gvars[0].load_mod(path.join('data', 'addons', mod.name), mod.name, false);
                            idlist.push(...Object.keys(loaded_mod));
                            for (let k in loaded_mod) objdata[k] = loaded_mod[k];
                        }

                        target.gvars[0].current_room.do_end();
                        target.gvars[0].current_room = target.gvars[0].room_field;
                        target.gvars[0].current_room.do_start();
                    }
                    else
                    {
                        target.gvars[0].loading_spinner.style.display = 'block';
                        target.gvars[0].loading_state.innerText = 'Loading addons...';
                        target.gvars[0].objdata = {};
                        objdata = target.gvars[0].objdata;
                        target.gvars[0].idlist = [];
                        idlist = target.gvars[0].idlist;
                        new Promise((resolve, reject)=>{
                            target.gvars[0].load_mod('corecontent', 'Casual Playground', 1).then(resolve)
                        }).then((loaded_mod)=>{
                            idlist.push(...Object.keys(loaded_mod));
                            for (let k in loaded_mod) objdata[k] = loaded_mod[k];
                        }).then(()=>{
                            (async ()=>{
                                for (let mod of target.modlist.filter(x => x.enabled))
                                {
                                    let loaded_mod = await target.gvars[0].load_mod(mod.name, mod.name, 0);
                                    idlist.push(...Object.keys(loaded_mod));
                                    for (let k in loaded_mod) objdata[k] = loaded_mod[k];
                                }
                                target.gvars[0].loading_substate.innerText = '';
                                target.gvars[0].loading_state.innerText = '';
                                target.gvars[0].loading_spinner.style.display = 'none';
                                target.gvars[0].current_room.do_end();
                                target.gvars[0].current_room = target.gvars[0].room_field;
                                target.gvars[0].current_room.do_start();
                            })();
                        });
                    }
                }

            }
        );
    },
    room_start: function (target)
    {
        target.show_step = 0;
        target.show = false;
        target.scroll = [0, 0];
        target.old_scroll = [0, 0];
        target.new_scroll = [0, 0];
        target.scroll_step = [0, 0];
        target.pressed_start = false;
    },
    step: function(target)
    {
        let deltatime = target.gvars[0].deltatime;
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

        let surf1 = target.gvars[0].document.createElement('canvas').getContext('2d');
        surf1.canvas.width = ww;
        surf1.canvas.height = wh;
        surf1.fillStyle = bg;
        surf1.lineWidth = bw;
        surf1.strokeStyle = border;
        target.gvars[0].roundRect(surf1, bw, bw,
            ww-(2*bw), wh-(2*bw), bw*2, false);
        target.gvars[0].roundRect(surf1, 0, 0, ww, wh, bw*2, true);

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
        let get_text_width = target.gvars[0].get_text_width;
        let display = target.gvars[0].display;
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
                    let mouse_x = target.gvars[0].mx - xoffset;
                    let mouse_y = target.gvars[0].my - yoffset;
                    if (0 <= mouse_x && mouse_x <= wwidth && 0 <= mouse_y && mouse_y <= wheight)
                    {
                        let limit = (oneline * linesnum < wheight) ? 0 : wheight;
                        target.new_scroll[ind] = Math.max(0, engine.clamp(target.new_scroll[ind] +
                            target.gvars[0].scroll_delta, 0, linesnum * oneline - limit));
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
                    let mouse_x = target.gvars[0].mx - xoffset;
                    let mouse_y = target.gvars[0].my - yoffset;
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

        let surf = target.gvars[0].document.createElement('canvas').getContext('2d');
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

        let surf = target.gvars[0].document.createElement('canvas').getContext('2d');
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
                    let num_width = target.gvars[0].get_text_width('0'.repeat(target.settings[si].number_count),
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
    canvas_resize: function (target, width, height)
    {
        let measure = Math.min(height/target.gvars[0].HEIGHT, width/target.gvars[0].WIDTH);

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

module.exports = {EntMMStartMenu};