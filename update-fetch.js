const fs = require('fs');

function replaceFetch(file) {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('fetch(')) {
    if (!content.includes('fetchWithAuth')) {
      content = 'import { fetchWithAuth } from "@/utils/api";\n' + content;
    }
    content = content.replace(/fetch\(/g, 'fetchWithAuth(');
    fs.writeFileSync(file, content);
    console.log('Updated ' + file);
  }
}

replaceFetch('src/app/dashboard/interviews/[id]/page.js');
replaceFetch('src/app/dashboard/feedbacks/[id]/page.js');
replaceFetch('src/app/dashboard/status/page.js');
