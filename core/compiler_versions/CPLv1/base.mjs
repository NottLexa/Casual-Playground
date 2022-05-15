/*
    Copyright © 2022 Alexey Kozhanov

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

import * as coi from './compiler_other_instruments.mjs';
import * as ccb from './compiler_code_blocks.mjs';
import * as cbd from './compiler_block_definers.mjs';

const get = function(code = '', start = 0, end = null)
{
    if (end === null) end = code.length;
    else end = Math.min(end, code.length);
}

export {get};