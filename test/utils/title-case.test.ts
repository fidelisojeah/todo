import titleCase from '../../src/utils/title-case';

describe('toTitleCase', () => {
    test('should convert to titlecase properly when lowercase single character', () => {
        const result = titleCase('f');

        expect(result).toBe('F');
    });

    test('should convert to titlecase properly when uppercase single character', () => {
        const result = titleCase('H');

        expect(result).toBe('H');
    });

    test('should convert to titlecase properly when proposition is at beginning of sentence', () => {
        const result = titleCase('Of which, this is fine.');

        expect(result).toBe('Of Which, This Is Fine.');
    });

    test('should convert to titlecase properly when proposition is after .', () => {
        const result = titleCase('Just a simple test. A simple test');

        expect(result).toBe('Just a Simple Test. A Simple Test');
    });

    test('should convert to titlecase properly abbreviated word like ID.', () => {
        const result = titleCase('Where is my id');

        expect(result).toBe('Where Is My ID');
    });
});
