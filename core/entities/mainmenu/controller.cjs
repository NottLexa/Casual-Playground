const engine = require("../../nle.cjs");
const EntMMButton = require("./button.cjs").EntMMButton;

const EntMMController = new engine.Entity({
    create: function(target, gvars)
    {
        target.gvars = gvars;
        let display = target.gvars[0].display;
        // target.time = 0;
        // target.time_paused = false;
        let create_button = function(width, height, text, x_offset, y_offset, trigger)
        {
            let bttn = EntMMButton.create_instance(target.gvars);
            bttn.box_width = width;
            bttn.box_height = height;
            bttn.text = target.gvars[0].get_locstring(text);
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
                target.gvars[0].mm_startmenu.show = true;
                target.play_button.offset_animate = false;
                target.exit_button.offset_animate = false;
                target.play_button.offset_x = -display.cw()/2 - target.play_button.box_width
                    - target.play_button.triangle_width;
                target.exit_button.offset_x = -display.cw()/2 - target.exit_button.box_width
                    - target.exit_button.triangle_width;
                target.time = 4;
                target.time_paused = true;
                target.gvars[0].mm_intro.show_title = false;
            }
        );
        if (target.gvars[0].platform === 'NODE')
            target.exit_button = create_button(target.exit_button_width, target.exit_button_height, 'mm/exit_button', 0,
                target.exit_button_yoffset, ()=>{nw.Window.get().close()}
            );
        else
            target.exit_button = create_button(target.exit_button_width, target.exit_button_height, 'mm/exit_button', 0,
                target.exit_button_yoffset+10000, ()=>{});
    },
    step: function(target)
    {
        let deltatime = target.gvars[0].deltatime;
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
        target.time = prev_room === target.gvars[0].room_field ? 5 : 0;
        target.time_paused = false;
    },
    canvas_resize: function(target, width, height)
    {
        let measure = Math.min(height/target.gvars[0].HEIGHT, width/target.gvars[0].WIDTH);

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

module.exports = {EntMMController};