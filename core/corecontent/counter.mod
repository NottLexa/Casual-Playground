VERSION 1

CELL "Counter" "Counts its lifetime."

NOTEXTURE 200 200 200

LOCALIZATION
    rus "Счётчик" "Считает своё время жизни."

SCRIPT CREATE
    _lifetime = 0

SCRIPT STEP
    _lifetime = _lifetime + 1