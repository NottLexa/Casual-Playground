const whitespace = ' \t\n\r\v\f';
const ascii_lowercase = 'abcdefghijklmnopqrstuvwxyz';
const ascii_uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const ascii_letters = ascii_lowercase + ascii_uppercase;
const digits = '0123456789';
const naming = digits + ascii_letters;
const punctuation = "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~";
const printable = naming + punctuation + whitespace;

const s_dig = new Set(digits);
const s_num = new Set([...s_dig, '.']);
const s_ascl = new Set(ascii_lowercase);
const s_ascu = new Set(ascii_uppercase);
const s_asc = new Set([...s_ascl, ...s_ascu]);
const s_nam = new Set([...s_dig, ...s_asc, '_']);
const s_nonam = new Set([...s_dig, '_']);