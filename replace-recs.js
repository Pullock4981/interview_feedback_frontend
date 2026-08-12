const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      // exclude node_modules, .git, .next
      if (!file.includes('node_modules') && !file.includes('.git') && !file.includes('.next')) {
        results = results.concat(walk(file));
      }
    } else { 
      if (file.endsWith('.js') || file.endsWith('.jsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const frontendFiles = walk(path.join(__dirname, 'src'));
const backendFiles = walk(path.join(__dirname, '../ifms-backend/src'));
const allFiles = [...frontendFiles, ...backendFiles];

const replacements = [
  { from: /['"]Strong Hire['"]/g, to: "'Strongly Recommended (Potential Candidate)'" },
  { from: /['"]Hire['"]/g, to: "'Recommended'" },
  { from: /['"]Maybe['"]/g, to: "'Need Improvement'" },
  { from: /['"]Reject['"]/g, to: "'Not Recommended'" }
];

allFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  
  replacements.forEach(r => {
    content = content.replace(r.from, r.to);
  });
  
  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated', file);
  }
});
