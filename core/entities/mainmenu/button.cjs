const engine = require("../../nle.cjs");

const EntMMButton = new engine.Entity({
    create: function(target, gvars)
    {
        target.gvars = gvars;
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
        let mx = target.gvars[0].mx;
        let my = target.gvars[0].my;
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

module.exports = {EntMMButton};