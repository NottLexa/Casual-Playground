/*
    Copyright © 2023 Alexey Kozhanov

    =====

    This file is part of Casual Playground.

    Casual Playground is free software: you can redistribute it and/or modify it under
the terms of the GNU General Public License as published by the Free Software Foundation,
either version 3 of the License, or (at your option) any later version.

    Casual Playground is distributed in the hope that it will be useful, but WITHOUT ANY
WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR
PURPOSE. See the GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along with
Casual Playground. If not, see <https://www.gnu.org/licenses/>.
*/

var parser_version = 1;

const copy = function(board, selection_array, idlist)
{
    let selection = selection_array;
    let selected_cells = [];
    let palette = [];
    let minx = board[0].length;
    let miny = board.length;
    for (let iy = 0; iy < board.length; iy++)
    {
        for (let ix = 0; ix < board[0].length; ix++)
        {
            if (selection[iy].get(ix))
            {
                minx = Math.min(ix, minx);
                miny = Math.min(iy, miny);
                let cellid = board[iy][ix].cellid;
                selected_cells.push([ix,iy,idlist[cellid]]);
                palette.push(idlist[cellid]);
            }
        }
    }
    if (selected_cells.length === 0) return [null, 'Selection is empty'];
    palette = Array.from(new Set(palette));
    let backpalette = {};
    for (let key in palette) backpalette[palette[key]] = key;
    let ret = parser_version+'|'+palette.join(',')+'|';
    for (let i=0; i < selected_cells.length; i++)
    {
        ret += [selected_cells[i][0]-minx, selected_cells[i][1]-miny,
            backpalette[selected_cells[i][2]]].join(',');
        if (i !== selected_cells.length-1) ret += ';';
    }
    return [ret, 'Successfully copied!'];
};

const paste = function(text, objdata)
{
    try
    {
        if (!text.includes('|')) return null;
        let paste_version = text.slice(0, text.indexOf('|'));
        if (isNaN(paste_version)) return null;
        paste_version = Number(paste_version);
        if (paste_version < paste_parsers.length) return paste_parsers[paste_version](text, objdata);
        return [null, 'Non existing copy-paste version'];
    }
    catch (err)
    {
        return [null, 'An unexpected error occurred while parsing: '+err.message]
    }
};

const paste1 = function(text, objdata)
{
    let ret = {};
    let parts = text.split('|');
    let palette = parts[1].split(',');
    for (let i of palette) if (!(i in objdata)) return [null, 'Some cells from clipboard are not loaded in this session'];
    let cells = parts[2].split(';');
    let w = 0;
    let h = 0;
    for (let cell of cells)
    {
        let [cx,cy,cd] = cell.split(',');
        if (!ret.hasOwnProperty(Number(cy))) ret[Number(cy)] = {};
        ret[Number(cy)][Number(cx)] = palette[Number(cd)];
        w = Math.max(Number(cx)+1, w);
        h = Math.max(Number(cy)+1, h);
    }
    return [{pastedata: ret, pastewidth: w, pasteheight: h}, 'Successfully pasted to the current instrument!'];
};

var paste_parsers = [()=>[null, 'Non existing copy-paste version'], paste1];

module.exports = {copy, paste};