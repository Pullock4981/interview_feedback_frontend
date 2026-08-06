const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.js') || file.endsWith('.jsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(path.join(__dirname, 'src'));
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('http://localhost:5000/api/v1')) {
    // Replace string literals with template literals using env var
    // "http://localhost:5000/api/v1/..." -> `${process.env.NEXT_PUBLIC_API_URL}/...`
    // `http://localhost:5000/api/v1/...` -> `${process.env.NEXT_PUBLIC_API_URL}/...`
    
    // Replace double quotes
    content = content.replace(/"http:\/\/localhost:5000\/api\/v1([^"]*)"/g, '`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"}$1`');
    
    // Replace backticks (template literals that already use `...`)
    content = content.replace(/`http:\/\/localhost:5000\/api\/v1([^`]*)`/g, '`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"}$1`');
    
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated', file);
  }
});
