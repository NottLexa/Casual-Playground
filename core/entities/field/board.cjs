const engine = require("../../nle.cjs");
const comp = require('../../compiler.cjs');
const ctt = require('../../compiler_task_types.cjs');

const EntFieldBoard = new engine.Entity({
    create: function(target, gvars)
    {
        target.gvars = gvars;
        // target.cameraspeed = Math.round(Math.log2(Math.pow(2, 9)*scale/100));
        target.mincamspeed = Math.round(Math.log2(Math.pow(2, 6)*target.gvars[0].scale/100));
        target.maxcamspeed = Math.round(Math.log2(Math.pow(2, 14)*target.gvars[0].scale/100));
        // target.hsp = 0;
        // target.vsp = 0;
        target.acceleration = 8;
        target.zoomspeed = 1;

        target.get_tpt = (n) => ((n%9 !== 0)
            ? ((10**(Math.floor(n/9)))*(n%9))
            : 10**((Math.floor(n/9))-1)*9) / 1000;
        target.tpt_min = 1;
        target.tpt_max = 60;

        target.text_size_default_origin = target.gvars[0].fontsize_default;
        target.text_size_default = target.text_size_default_origin;
        target.text_size_small_origin = target.gvars[0].fontsize_small;
        target.text_size_small = target.text_size_small_origin;

        target.history = [];
        target.history.pointer = -1;
        target.history.add_record = function(record)
        {
            target.history.pointer = Math.min(target.history.pointer+1, target.gvars[0].history_max_length-1);
            target.history.splice(target.history.pointer, target.history.length, record);
            for (let i=0;i<(target.history.length-target.gvars[0].history_max_length); i++) target.history.shift();
        };

        // See other initiations in room_start
    },
    room_start: function(target)
    {
        target.board_width = target.gvars[0].board_width;
        target.board_height = target.gvars[0].board_height;

        target.viewscale_origin = 16;
        target.viewscale = target.viewscale_origin;

        this.board_center_view(target);
        target.cameraspeed = Math.round(Math.log2(Math.pow(2, 9)*target.gvars[0].scale/100));
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
                    target.gvars[0].idlist.indexOf(target.gvars[0].cell_fill_on_init),
                    target.board,
                    target.gvars,
                );
                target.board[target.board.length-1].push(celldata);
            }
        }
        target.selection = [];
        for (let i=0; i<target.board_height; i++) target.selection.push(new engine.Bitarray());
        target.selection[0].set(0, 1); target.selection[0].set(2, 1); target.selection[0].set(4, 1);
        target.linecolor_infield = target.gvars[0].linecolor_infield;
        target.linecolor_outfield = target.gvars[0].linecolor_outfield;
        target.cells_to_redraw = [];
        target.surfaces = {board: target.gvars[0].document.createElement('canvas').getContext('2d'),
            grid: target.gvars[0].document.createElement('canvas').getContext('2d'),
            selection: target.gvars[0].document.createElement('canvas').getContext('2d')};
        target.surfaces.board.canvas.style.imageRendering = 'pixelated';
        target.surfaces.grid.canvas.style.imageRendering  = 'pixelated';
        target.surfaces.selection.canvas.style.imageRendering  = 'pixelated';
        target.gvars[0].update_board_fully = true;
        this.draw_board(target);

        target.time = 0.0;
        target.tpt_power = 28;
        target.timepertick = 1.0;
        target.time_paused = false;
        target.time_elapsed = 0.0;

        target.board_step_executed = false;
        target.board_step_finished = false;
        target.board_tasks_executed = false;

        target.history.splice(0,target.history.length);
        target.history.pointer = -1;
    },
    step: function(target)
    {
        let deltatime = target.gvars[0].deltatime;
        let globalkeys = target.gvars[0].globalkeys;
        if (!globalkeys.Shift && globalkeys.Equal) this.board_zoom_in(target, target.zoomspeed*deltatime);
        if (!globalkeys.Shift && globalkeys.Minus) this.board_zoom_out(target, target.zoomspeed*deltatime);

        let limitspeed = 2**target.cameraspeed;
        let acc = limitspeed*target.acceleration;

        let right = 0, left = 0, down = 0, up = 0;

        if (!(globalkeys.Ctrl || globalkeys.Alt || globalkeys.Shift))
        {
            right = ~~(globalkeys.ArrowRight||globalkeys.KeyD);
            left = ~~(globalkeys.ArrowLeft||globalkeys.KeyA);
            down = ~~(globalkeys.ArrowDown||globalkeys.KeyS);
            up = ~~(globalkeys.ArrowUp||globalkeys.KeyW);
        }

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

        if (target.gvars[0].globalkeys.LMB && !target.gvars[0].field_sui.show) this.board_do_instrument(target);

        if (!target.time_paused) target.time += deltatime;
        if (target.time > target.timepertick)//&&(!target.board_tasks_executed)&&(!target.board_step_executed))
        {
            while (target.board_step_executed) {}
            target.board_step_executed = true;
            /*let promise = new Promise(((resolve, reject) => {
                this.board_step(target);
                target.board_step_executed = false;
            }));
            target.board_step_finished = true;*/
            (async function async_step(board_step_func){
                while (target.board_tasks_executed) {}
                board_step_func(target);
                target.board_step_executed = false;
                target.board_step_finished = true;
            })(this.board_step);
        }
    },
    step_after: function(target)
    {
        if (target.time > target.timepertick)//&&(!target.board_tasks_executed)&&(!target.board_step_executed)&&(target.board_step_finished))
        {
            target.time = 0;
            while (target.board_tasks_executed) {}
            target.board_tasks_executed = true;
            (async function async_tasks(board_tasks_func){
                while (!target.board_step_finished) {}
                board_tasks_func(target);
                target.board_tasks_executed = false;
                target.board_step_finished = false;
            })(this.board_tasks);
            /*let promise = new Promise(((resolve, reject) => {
                this.board_tasks(target);
                target.board_tasks_executed = false;
                target.board_step_finished = false;
            }));*/
        }
        if (target.gvars[0].update_board || target.gvars[0].update_board_fully) this.draw_board(target);
        if (target.gvars[0].update_selection) this.draw_selection(target);
    },
    draw: function(target, surface)
    {
        let bordersize = Math.floor(target.viewscale * target.gvars[0].cellbordersize);
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
        surface.drawImage(target.surfaces.grid.canvas, realx, realy);
        surface.drawImage(target.surfaces.selection.canvas, realx, realy);

        let linex, liney, startx, starty, endx, endy;
        surface.fillStyle = target.gvars[0].rgb_to_style(...target.linecolor_outfield);

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
        let clr = target.time_elapsed <= target.timepertick ? 'white' : target.gvars[0].rgb_to_style(17*14, 17, 17);
        engine.draw_text(surface,
            5, -10 + surface.canvas.height - target.text_size_default - 2*target.text_size_small,
            `${Math.round(target.time_elapsed*100000)/100000} s`,
            'fill', target.text_size_small, 'left', 'top', clr, '"DejaVu Sans Mono"');
        engine.draw_text(surface,
            5, -10 + surface.canvas.height - target.text_size_default - target.text_size_small,
            `${Math.round(target.time_elapsed/(target.board_width*target.board_height)*100000)/100000} s/cell`,
            'fill', target.text_size_small, 'left', 'top', clr, '"DejaVu Sans Mono"');
    },
    kb_down: function(target, key)
    {
        let globalkeys = target.gvars[0].globalkeys;
        switch (key.code)
        {
            case 'KeyQ':
                target.cameraspeed = engine.clamp(target.cameraspeed-1, target.mincamspeed, target.maxcamspeed);
                break;
            case 'KeyE':
                target.cameraspeed = engine.clamp(target.cameraspeed+1, target.mincamspeed, target.maxcamspeed);
                break;
            case 'KeyC':
                if (!globalkeys.Ctrl && !globalkeys.Shift && !globalkeys.Alt)
                {
                    this.board_center_view(target);
                    target.hsp = 0;
                    target.vsp = 0;
                }
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
                target.gvars[0].current_room.do_end();
                target.gvars[0].current_room = target.gvars[0].room_mainmenu;
                target.gvars[0].current_room.do_start();
                break;
            case 'Equal':
                if (globalkeys.Shift) current_instrument.scale++;
                break;
            case 'Minus':
                if (globalkeys.Shift)
                    current_instrument.scale = Math.max(current_instrument.scale-1, 1);
                break;
            case 'KeyZ':
                if (globalkeys.Ctrl)
                {
                    if (globalkeys.Shift) // redo
                    {
                        if (target.history.pointer < target.history.length-1)
                        {
                            let record = target.history[++target.history.pointer];
                            for (let action of record)
                            {
                                switch (action.type)
                                {
                                    case "cell_changed":
                                        target.board[action.y][action.x].reset(action.new);
                                        target.cells_to_redraw.push([action.x, action.y]);
                                        target.gvars[0].update_board = true;
                                        break;
                                }
                            }
                            target.gvars[0].logger.push([
                                comp.LoggerClass.INFO,
                                new Date(),
                                'Redo.',
                            ]);
                        }
                    }
                    else // undo
                    {
                        if (target.history.pointer > -1)
                        {
                            let record = target.history[target.history.pointer--];
                            for (let action of record)
                            {
                                switch (action.type)
                                {
                                    case "cell_changed":
                                        target.board[action.y][action.x].reset(action.old);
                                        target.cells_to_redraw.push([action.x, action.y]);
                                        target.gvars[0].update_board = true;
                                        break;
                                }
                            }
                            target.gvars[0].logger.push([
                                comp.LoggerClass.INFO,
                                new Date(),
                                'Undo.',
                            ]);
                        }
                    }
                }
                break;
        }
    },
    mouse_up: function(target, mb)
    {
        if (target.gvars[0].globalkeys.LMB && !target.gvars[0].field_sui.show) this.board_do_instrument_end(target);
    },
    mouse_down: function(target, mb)
    {
        let globalkeys = target.gvars[0].globalkeys;
        let current_instrument = target.gvars[0].current_instrument;
        if (!target.gvars[0].field_sui.show)
        {
            let setkey = true;
            switch (mb)
            {
                case engine.WHEELUP:
                    if (globalkeys.Shift && current_instrument.hasOwnProperty('scale'))
                        current_instrument.scale++;
                    else if (!(globalkeys.Ctrl || globalkeys.Shift || globalkeys.Alt))
                        this.board_zoom_in(target, 1);
                    break;
                case engine.WHEELDOWN:
                    if (globalkeys.Shift && current_instrument.hasOwnProperty('scale'))
                        current_instrument.scale = Math.max(current_instrument.scale-1, 1);
                    else if (!(globalkeys.Ctrl || globalkeys.Shift || globalkeys.Alt))
                        this.board_zoom_out(target, 1);
                    break;
            }
        }
        if (target.gvars[0].globalkeys.LMB && !target.gvars[0].field_sui.show) this.board_do_instrument_start(target);
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
                        `Runtime error for cell (${x}, ${y}) with CellID #${idlist[target.board[y][x].cellid]}`,
                        `CasualPlayground Compiler encountered an error: ${concl.code}`,
                        err.name, err.message,
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
        let history_record = [];
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
                            history_record.push({type: "cell_changed", old: target.board[_y][_x].cellid,
                                new: _cellid, x: _x, y: _y});
                            target.board[_y][_x].reset(_cellid);
                            target.cells_to_redraw.push([_x, _y]);
                            target.gvars[0].update_board = true;
                            break;
                    }
                    taskcount++;
                }
                target.board[y][x].tasks = [];
            }
        }
        if (history_record.length > 0) target.history.add_record(history_record);
    },
    draw_board: function(target)
    {
        let bw = target.board_width;
        let bh = target.board_height;
        let bordersize = Math.floor(target.viewscale * target.gvars[0].cellbordersize);
        let cellsize = target.viewscale+bordersize;
        let surface_board = target.surfaces.board;
        let surface_grid = target.surfaces.grid;
        let surface_selection = target.surfaces.selection;
        let update_cell = function(ix, iy)
        {
            surface_board.imageSmoothingEnabled = false;
            surface_grid.imageSmoothingEnabled = false;
            let cx = (ix*cellsize)+bordersize;
            let cy = (iy*cellsize)+bordersize;
            let celldata = target.board[iy][ix].code;
            surface_board.fillStyle = target.gvars[0].rgb_to_style(...target.linecolor_infield);
            surface_board.fillRect(cx-bordersize/2, cy-bordersize/2, cellsize, cellsize);
            if (celldata.hasOwnProperty('texture') && celldata.texture_ready)
            {
                surface_board.drawImage(celldata.texture, cx, cy, target.viewscale, target.viewscale);
            }
            else
            {
                surface_board.fillStyle = target.gvars[0].rgb_to_style(...celldata.notexture);
                //surface.fillStyle = rgb_to_style(109, 183, 65);
                surface_board.fillRect(cx, cy, target.viewscale, target.viewscale);
            }
        }
        if (target.gvars[0].update_board_fully)
        {
            surface_board.canvas.width = (cellsize*bw)+bordersize;
            surface_board.canvas.height = (cellsize*bh)+bordersize;
            for (let ix = 0; ix < bw; ix++) for (let iy = 0; iy < bh; iy++) update_cell(ix, iy);

            surface_grid.canvas.width = (cellsize*bw)+bordersize;
            surface_grid.canvas.height = (cellsize*bh)+bordersize;
            surface_grid.clearRect(0, 0, surface_grid.canvas.width, surface_grid.canvas.height);
            surface_grid.fillStyle = target.gvars[0].rgb_to_style(...target.linecolor_infield);
            for (let ix = 0; ix <= bw; ix++)
                surface_grid.fillRect(ix*cellsize, 0, bordersize, surface_grid.canvas.height);
            for (let iy = 0; iy <= bh; iy++)
                surface_grid.fillRect(0, iy*cellsize, surface_grid.canvas.width, bordersize);

            surface_selection.imageSmoothingEnabled = false;
            surface_selection.canvas.width = (cellsize*bw)+bordersize;
            surface_selection.canvas.height = (cellsize*bh)+bordersize;
            this.draw_selection(target);
        }
        else
        {
            for (let coord of target.cells_to_redraw) update_cell(...coord);
        }
        target.cells_to_redraw = [];
        target.gvars[0].update_board = false;
        target.gvars[0].update_board_fully = false;
    },
    draw_selection: function(target)
    {
        let bw = target.board_width;
        let bh = target.board_height;
        let bordersize = Math.floor(target.viewscale * target.gvars[0].cellbordersize);
        let cellsize = target.viewscale+bordersize;
        let surface_selection = target.surfaces.selection;
        surface_selection.clearRect(0,0,surface_selection.canvas.width,surface_selection.canvas.height);
        let color = target.gvars[0].selection_color;
        surface_selection.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.3)`;
        for (let ix = 0; ix < bw; ix++)
        {
            for (let iy = 0; iy < bh; iy++)
            {
                if (target.selection[iy].get(ix))
                {
                    let cx = (ix*cellsize)+bordersize;
                    let cy = (iy*cellsize)+bordersize;
                    surface_selection.fillRect(cx, cy, target.viewscale, target.viewscale);
                }
            }
        }
        update_selection = false;
    },
    board_center_view: function(target)
    {
        let [x, y] = this.board_get_center(target);
        target.viewx = x;
        target.viewy = y;
    },
    board_zoom_in: function(target, mul)
    {
        let mx = target.gvars[0].mx;
        let my = target.gvars[0].my;
        let oldvs = target.viewscale;
        target.viewscale = Math.floor(engine.clamp(
            target.viewscale + engine.clamp(Math.floor(0.2 * mul * target.viewscale), 1, 64),
            2, 64));
        let newvs = target.viewscale;
        let ratio = newvs/oldvs;

        target.viewx = ((target.viewx+mx) * ratio) - mx;
        target.viewy = ((target.viewy+my) * ratio) - my;

        target.gvars[0].update_board_fully = true;
        this.draw_board(target);
    },
    board_zoom_out: function(target, mul)
    {
        let mx = target.gvars[0].mx;
        let my = target.gvars[0].my;
        let oldvs = target.viewscale;
        target.viewscale = Math.floor(engine.clamp(
            target.viewscale - engine.clamp(Math.floor(0.2 * mul * target.viewscale), 1, 64),
            2, 64));
        let newvs = target.viewscale;
        let ratio = newvs/oldvs;

        target.viewx = ((target.viewx+mx) * ratio) - mx;
        target.viewy = ((target.viewy+my) * ratio) - my;

        target.gvars[0].update_board_fully = true;
        this.draw_board(target);
    },
    board_get_center: function(target)
    {
        let display = target.gvars[0].display;
        let cellsize = target.viewscale * (target.gvars[0].cellbordersize+1);
        let w = cellsize*target.board_width + (target.viewscale * target.gvars[0].cellbordersize);
        let h = cellsize*target.board_height + (target.viewscale * target.gvars[0].cellbordersize);
        return [(w-display.cw())/2, (h-display.ch())/2];
    },
    board_do_instrument: function(target)
    {
        let current_instrument = target.gvars[0].current_instrument;
        let bordersize = Math.floor(target.viewscale*target.gvars[0].cellbordersize);
        let cellsize = bordersize + target.viewscale;
        let rx = target.gvars[0].mx + target.viewx - bordersize;
        let ry = target.gvars[0].my + target.viewy - bordersize;
        let cx = Math.floor(rx/cellsize);
        let cy = Math.floor(ry/cellsize);
        let maxcx = target.board_width;
        let maxcy = target.board_height;
        let history_record = [];
        let commands = {
            "selection_brush": (ix,iy)=>{target.selection[iy].set(ix, 1); update_selection = true},
            "brush": (ix,iy)=>{
                if (current_instrument.hasOwnProperty('cell') && current_instrument.cell !== target.board[iy][ix].cellid)
                {
                    history_record.push({type: "cell_changed", old: target.board[iy][ix].cellid,
                        new: current_instrument.cell, x: ix, y: iy});
                    target.board[iy][ix].reset(current_instrument.cell);
                    target.cells_to_redraw.push([ix, iy]);
                }
            },
        };
        switch (current_instrument.type)
        {
            case 'brush':
            case 'selection_brush':
                scale = current_instrument.scale-1;
                if (((rx % cellsize) < target.viewscale) && ((ry % cellsize) < target.viewscale))
                {
                    for (let ix = cx-scale; ix < cx+scale+1; ix++)
                    {
                        for (let iy = cy-scale; iy < cy+scale+1; iy++)
                        {
                            if ((0 <= ix) && (ix < maxcx) && (0 <= iy) && (iy < maxcy))
                            {
                                let command = commands[current_instrument.type];
                                if (current_instrument.shape === 'round')
                                {
                                    let dx = ix-cx;
                                    let dy = iy-cy;
                                    if (Math.round(Math.sqrt(dx*dx + dy*dy)) <= scale) command(ix,iy);
                                } else command(ix,iy);
                            }
                        }
                    }
                    this.draw_board(target);
                }
                break;
        }
        if (history_record.length > 0) target.history.add_record(history_record);
    },
    board_do_instrument_start: function(target)
    {
        let current_instrument = target.gvars[0].current_instrument;
        let bordersize = Math.floor(target.viewscale*target.gvars[0].cellbordersize);
        let cellsize = bordersize + target.viewscale;
        let rx = target.gvars[0].mx + target.viewx - bordersize;
        let ry = target.gvars[0].my + target.viewy - bordersize;
        let cx = Math.floor(rx/cellsize);
        let cy = Math.floor(ry/cellsize);
        let maxcx = target.board_width;
        let maxcy = target.board_height;
        let commands = {
            "paste": (ox,oy)=>{
                if (current_instrument.hasOwnProperty('pastedata'))
                {
                    let pw = current_instrument.pastewidth;
                    let ph = current_instrument.pasteheight;
                    let hx = Math.floor(pw/2); let hy = Math.floor(ph/2);
                    for (let ix=0; ix<pw; ix++)
                    {
                        for (let iy=0; iy<ph; iy++)
                        {
                            let jx = ox+ix-hx;
                            let jy = oy+iy-hy;
                            if ((0 <= jx) && (jx < maxcx) && (0 <= jy) && (jy < maxcy))
                            {
                                if (current_instrument.pastedata.hasOwnProperty(iy))
                                {
                                    if (current_instrument.pastedata[iy].hasOwnProperty(ix))
                                    {
                                        let cellid = target.gvars[0].idlist.indexOf(current_instrument.pastedata[iy][ix]);
                                        target.board[jy][jx].reset(cellid);
                                        target.cells_to_redraw.push([jx, jy]);
                                    }
                                }
                            }
                        }
                    }
                }
            },
        };
        switch (current_instrument.type)
        {
            case 'paste':
                if (((rx % cellsize) < target.viewscale) && ((ry % cellsize) < target.viewscale))
                {
                    let command = commands[current_instrument.type];
                    command(cx,cy);
                    this.draw_board(target);
                }
        }
    },
    board_do_instrument_end: function(target)
    {
        // placeholder
    },
    canvas_resize: function(target, width, height)
    {
        let measure = Math.min(height/target.gvars[0].HEIGHT, width/target.gvars[0].WIDTH);
        target.viewscale = target.viewscale_origin * measure;
        target.text_size_default = target.text_size_default_origin * measure;
        target.text_size_small = target.text_size_small_origin * measure;

        target.gvars[0].update_board_fully = true;
    },
});

module.exports = {EntFieldBoard};