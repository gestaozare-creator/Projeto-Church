const fs = require('fs');
const path = require('path');

// Patch the fetch block in all three dept pages
// The config comes as a JSON string, so we need to JSON.parse it
function fixDept(file, deptName) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace the simple config access with JSON.parse safe version
    const oldFetch = `const { data: churchDb } = await supabase
        .from("churches")
        .select("config")
        .eq("id", resolvedChurchId)
        .single();
      if (
        churchDb &&
        churchDb.config &&
        churchDb.config.escalas &&
        churchDb.config.escalas["${deptName}"]
      ) {
        setEscalasGlobais(churchDb.config.escalas["${deptName}"]);
      } else {
        setEscalasGlobais({});
      }`;
    
    const newFetch = `const { data: churchDb } = await supabase
        .from("churches")
        .select("config")
        .eq("id", resolvedChurchId)
        .single();
      // O config pode vir como string JSON - precisamos parsear!
      let parsedConfig: any = {};
      if (churchDb?.config) {
        if (typeof churchDb.config === 'string') {
          try { parsedConfig = JSON.parse(churchDb.config); } catch { parsedConfig = {}; }
        } else {
          parsedConfig = churchDb.config;
        }
      }
      if (parsedConfig?.escalas?.["${deptName}"]) {
        setEscalasGlobais(parsedConfig.escalas["${deptName}"]);
      } else {
        setEscalasGlobais({});
      }`;
    
    if (content.includes(oldFetch)) {
        content = content.replace(oldFetch, newFetch);
        console.log(`Fixed ${deptName}: found and replaced fetch block`);
    } else {
        console.log(`WARN ${deptName}: could not find exact fetch block, trying partial match`);
        
        // Try partial: find and replace just the if block
        const oldIf = `if (
        churchDb &&
        churchDb.config &&
        churchDb.config.escalas &&
        churchDb.config.escalas["${deptName}"]
      ) {
        setEscalasGlobais(churchDb.config.escalas["${deptName}"]);
      } else {
        setEscalasGlobais({});
      }`;
        
        const newIf = `// O config pode vir como string JSON - precisamos parsear!
      let parsedConfig: any = {};
      if (churchDb?.config) {
        if (typeof churchDb.config === 'string') {
          try { parsedConfig = JSON.parse(churchDb.config); } catch { parsedConfig = {}; }
        } else {
          parsedConfig = churchDb.config;
        }
      }
      if (parsedConfig?.escalas?.["${deptName}"]) {
        setEscalasGlobais(parsedConfig.escalas["${deptName}"]);
      } else {
        setEscalasGlobais({});
      }`;
        
        if (content.includes(oldIf)) {
            content = content.replace(oldIf, newIf);
            console.log(`Fixed ${deptName}: replaced if block`);
        } else {
            console.log(`ERROR ${deptName}: couldn't find pattern to replace!`);
        }
    }
    
    fs.writeFileSync(file, content, 'utf8');
}

const basePath = path.join(__dirname, '..', 'app', 'departamentos');
fixDept(path.join(basePath, 'louvor', 'page.tsx'), 'Louvor');
fixDept(path.join(basePath, 'midia', 'page.tsx'), 'Mídia');
fixDept(path.join(basePath, 'obreiros', 'page.tsx'), 'Obreiros');
