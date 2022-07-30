VERSION 1

CELL "GOL: Live cell" "A live cell from John Conway's Game of Life."

NOTEXTURE 238 238 238

LOCALIZATION
    rus "ИЖ: Живая клетка" "Живая клетка из игры \"Жизнь\" Джона Конвея."

SCRIPT CREATE
    _mincx = :max(-1, -__X)
    _mincy = :max(-1, -__Y)
    _maxcx = :min(1, BOARDWIDTH-__X-1)
    _maxcy = :min(1, BOARDHEIGHT-__Y-1)

SCRIPT STEP
    _counter = 0
    _cx = _mincx
    WHILE (_cx <= _maxcx)
        _cy = _mincy
        WHILE (_cy <= _maxcy)
            IF :not(:and(_cx == 0, _cy == 0))
                IF (:getcell(__X+_cx, __Y+_cy) == #gameoflife_live)
                    _counter = _counter + 1
            _cy = _cy + 1
        _cx = _cx + 1
    IF :not(:or(_counter == 2, _counter == 3))
        :setcell(__X, __Y, #gameoflife_dead)