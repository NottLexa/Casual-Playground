const engine = require("../../nle.cjs");

const EntMMIntro = new engine.Entity({
    create: function(target, gvars)
    {
        target.gvars = gvars;
        /*target.icon2 = new Image();
        target.icon2.src = 'https://www.gnu.org/graphics/gplv3-or-later-sm.png';*/
        target.time = 0.0;

        target.licence_text_size_origin = 12;
        target.licence_text_size = target.licence_text_size_origin;

        target.name_text_size_origin = 100;
        target.name_text_size = target.name_text_size_origin;

        target.author_text_size_origin = 60;
        target.author_text_size = target.author_text_size_origin;
    },
    room_start: function(target)
    {
        target.show_title = true;
    },
    step: function(target)
    {
        target.time += target.gvars[0].deltatime;
    },
    draw_after: function(target, surface)
    {
        let moment_func = (start, end) => engine.range2range(engine.clamp(target.time, start, end), start, end, 0, 1);

        let moment2 = Math.pow(Math.cos(moment_func(4,4.5)/2*Math.PI), 2/3);
        let moment3 = 1-Math.pow(Math.sin(moment_func(4.5,5)/2*Math.PI), 2/3);
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
        let moment4 = Math.pow(Math.sin(moment_func(4,5)*Math.PI/2), 2/3);
        if (target.show_title)
            engine.draw_text(surface, surface.canvas.width/2, surface.canvas.height*((2-moment4)/4),
                'Casual Playground', 'fill', target.name_text_size, 'center', 'center', `rgba(255, 255, 255, 1)`,
                '"Montserrat", serif');
        engine.draw_text(surface, surface.canvas.width/2, surface.canvas.height/2 + target.author_text_size*1.5,
            'by NotLexa', 'fill', target.author_text_size, 'center', 'top', `rgba(255, 255, 255, ${moment1})`,
            '"Montserrat", serif');

        let draw_copyright = function (txt, y)
        {
            engine.draw_text(surface, surface.canvas.width/2, surface.canvas.height - y,
                txt, 'fill', target.licence_text_size, 'center', 'bottom',
                `rgba(255, 255, 255, ${moment1})`, '"Montserrat", sans-serif');
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
        let measure = Math.min(height/target.gvars[0].HEIGHT, width/target.gvars[0].WIDTH);
        target.licence_text_size = target.licence_text_size_origin * measure;
        target.name_text_size = target.name_text_size_origin * measure;
        target.author_text_size = target.author_text_size_origin * measure;
    }
});

module.exports = {EntMMIntro};