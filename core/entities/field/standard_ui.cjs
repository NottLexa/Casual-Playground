const engine = require("../../nle.cjs");

const EntFieldSUI = new engine.Entity({
    create: function(target, gvars)
    {
        target.gvars = gvars;
        let scale = target.gvars[0].scale;
        let display = target.gvars[0].display;
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
        target.instrmenu_heading_size_minimized_origin = 28; // size of minimized instrument menu title
        target.instrmenu_heading_size_minimized = target.instrmenu_heading_size_minimized_origin;
        target.instrmenu_imgbox_ratio = 0.9;
        target.border_width_origin = 5;
        target.border_width = target.border_width_origin;
        target.object_name_size_origin = target.gvars[0].fontsize_smaller;
        target.object_name_size = target.object_name_size_origin;
        target.descmenu_name_size_origin = target.gvars[0].fontsize_big;
        target.descmenu_name_size = target.descmenu_name_size_origin;
        target.descmenu_properties_size_origin = target.gvars[0].fontsize_smaller;
        target.descmenu_properties_size = target.descmenu_properties_size_origin;
        target.descmenu_description_size_origin = target.gvars[0].fontsize_smaller;
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
        target.width_part = Math.round((display.cw() - 4*wm)/3); // equal parts of screen's width (currently a third)
        target.objmenu_height = display.ch() - (2*wm); // object menu height
        target.instrmenu_height = display.ch()/3 - (3*wm); // instrument menu height
        target.instrmenu_height_minimized = wb+ws+target.instrmenu_heading_size_minimized;
        target.hotbar_height = target.width_part/10;
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
        let display = target.gvars[0].display;
        target.hotbar = Array(10);
        for (let i = 0; i<10;i++) target.hotbar[i] = {type:'none'};
        target.hotbar_slot = 1;
        target.gvars[0].current_instrument = target.hotbar[target.hotbar_slot]

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

        if (target.gvars[0].update_objmenu) target.objmenu_surface = this.draw_objmenu(target);
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

        let instr_hb = this.draw_instrument_hotbar(target);
        surface.drawImage(instr_hb.canvas, wm+wm+target.width_part, surface.canvas.height-wm-target.hotbar_height);
        instr_hb.canvas.remove();
    },
    kb_down: function(target, key)
    {
        switch (key.code)
        {
            case 'Tab':
                if (target.gvars[0].globalkeys.Shift)
                {
                    if (target.gvars[0].current_instrument.hasOwnProperty('shape'))
                        target.gvars[0].current_instrument.shape =
                            (target.gvars[0].current_instrument.shape === 'round' ? 'square' : 'round');
                }
                else target.show = !target.show;
                break;
            case 'F1': // none
                target.gvars[0].current_instrument.type = 'none';
                break;
            case 'F2': // selection / selection brush
                switch (target.gvars[0].current_instrument.type)
                {
                    case 'selection':
                        target.gvars[0].current_instrument.type = 'selection_brush';
                        break;
                    case 'selection_brush':
                    default:
                        target.gvars[0].current_instrument.type = 'selection';
                        target.gvars[0].current_instrument.scale = target.gvars[0].current_instrument.hasOwnProperty('scale')
                            ? target.gvars[0].current_instrument.scale : 1;
                        target.gvars[0].current_instrument.shape = target.gvars[0].current_instrument.hasOwnProperty('shape')
                            ? target.gvars[0].current_instrument.scale : 'square';
                        break;
                }
                break;
            case 'F3': // brush
            case 'F4': // line
                target.gvars[0].current_instrument.type = (key.code === 'F3' ? 'brush' : 'line');
                target.gvars[0].current_instrument.scale = target.gvars[0].current_instrument.hasOwnProperty('scale')
                    ? target.gvars[0].current_instrument.scale : 1;
                target.gvars[0].current_instrument.shape = target.gvars[0].current_instrument.hasOwnProperty('shape')
                    ? target.gvars[0].current_instrument.scale : 'square';
                break;
            default:
                if (key.code.slice(0, 5) === 'Digit')
                {
                    target.hotbar_slot = Number(key.code[5]);
                    target.gvars[0].current_instrument = target.hotbar[target.hotbar_slot];
                }
                break;
        }
    },
    mouse_move: function(target)
    {
        let mx = target.gvars[0].mx;
        let my = target.gvars[0].my;
        if (target.show)
        {
            let ci = this.mouse_on_cell(target);
            if (ci !== null)
            {
                if (!target.gvars[0].arraysEqual(target.desc_window_id, [0, ci]))
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
                        target.hotbar[target.hotbar_slot] =
                            {
                                type: 'brush',
                                cell: ci,
                                shape: target.gvars[0].current_instrument.hasOwnProperty('shape')
                                    ? target.gvars[0].current_instrument.shape
                                    : 'square',
                                scale: target.gvars[0].current_instrument.hasOwnProperty('scale')
                                    ? target.gvars[0].current_instrument.scale
                                    : 1,
                            };
                        target.gvars[0].current_instrument = target.hotbar[target.hotbar_slot];
                        break;
                }
            }
        }
        if (target.gvars[0].globalkeys.Ctrl)
        {
            switch (buttonid)
            {
                case engine.WHEELDOWN:
                    target.hotbar_slot = engine.wrap(target.hotbar_slot+1, 0, 9);
                    target.gvars[0].current_instrument = target.hotbar[target.hotbar_slot];
                    break;
                case engine.WHEELUP:
                    target.hotbar_slot = engine.wrap(target.hotbar_slot-1, 0, 9);
                    target.gvars[0].current_instrument = target.hotbar[target.hotbar_slot];
                    break;
            }
        }
    },
    mouse_on_cell: function(target)
    {
        let [ds, eb, ws, ons] = [target.display_scale, target.element_border, target.window_spacing,
            target.object_name_size];
        let [hs, wm] = [target.objmenu_heading_size, target.window_margin];
        let mx = target.gvars[0].mx;
        let my = target.gvars[0].my;
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
                if (ci < target.gvars[0].idlist.length && ci >= 0)
                    return ci;
        return null;
    },
    draw_desc_window: function(target, cellid)
    {
        let objdata = target.gvars[0].objdata;
        let idlist = target.gvars[0].idlist;
        let loc = target.gvars[0].loc;
        let get_locstring = target.gvars[0].get_locstring;
        let get_text_width = target.gvars[0].get_text_width;
        let roundRect = target.gvars[0].roundRect;
        idlist = target.gvars[0].idlist;
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
        let objdata = target.gvars[0].objdata;
        let idlist = target.gvars[0].idlist;
        let loc = target.gvars[0].loc;
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
        let roundRect = target.gvars[0].roundRect;
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
                    ctx.imageSmoothingEnabled = false;
                    if (obj.hasOwnProperty('texture') && obj.texture_ready)
                        ctx.drawImage(obj.texture, cx, cy, ds, ds);
                    else
                    {
                        ctx.fillStyle = target.gvars[0].rgb_to_style(...obj.notexture);
                        ctx.fillRect(cx, cy, ds, ds);
                    }

                    let name_string = (obj.localization.hasOwnProperty(loc)
                        ? obj.localization[loc].name
                        : obj.name);

                    engine.draw_text(ctx, cx + (ds/2), cy + ds + (eb/2),
                        target.gvars[0].cut_string(name_string, `${target.object_name_size}px "Source Sans Pro"`, ds),
                        'fill', target.object_name_size, 'center', 'top', 'white', '"Source Sans Pro"');
                    break;
            }
        }

        return ctx;
    },
    draw_instrmenu: function(target)
    {
        let objdata = target.gvars[0].objdata;
        let idlist = target.gvars[0].idlist;
        let get_text_width = target.gvars[0].get_text_width;
        let get_locstring = target.gvars[0].get_locstring;
        let cut_string = target.gvars[0].cut_string;
        let rgb_to_style = target.gvars[0].rgb_to_style;
        let roundRect = target.gvars[0].roundRect;
        let sprites = target.gvars[0].sprites;
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
        let ss = target.show_step;

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

        let textsize = ihsm+(ss*(ihs-ihsm)); //target.instrmenu_heading_size;

        let instr_name_length = get_text_width(get_locstring(`instrument/${target.gvars[0].current_instrument.type}`),
            `italic ${textsize}px "Source Sans Pro"`);

        engine.draw_text(ctx, target.width_part - (ws2+(ss*(ws2-wb))), wb+ws2+(ss*(-wb+ws2)),
            get_locstring(`instrument/${target.gvars[0].current_instrument.type}`),
            'fill', textsize, 'right', 'top', 'white', '"Source Sans Pro"', 'italic');

        let oy = textsize + ws2 + (ss*ws2); // instrument image box offset
        let img_box = ihm - ws + (ss*(ih - 2*ws - oy - ihm + ws)); // size of instrument image box

        let local_ws = Math.round(ws/(2-ss));

        let rounded_image = function(image)
        {
            let ctx1 = document.createElement('canvas').getContext('2d');
            ctx1.canvas.width = img_box;
            ctx1.canvas.height = img_box;
            ctx.fillStyle = 'white';
            roundRect(ctx1, 0, 0, img_box, img_box, 2+(ss*(8-2)));
            let ctx2 = document.createElement('canvas').getContext('2d');
            ctx2.canvas.width = img_box;
            ctx2.canvas.height = img_box;
            ctx2.imageSmoothingEnabled = false;
            ctx2.drawImage(image, 0, 0, img_box, img_box);
            ctx1.globalCompositeOperation = 'source-atop';
            ctx1.drawImage(ctx2.canvas, 0, 0);
            ctx1.globalCompositeOperation = 'source-over';
            ctx2.canvas.remove();
            return ctx1;
        }

        switch (target.gvars[0].current_instrument.type)
        {
            case 'brush':
                let string = get_locstring(`instrument/shape/${target.gvars[0].current_instrument.shape}`)
                    +` [${target.gvars[0].current_instrument.scale}] | `+idlist[target.gvars[0].current_instrument.cell];
                let string_limit = target.width_part-instr_name_length-ws-(ss*ws)-((1-ss)*img_box);
                engine.draw_text(ctx, ws2+(ss*ws2)+((1-ss)*(ihm-ws2)), wb+ws2+(ss*(-wb+ws2)) + Math.round(textsize)/2,
                    cut_string(string, '"Source Sans Pro"', string_limit / 0.8),
                    'fill', textsize*0.8, 'left', 'center', 'white', '"Source Sans Pro"');
                if (target.gvars[0].current_instrument.hasOwnProperty('cell'))
                {
                    let ctx1;
                    let celldata = objdata[idlist[target.gvars[0].current_instrument.cell]];
                    if (celldata.hasOwnProperty('texture') && celldata.texture_ready)
                        ctx1 = rounded_image(celldata.texture);
                    else
                    {
                        let ctx2 = document.createElement('canvas').getContext('2d');
                        ctx2.canvas.width = img_box; ctx2.canvas.height = img_box;
                        ctx2.fillStyle = rgb_to_style(...celldata.notexture);
                        ctx2.fillRect(0, 0, img_box, img_box);
                        ctx1 = rounded_image(ctx2.canvas);
                        ctx2.canvas.remove()
                    }
                    ctx.drawImage(ctx1.canvas, local_ws, local_ws + (ss*oy));
                    ctx1.canvas.remove();
                    ctx.fillStyle = `rgba(0, 0, 0, ${(1-ss)*0.25})`;
                }
                else ctx.fillStyle = 'rgba(102, 102, 102, 0.5)';
                roundRect(ctx, local_ws, local_ws + (ss*oy), img_box, img_box, 2+(ss*(8-2)));
                break;
            case 'paste':
                if (target.gvars[0].current_instrument.hasOwnProperty('pastedata'))
                {
                    let ctx2 = document.createElement('canvas').getContext('2d');
                    ctx2.canvas.width = img_box; ctx2.canvas.height = img_box;
                    let pw = target.gvars[0].current_instrument.pastewidth; let ph = target.gvars[0].current_instrument.pasteheight;
                    let pmax = Math.max(pw, ph);
                    let ps = img_box/pmax;
                    for (let ix=0; ix<pw; ix++)
                    {
                        for (let iy=0; iy<ph; iy++)
                        {
                            if (target.gvars[0].current_instrument.pastedata.hasOwnProperty(iy))
                            {
                                if (target.gvars[0].current_instrument.pastedata[iy].hasOwnProperty(ix))
                                {
                                    let nid = target.gvars[0].current_instrument.pastedata[iy][ix];
                                    if (objdata.hasOwnProperty(nid))
                                    {
                                        if (objdata[nid].hasOwnProperty('texture'))
                                            ctx2.drawImage(objdata[nid].texture, ps*(pmax-pw)/2 + ps*ix,
                                                ps*(pmax-ph)/2 + ps*iy, ps, ps);
                                        else
                                        {
                                            ctx2.fillStyle = rgb_to_style(...objdata[nid].notexture);
                                            ctx2.fillRect(ps*(pmax-pw)/2 + ps*ix, ps*(pmax-ph)/2 + ps*iy, ps, ps);
                                        }
                                    }
                                }
                            }

                        }
                    }
                    let ctx1 = rounded_image(ctx2.canvas);
                    ctx.drawImage(ctx1.canvas, local_ws, local_ws + (ss*oy));
                    ctx1.canvas.remove();
                    ctx2.canvas.remove();
                }
                else
                {
                    ctx.fillStyle = 'rgba(102, 102, 102, 0.5)';
                    roundRect(ctx, local_ws, local_ws + (ss*oy), img_box, img_box, 2+(ss*(8-2)));
                }
                break;
            default:
                ctx.fillStyle = 'rgba(102, 102, 102, 0.5)';
                roundRect(ctx, local_ws, local_ws + (ss*oy), img_box, img_box, 2+(ss*(8-2)));
                break;
        }

        let iip = img_box * (1-target.instrmenu_imgbox_ratio);

        ctx.imageSmoothingEnabled = false;
        if (sprites.instruments.hasOwnProperty(target.gvars[0].current_instrument.type))
        {
            ctx.drawImage(sprites.instruments[target.gvars[0].current_instrument.type],
                local_ws+iip, local_ws+(target.show_step*oy)+iip, img_box-iip-iip, img_box-iip-iip);
        }
        return ctx;
    },
    draw_instrument_hotbar: function(target)
    {
        let objdata = target.gvars[0].objdata;
        let idlist = target.gvars[0].idlist;
        let get_text_width = target.gvars[0].get_text_width;
        let rgb_to_style = target.gvars[0].rgb_to_style;
        let roundRect = target.gvars[0].roundRect;
        let sprites = target.gvars[0].sprites;
        let ctx = document.createElement('canvas').getContext('2d');
        ctx.canvas.width = target.width_part;
        ctx.canvas.height = target.hotbar_height;

        let wb = target.window_border;
        let wb2 = wb/2;

        let ox = 0

        ctx.lineWidth = wb;
        ctx.imageSmoothingEnabled = false;
        for (let i=1; i<=10; i++)
        {
            let mi = i%10;
            ctx.strokeStyle = mi === target.hotbar_slot ? '#7f7f7f' : '#1a1a1a';
            ctx.strokeRect(ox+wb2, wb2, target.hotbar_height-wb, target.hotbar_height-wb);

            let instrument = target.hotbar[mi];

            switch (instrument.type) {
                case 'brush':
                    if (instrument.hasOwnProperty('cell'))
                    {
                        let celldata = objdata[idlist[instrument.cell]];
                        if (celldata.hasOwnProperty('texture') && celldata.texture_ready)
                            ctx.drawImage(celldata.texture,
                                ox+wb, wb, target.hotbar_height-(2*wb), target.hotbar_height-(2*wb));
                        else
                        {
                            ctx.fillStyle = rgb_to_style(...celldata.notexture);
                            ctx.fillRect(ox+wb, wb, target.hotbar_height-(2*wb), target.hotbar_height-(2*wb));
                        }
                    }
                    else
                    {
                        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                        ctx.fillRect(ox+wb, wb, target.hotbar_height-(2*wb), target.hotbar_height-(2*wb));
                    }
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                    switch (instrument.shape)
                    {
                        case 'round':
                            ctx.beginPath();
                            ctx.ellipse(ox + target.hotbar_height / 2, target.hotbar_height / 2,
                                (target.hotbar_height-(4*wb)) / 2, (target.hotbar_height-(4*wb)) / 2,
                                0, 0, 2 * Math.PI);
                            ctx.fill();
                            break;
                        case 'square':
                        default:
                            ctx.fillRect(ox+(2*wb), 2*wb, target.hotbar_height-(4*wb), target.hotbar_height-(4*wb));
                            break;
                    }
                    let textsize = target.hotbar_height-(4*wb);
                    let textwidth = get_text_width('' + instrument.scale, `${textsize}px "Montserrat"`);
                    engine.draw_text(ctx, ox + target.hotbar_height / 2, target.hotbar_height / 2, '' + instrument.scale,
                        'fill', textsize * Math.min(1, textsize / textwidth), 'center', 'center',
                        'rgba(255, 255, 255, 0.5)', '"Montserrat"');
                    break;
                case 'paste':
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                    ctx.fillRect(ox+wb, wb, target.hotbar_height-(2*wb), target.hotbar_height-(2*wb));
                    if (instrument.hasOwnProperty('pastedata'))
                    {
                        let pw = instrument.pastewidth; let ph = instrument.pasteheight;
                        let pmax = Math.max(pw, ph);
                        let ps = (target.hotbar_height-(2*wb))/pmax;
                        for (let ix=0; ix<pw; ix++)
                        {
                            for (let iy=0; iy<ph; iy++)
                            {
                                if (instrument.pastedata.hasOwnProperty(iy))
                                {
                                    if (instrument.pastedata[iy].hasOwnProperty(ix))
                                    {
                                        let nid = instrument.pastedata[iy][ix];
                                        ctx.fillStyle = rgb_to_style(...objdata[nid].notexture);
                                        ctx.fillRect(ox + wb + ps*(pmax-pw)/2 + ps*ix,
                                            wb + ps*(pmax-ph)/2 + ps*iy, ps, ps);
                                    }
                                }

                            }
                        }
                    }
                    break;
                default:
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                    ctx.fillRect(ox+wb, wb, target.hotbar_height-(2*wb), target.hotbar_height-(2*wb));
                    break;
            }

            if (sprites.instruments.hasOwnProperty(instrument.type))
                ctx.drawImage(sprites.instruments[instrument.type],
                    ox+(2*wb), 2*wb, target.hotbar_height-(4*wb), target.hotbar_height-(4*wb));

            engine.draw_text(ctx, ox + target.hotbar_height - Math.round(1.5*wb), Math.round(1.5*wb), `${mi}`,
                'fill', (target.hotbar_height-(2*wb))/2, 'right', 'top', 'rgba(255, 255, 255, 0.5)', '"Montserrat"');

            ox += target.hotbar_height;
        }

        return ctx;
    },
    canvas_resize: function(target, width, height)
    {
        let display = target.gvars[0].display;
        let measure = Math.min(height/target.gvars[0].HEIGHT, width/target.gvars[0].WIDTH);
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
        target.width_part = Math.round((display.cw() - 4*wm)/3); // equal parts of screen's width (currently a third)
        target.objmenu_height = display.ch() - (2*wm); // object menu height
        target.instrmenu_height = display.ch()/3 - (3*wm); // instrument menu height
        target.instrmenu_height_minimized = wb+ws+target.instrmenu_heading_size_minimized;
        target.hotbar_height = target.width_part/10;
        target.element_border = Math.round((target.width_part-(2*ws)-(en*ds))/(en-1));

        target.desc_window_width =  target.desc_window_width_origin * measure;
        target.objmenu_surface = this.draw_objmenu(target);
    },
});

module.exports = {EntFieldSUI};