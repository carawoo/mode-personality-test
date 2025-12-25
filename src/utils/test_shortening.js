
import { decodeResults } from './scoring.js';

// User's provided legacy link string
const v2Legacy = 'JTdCJTIyc2NvcmVzJTIyJTNBJTdCJTIyRUklMjIlM0E1NiUyQyUyMlNOJTIyJTNBNTMlMkMlMjJURiUyMiUzQTU2JTJDJTIySlAlMjIlM0E0MiU3RCUyQyUyMmNvZGUlMjIlM0ElMjJFU1RQJTIyJTJDJTIyaGFzRHVhbFByb2ZpbGUlMjIlM0F0cnVlJTJDJTIycHJpdmF0ZVNjb3JlcyUyMiUzQSU3QiUyMkVJJTIyJTNBNTAlMkMlMjJTTiUyMiUzQTU4JTJDJTIyVEYlMjIlM0E1NiUyQyUyMkpQJTIyJTNBNzclN0QlMkMlMjJwcml2YXRlQ29kZSUyMiUzQSUyMkVTVEolMjIlMkMlMjJ3b3JrU2NvcmVzJTIyJTNBJTdCJTIyRUklMjIlM0E1MCUyQyUyMlNOJTIyJTNBNTglMkMlMjJURiUyMiUzQTU2JTJDJTIySlAlMjIlM0E0NyU3RCUyQyUyMndvcmtDb2RlJTIyJTNBJTIyRVNUUCUyMiUyQyUyMnRhcmdldFR5cGUlMjIlM0ElMjJzZWxmJTIyJTJDJTIydGFyZ2V0TmFtZSUyMiUzQW51bGwlN0Q=';

console.log('--- Legacy v1/v2 Robust Decoding Test ---');
try {
    const decoded = decodeResults(v2Legacy);
    console.log('Decoding Successful:', decoded !== null);
    if (decoded) {
        console.log('Decoded Scores:', JSON.stringify(decoded.scores));
        console.log('Decoded Code:', decoded.code);
        console.log('Has Scores Key:', !!decoded.scores);
        // Verify EI score is 56 from the string
        console.log('EI Score Check (expected 56):', decoded.scores.EI === 56 ? 'PASS' : 'FAIL');
    }
} catch (e) {
    console.log('Crashed during decoding:', e.message);
}
console.log('--- End Test ---');
