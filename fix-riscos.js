const fs = require('fs');
let content = fs.readFileSync('app/operacao/riscos/page.tsx', 'utf8');

content = content.replace(
  /atividade: string;\n  }> = \{\};/g,
  "atividade: string;\n    pacotes: string[];\n  }> = {};"
);

content = content.replace(
  /const pacote = r\.pacote \|\| r\.package \|\| 'Base SST';/g,
  "const pacote = (r as any).pacote || (r as any).package || 'Base SST';"
);

fs.writeFileSync('app/operacao/riscos/page.tsx', content);

console.log('Fixed riscos');
