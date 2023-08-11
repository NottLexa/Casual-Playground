const engine = require("../../nle.cjs");

const EntMMBG = new engine.Entity({
    create: function(target, gvars)
    {
        target.gvars = gvars;
        target.ox = 0;
        target.oy = 0;
        target.angle = Math.random()*360;
        target.speed = 64;
        target.colors = target.gvars[0].idlist.map(value => target.gvars[0].objdata[value].notexture);
        target.matrix = Array(100).fill().map(()=>
            Array(100).fill().map(()=>
                target.colors[Math.floor(Math.random()*target.colors.length)]
            )
        );
        target.controls_strings = [target.gvars[0].get_locstring('mm/controls/heading'),
            ...[...Array(8).keys()].map(val => target.gvars[0].get_locstring('mm/controls/'+(val+1)))];
        target.controls_keys = [null, 'WASD', 'QE', 'RT', 'Space', 'C', 'Tab', 'LMB', 'Esc'];

        target.controls_text_size_origin = 32;
        target.controls_text_size = target.controls_text_size_origin;

        target.controls_padding_origin = 16;
        target.controls_padding = target.controls_padding_origin;
    },
    step: function(target)
    {
        let deltatime = target.gvars[0].deltatime;
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
            this.draw_board(target, target.ox, target.oy,
                surface.canvas.width, surface.canvas.height, target.matrix, 0, 0).canvas,
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
        let measure = Math.min(height/target.gvars[0].HEIGHT, width/target.gvars[0].WIDTH);
        target.controls_text_size = target.controls_text_size_origin * measure;
        target.controls_padding = target.controls_padding_origin * measure;
    },
    draw_board: function(target, x, y, width, height, matrix)
    {
        let bordersize = 8;
        let cellsize = 32;
        let fullsize = cellsize+bordersize;
        let ox = engine.wrap(x, 0, fullsize);
        let oy = engine.wrap(y, 0, fullsize);
        let surface = document.createElement('canvas').getContext('2d');
        surface.canvas.width = width;
        surface.canvas.height = height;
        surface.fillStyle = target.gvars[0].rgb_to_style(...target.gvars[0].linecolor_infield);
        surface.fillRect(0, 0, surface.canvas.width, surface.canvas.height);
        let ix = engine.wrap(Math.floor(-x/fullsize), 0, matrix[0].length);
        for (let mx = ox-fullsize; mx < width; mx += fullsize)
        {
            let iy = engine.wrap(Math.floor(-y/fullsize), 0, matrix.length);
            for (let my = oy-fullsize; my < height; my += fullsize)
            {
                surface.fillStyle = target.gvars[0].rgb_to_style(...matrix[iy][ix]);
                surface.fillRect(mx+bordersize, my+bordersize, cellsize, cellsize);
                iy = engine.wrap(iy+1, 0, matrix.length);
            }
            ix = engine.wrap(ix+1, 0, matrix[0].length);
        }
        return surface;
    },
});

module.exports = {EntMMBG};