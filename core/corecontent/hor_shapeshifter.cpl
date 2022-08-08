VERSION 1

CELL "Horizontal Mimic" "Copies its right neighbour. If it is on the right edge of the board, copies the neighbour on the left."

NOTEXTURE 155 155 155

LOCALIZATION
    rus "Горизонтальный Мимик" "Копирует правого соседа. Если он на правой границе доски, копирует соседа слева."

SCRIPT STEP
    IF (BOARDWIDTH > 1)
        IF (__X < BOARDWIDTH-1)
            :setcell(__X, __Y, :getcell(__X+1, __Y))
        ELSE
            :setcell(__X, __Y, :getcell(__X-1, __Y))