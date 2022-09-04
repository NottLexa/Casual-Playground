nw.Window.open
(
    'play.html',
    {
        frame: false,
        show: false,
        min_width: 16*30,
        min_height: 9*30,
    },
    function (win)
    {
        //win.resizeTo(window.width, window.height);
        // Release the 'win' object here after the new window is closed.
        win.on(
            'closed',
            function()
            {
                win = null;
            }
        );

        // Listen to main window's close event
        nw.Window.get().on(
            'close',
            function ()
            {
                // Hide the window to give user the feeling of closing immediately
                this.hide();

                // If the new window is still open then close it.
                if (win !== null) {
                    win.close(true);
                }

                // After closing the new window, close the main window.
                this.close(true);
            }
        );
    }
);