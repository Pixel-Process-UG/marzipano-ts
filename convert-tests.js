import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

function convertTestFile(filePath) {
  let content = readFileSync(filePath, 'utf-8');
  let modified = false;

  // Remove 'use strict';
  if (content.includes("'use strict';")) {
    content = content.replace(/'use strict';\n\n?/g, '');
    modified = true;
  }

  // Convert require statements to imports
  // var assert = require('chai').assert; -> import { assert } from 'chai';
  content = content.replace(
    /var assert = require\('chai'\)\.assert;/g,
    "import { assert } from 'chai';"
  );
  if (content.includes("import { assert } from 'chai';")) {
    modified = true;
  }

  // var sinon = require('sinon'); -> import sinon from 'sinon';
  content = content.replace(/var sinon = require\('sinon'\);/g, "import sinon from 'sinon';");
  if (content.includes("import sinon from 'sinon';")) {
    modified = true;
  }

  // sinon.assert.expose(assert, { prefix: '' }); - keep as is, but ensure it's after imports
  // This is fine to keep

  // Convert other require statements
  // var Module = require('../../src/Module'); -> import Module from '../../src/Module.js';
  content = content.replace(
    /var (\w+) = require\('([^']+)'\);/g,
    (match, varName, modulePath) => {
      // Skip if already converted
      if (content.includes(`import ${varName} from`)) {
        return match;
      }
      // Add .js extension if not present
      const jsPath = modulePath.endsWith('.js') ? modulePath : `${modulePath}.js`;
      return `import ${varName} from '${jsPath}';`;
    }
  );

  // Convert suite() to describe()
  if (content.includes('suite(')) {
    content = content.replace(/suite\(/g, 'describe(');
    modified = true;
  }

  // Convert test() to it()
  if (content.includes('test(')) {
    content = content.replace(/\btest\(/g, 'it(');
    modified = true;
  }

  // Convert var to const/let in test functions (basic conversion)
  // This is a simple conversion - var -> const for most cases
  // More sophisticated conversion would require AST parsing
  const testFunctionRegex = /(it|describe)\([^)]+\)\s*\{[\s\S]*?\n\s*var\s+(\w+)\s*=/g;
  // We'll do a simpler replacement: var -> const in test contexts
  // But this is risky, so we'll be conservative

  if (modified) {
    writeFileSync(filePath, content, 'utf-8');
    return true;
  }
  return false;
}

function findTestFiles(directory) {
  const files = [];
  function walkSync(currentDir) {
    const entries = readdirSync(currentDir);
    entries.forEach((entry) => {
      const filePath = join(currentDir, entry);
      const stat = statSync(filePath);
      if (stat.isDirectory()) {
        walkSync(filePath);
      } else if (stat.isFile() && filePath.endsWith('.js')) {
        files.push(filePath);
      }
    });
  }
  walkSync(directory);
  return files;
}

const testDir = './test/suite';
const testFiles = findTestFiles(testDir);

console.log(`Found ${testFiles.length} test files to convert`);

let converted = 0;
testFiles.forEach((file) => {
  if (convertTestFile(file)) {
    converted++;
    console.log(`Converted: ${file}`);
  }
});

console.log(`\nConverted ${converted} files`);

