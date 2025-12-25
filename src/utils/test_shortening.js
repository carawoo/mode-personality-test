
import { encodeResults, decodeResults } from './scoring.js';

const testData = {
    scores: { EI: 56, SN: 53, TF: 56, JP: 42 },
    code: 'ESTP',
    hasDualProfile: true,
    privateScores: { EI: 78, SN: 47, TF: 53, JP: 39 },
    privateCode: 'ENTP',
    workScores: { EI: 50, SN: 58, TF: 56, JP: 47 },
    workCode: 'ESTP',
    targetType: 'self',
    targetName: null
};

console.log('--- v3 Shortening Test ---');
const v3Encoded = encodeResults(testData);
console.log('v3 Encoded Length:', v3Encoded.length);
console.log('v3 Encoded:', v3Encoded);

const decoded = decodeResults(v3Encoded);
console.log('\nDecoded Match (Scores):', JSON.stringify(decoded.scores) === JSON.stringify(testData.scores));
console.log('Decoded Match (Works):', JSON.stringify(decoded.workScores) === JSON.stringify(testData.workScores));
console.log('Decoded Match (Private):', JSON.stringify(decoded.privateScores) === JSON.stringify(testData.privateScores));

// Test with Name
const nameData = { ...testData, targetName: '홍길동', targetType: 'other' };
const v3NameEncoded = encodeResults(nameData);
console.log('\nv3 with Name Length:', v3NameEncoded.length);
const decodedName = decodeResults(v3NameEncoded);
console.log('Name Match:', decodedName.targetName === '홍길동');

// Test v2 Legacy (from user request)
const v2Legacy = 'JTdCJTIyc2NvcmVzJTIyJTNBJTdCJTIyRUklMjIlM0E1NiUyQyUyMlNOJTIyJTNBNTMlMkMlMjJURiUyMiUzQTU2JTJDJTIySlAlMjIlM0E0MiU3RCUyQyUyMmNvZGUlMjIlM0ElMjJFU1RQJTIyJTJDJTIyaGFzRHVhbFByb2ZpbGUlMjIlM0F0cnVlJTJDJTIycHJpdmF0ZVNjb3JlcyUyMiUzQSU3QiUyMkVJJTIyJTNBNTAlMkMlMjJTTiUyMiUzQTU4JTJDJTIyVEYlMjIlM0E1NiUyQyUyMkpQJTIyJTNBNzclN0QlMkMlMjJwcml2YXRlQ29kZSUyMiUzQSUyMkVTVEolMjIlMkMlMjJ3b3JrU2NvcmVzJTIyJTNBJTdCJTIyRUklMjIlM0E1MCUyQyUyMlNOJTIyJTNBNTglMkMlMjJURiUyMiUzQTU2JTJDJTIySlAlMjIlM0E0NyU3RCUyQyUyMndvcmtDb2RlJTIyJTNBJTIyRVNUUCUyMiUyQyUyMnRhcmdldFR5cGUlMjIlM0ElMjJzZWxmJTIyJTJDJTIydGFyZ2V0TmFtZSUyMiUzQW51bGwlN0Q=';
try {
    const rawB64 = decodeURIComponent(v2Legacy);
    console.log('\nRaw B64 (URI Decoded):', rawB64.substring(0, 20) + '...');
    const decodedV2 = decodeResults(v2Legacy);
    console.log('Legacy v1/v2 Decoding (should not be null):', decodedV2 !== null);
    if (decodedV2) {
        console.log('Legacy Code:', decodedV2.code);
        console.log('Legacy EI Score:', decodedV2.scores.EI);
    } else {
        // Log what went wrong
        const b64 = rawB64 + '=='.slice((rawB64.length % 4) || 2);
        const str = atob(b64);
        console.log('Actually atob produced:', str.substring(0, 50) + '...');
    }
} catch (e) {
    console.log('Legacy decoding crashed:', e.message);
}

console.log('\n--- End Test ---');
