
const sanitizeText = (str) => (str ? str.replace(/</g, '&lt;').replace(/>/g, '&gt;') : '');

const testCases = [
    { input: '<script>alert(1)</script>', expected: '&lt;script&gt;alert(1)&lt;/script&gt;' },
    { input: '<img src=x onerror=alert(1)>', expected: '&lt;img src=x onerror=alert(1)&gt;' },
    { input: 'สวัสดีครับ <p>ต้องการน้ำ</p>', expected: 'สวัสดีครับ &lt;p&gt;ต้องการน้ำ&lt;/p&gt;' },
];

testCases.forEach(tc => {
    const result = sanitizeText(tc.input);
    if (result === tc.expected) {
        console.log(`PASS: input="${tc.input}" result="${result}"`);
    } else {
        console.log(`FAIL: input="${tc.input}" expected="${tc.expected}" but got="${result}"`);
        process.exit(1);
    }
});
