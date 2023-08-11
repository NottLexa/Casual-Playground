const engine = require("../../nle.cjs");
const comp = require('../../compiler.cjs');

const lead0 = function(number, targetlength)
{
    number = number.toString();
    while (number.length < targetlength) number = "0" + number;
    return number;
}

const EntGlobalConsole = new engine.Entity({
    create: function(target, gvars)
    {
        target.gvars = gvars;
        target.log = [];
        target.logger_i = 0;
        target.showtimes = [];
        target.max_showtime = 7.0;
        target.fade_at_showtime = 2.0;
        target.showtimes_start_at = 0;

        target.fps_size_origin = target.gvars[0].fontsize_default/6;
        target.fps_size = target.fps_size_origin;

        target.log_size_origin = target.gvars[0].fontsize_default/6;
        target.log_size = target.log_size_origin;

        target.padding_size_origin = 2;
        target.padding_size = target.padding_size_origin;

        target.fps_records_number = 100;
        target.fps_records = new Array(target.fps_records_number).fill(0);
        target.fps_records_index = 0;
    },
    step: function (target)
    {
        let deltatime = target.gvars[0].deltatime;
        for (let i = target.showtimes_start_at; i<target.showtimes.length; i++)
        {
            target.showtimes[i] = Math.max(target.showtimes[i]-deltatime, 0.0);
            if (target.showtimes[i] === 0.0)
            {
                target.showtimes_start_at++;
            }
        }

        while (target.logger_i < target.gvars[0].logger.length)
        {
            let log = target.gvars[0].logger[target.logger_i];
            let type_string = comp.LoggerClass.types[log[0]];//'ERROR';
            let h = log[1].getHours();
            let m = log[1].getMinutes();
            let s = log[1].getSeconds();
            let time_string = lead0(h, 2) + ':' + lead0(m, 2) + ':' + lead0(s, 2);
            let prefix = `[${type_string} ${time_string}]` + ' ';
            let prefix_l = prefix.length;
            //process.stdout.write(prefix + log[2]);
            global.console.log(prefix + log[2]);
            target.log.push(prefix + log[2]);
            target.showtimes.push(target.max_showtime);
            for (let line of log.slice(3))
            {
                //process.stdout.write(' '.repeat(prefix_l) + line);
                global.console.log(' '.repeat(prefix_l) + line);
                target.log.push(' '.repeat(prefix_l) + line);
                target.showtimes.push(target.max_showtime);
            }
            target.logger_i++;
        }

        target.fps_records[target.fps_records_index] = (deltatime !== 0) ? Math.round(1/deltatime) : 0;
        target.fps_records_index = (target.fps_records_index+1) % target.fps_records_number;
    },
    draw_after: function (target, surface)
    {
        engine.draw_text(surface, surface.canvas.width-target.padding_size, target.padding_size,
            `${Math.round(target.fps_records.reduce((s, a)=> s + a, 0) / target.fps_records_number)} FPS`,
            'fill', target.fps_size, 'right', 'top', 'white', '"DejaVu Sans Mono"');

        for (let i = target.showtimes_start_at; i < target.log.length; i++)
        {
            let si = i - target.showtimes_start_at;
            let alpha = Math.min(1.0, target.showtimes[i]/target.fade_at_showtime);
            let color = `rgba(255, 255, 255, ${alpha})`;
            engine.draw_text(surface, target.padding_size,
                surface.canvas.height-100+((i-target.log.length)*target.log_size),
                target.log[i], 'fill', target.log_size, 'left', 'bottom', color, '"DejaVu Sans Mono"');
        }

        if (!target.gvars[0].has_focus)
            engine.draw_text(surface, target.padding_size, surface.canvas.height-100, 'Window is not focused', 'fill',
                target.log_size, 'left', 'bottom', 'rgba(255, 50, 50, 0.6)', '"DejaVu Sans Mono"');
    },
    canvas_resize: function(target, width, height)
    {
        let measure = Math.min(height/150, width/300);
        target.fps_size = target.fps_size_origin * measure;
        target.padding_size = target.padding_size_origin * measure;
        target.log_size = target.log_size_origin * measure;
    },
});

module.exports = {EntGlobalConsole};