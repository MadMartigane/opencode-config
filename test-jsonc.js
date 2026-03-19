const fs = require('fs');
try {
  const content = fs.readFileSync('opencode.jsonc', 'utf8');
  // strip comments and trailing commas to parse
  const sanitized = content
    .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '')
    .replace(/,\s*([\]}])/g, '$1');
  JSON.parse(sanitized);
  console.log("JSONC is valid");
} catch(e) {
  console.error("JSONC error:", e.message);
}
