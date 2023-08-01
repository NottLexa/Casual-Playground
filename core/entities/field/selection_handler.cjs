const engine = require("../../nle.cjs");
const comp = require('../../compiler.cjs');
const clippar = require('../../clipboard_parser.cjs');

const EntFieldSH = new engine.Entity({
    create: function(target, gvars)
    {
        target.gvars = gvars;
    },
    kb_down: function(target, key)
    {
        let globalkeys = target.gvars[0].globalkeys;
        let fieldboard = target.gvars[0].field_board;
        let idlist = target.gvars[0].idlist;
        let objdata = target.gvars[0].objdata;
        let logger = target.gvars[0].logger;
        switch (key.code)
        {
            case 'KeyC':
                if (globalkeys.Ctrl && !globalkeys.Shift && !globalkeys.Alt)
                {
                    let ret = clippar.copy(fieldboard.board, fieldboard.selection, idlist);
                    if (ret !== null) navigator.clipboard.writeText(ret[0]);
                    console.log(ret[1]);
                    target.gvars[0].logger.push([comp.LoggerClass.INFO, new Date(), ret[1]]);
                }
                break;
            case 'KeyV':
                if (globalkeys.Ctrl && !globalkeys.Shift && !globalkeys.Alt)
                {
                    target.gvars[0].current_instrument.type = 'paste';
                    navigator.clipboard.readText().then((clipboardtext)=>{
                        let ret = clippar.paste(clipboardtext, objdata);
                        for (let k in ret[0]) target.gvars[0].current_instrument[k] = ret[0][k];
                        console.log(ret[1]);
                        logger.push([comp.LoggerClass.INFO, new Date(), ret[1]]);
                    });
                }
                break;
            case 'KeyS':
                if (globalkeys.Ctrl)
                {
                    let ret = engine.save(
                        engine.create_text_blob(clippar.copy(fieldboard.board, fieldboard.selection, idlist)[0]),
                        'untitled.cpd');
                    console.log(ret);
                    logger.push([comp.LoggerClass.INFO, new Date(), ret]);
                }
                break;
            case 'KeyO':
                if (globalkeys.Ctrl)
                {
                    let input = document.createElement('input');
                    input.type = 'file';
                    input.multiple = false;
                    input.addEventListener('change', ()=>{
                        let reader = new FileReader();
                        reader.addEventListener('load', ()=>{
                            target.gvars[0].current_instrument.type = 'paste';
                            let ret = clippar.paste(reader.result, objdata);
                            for (let k in ret[0]) target.gvars[0].current_instrument[k] = ret[0][k];
                            console.log('Successfully opened area!');
                            logger.push([comp.LoggerClass.INFO, new Date(), 'Successfully opened area!']);
                        });
                        reader.readAsText(input.files[0]);
                        input.remove();
                    });
                    input.click();
                }
                break;
        }
    },
});

module.exports = {EntFieldSH};