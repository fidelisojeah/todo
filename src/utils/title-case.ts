const titleRegExp = new RegExp('([^\\W_]+[^\\s-]*)*', 'g');
const lowers = [
    'A',
    'An',
    'The',
    'And',
    'But',
    'Or',
    'For',
    'Nor',
    'As',
    'At',
    'By',
    'For',
    'From',
    'In',
    'Into',
    'Near',
    'Of',
    'On',
    'Onto',
    'To',
    'With'
];
const lowerRegExp = new RegExp(`(?<=[^\\.]\\s)(${lowers.join('|')})\\s`, 'g');

const uppers = ['Id'];
const upperRegExp = new RegExp(`\\b(${uppers.join('|')})\\b`, 'g');

export default function titleCase(value: string): string {
    let str = value.replace(titleRegExp, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());

    // Certain minor words should be left lowercase unless
    // they are the first or last words in the string
    str = str.replace(lowerRegExp, (txt) => txt.toLowerCase());

    // Certain words such as initialisms or acronyms should be left uppercase
    str = str.replace(upperRegExp, (txt) => txt.toUpperCase());

    return str;
}
