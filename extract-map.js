const fs = require('fs');
const path = require('path');

const modulePath = path.join(__dirname, 'node_modules', 'react-brazil-map', 'dist', 'index.js');
const content = fs.readFileSync(modulePath, 'utf8');

// The file likely calls React.createElement('path', { d: "M...", id: "SP" })
// Let's just grab all `d:` strings and the nearby `id:` or `className:`.
const dMatches = content.match(/d:\s*["']([^"']+)["']/g);
console.log("Total paths:", dMatches ? dMatches.length : 0);

if (dMatches) {
  // Let's print the area of code around the first path to see structure
  const firstIdx = content.indexOf('d:');
  console.log("Snippet:", content.slice(Math.max(0, firstIdx - 100), firstIdx + 150));
}
