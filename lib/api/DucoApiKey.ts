/*
 * API key generation for the Duco Connectivity Board.
 *
 * Key derivation as published in ducopy (https://github.com/Sikerdebaard/ducopy),
 * src/ducopy/rest/apikeygenerator.py.
 */

'use strict';

const KEY_TEMPLATE = 'n4W2lNnb2IPnfBrXwSTzTlvmDvsbemYRvXBRWrfNtQJlMiQ8yPVRmGcoPd7szSu2';

function transformChar(c1: string, c2: string): string {
    let result = (c1.charCodeAt(0) ^ c2.charCodeAt(0)) & 127;
    if (result < 48) {
        result = (result % 26) + 97;
    } else if (result > 57 && result < 65) {
        result = (result % 26) + 65;
    } else if (result > 90 && result < 97) {
        result = (result % 10) + 48;
    } else if (result > 122) {
        result = (result % 10) + 48;
    }

    return String.fromCharCode(result);
}

/**
 * Generate the Api-Key header value from the board serial (General.Board.SerialBoardBox),
 * the MAC address (General.Lan.Mac) and the board time (General.Board.Time), all read from /info.
 */
export default function generateDucoApiKey(boardSerial: string, macAddress: string, time: number): string {
    const key = KEY_TEMPLATE.split('');

    for (let i = 0; i < Math.min(macAddress.length, 32); i++) {
        key[i] = transformChar(key[i], macAddress[i]);
    }

    for (let i = 0; i < Math.min(boardSerial.length, 32); i++) {
        key[i + 32] = transformChar(key[i + 32], boardSerial[i]);
    }

    const days = Math.floor(time / 86400);
    for (let i = 0; i < 16; i++) {
        if ((days & (1 << i)) !== 0) {
            const idx = i * 4;
            key[idx] = transformChar(key[idx], key[i * 2 + 32]);
            key[idx + 1] = transformChar(key[idx + 1], key[63 - (i * 2)]);
            key[idx + 2] = transformChar(key[idx], key[idx + 1]);
            key[idx + 3] = transformChar(key[idx + 1], key[idx + 2]);
        }
    }

    return key.join('');
}
