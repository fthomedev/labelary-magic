
#!/usr/bin/env tsx
import * as fs from 'fs';
import * as path from 'path';

// Import translation files
const enTranslations = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/i18n/locales/en.ts'), 'utf8').replace(/^.*export default\s*/, '').replace(/;\s*$/, ''));
const ptBRTranslations = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/i18n/locales/pt-BR.ts'), 'utf8').replace(/^.*export default\s*/, '').replace(/;\s*$/, ''));

function extractTranslationKeys(dir: string): Set<string> {
  const keys = new Set<string>();
  
  function scanFile(filePath: string) {
    if (!filePath.match(/\.(ts|tsx)$/)) return;
    
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Match t('key') and t("key") patterns
    const matches = content.match(/\bt\s*\(\s*['"`]([^'"`]+)['"`]\s*[\),]/g);
    
    if (matches) {
      matches.forEach(match => {
        const keyMatch = match.match(/['"`]([^'"`]+)['"`]/);
        if (keyMatch) {
          keys.add(keyMatch[1]);
        }
      });
    }
  }
  
  function scanDirectory(dirPath: string) {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        scanDirectory(fullPath);
      } else if (stat.isFile()) {
        scanFile(fullPath);
      }
    }
  }
  
  scanDirectory(dir);
  return keys;
}

function main() {
  console.log('🔍 Checking i18n translations...\n');
  
  const srcDir = path.join(__dirname, '../src');
  const usedKeys = extractTranslationKeys(srcDir);
  
  const enKeys = new Set(Object.keys(enTranslations));
  const ptBRKeys = new Set(Object.keys(ptBRTranslations));
  
  // Find missing keys
  const missingInEn = [...usedKeys].filter(key => !enKeys.has(key));
  const missingInPtBR = [...usedKeys].filter(key => !ptBRKeys.has(key));
  
  // Find unused keys
  const unusedInEn = [...enKeys].filter(key => !usedKeys.has(key));
  const unusedInPtBR = [...ptBRKeys].filter(key => !usedKeys.has(key));
  
  let hasErrors = false;
  
  if (missingInEn.length > 0) {
    console.error('❌ Missing keys in en.ts:');
    missingInEn.forEach(key => console.error(`  - ${key}`));
    console.error('');
    hasErrors = true;
  }
  
  if (missingInPtBR.length > 0) {
    console.error('❌ Missing keys in pt-BR.ts:');
    missingInPtBR.forEach(key => console.error(`  - ${key}`));
    console.error('');
    hasErrors = true;
  }
  
  if (unusedInEn.length > 0) {
    console.warn('⚠️  Unused keys in en.ts:');
    unusedInEn.forEach(key => console.warn(`  - ${key}`));
    console.warn('');
  }
  
  if (unusedInPtBR.length > 0) {
    console.warn('⚠️  Unused keys in pt-BR.ts:');
    unusedInPtBR.forEach(key => console.warn(`  - ${key}`));
    console.warn('');
  }
  
  if (!hasErrors) {
    console.log('✅ All translation keys are properly defined!');
    console.log(`📊 Total keys: ${usedKeys.size}`);
  }
  
  process.exit(hasErrors ? 1 : 0);
}

main();
