import * as ts from 'typescript';
// import ts from './typescript.js';

const source = `
import hoge from './hoge.js';
import higo from './higo.js';

const fn = () => {
  const hige = import('./hige.js');
}

import fugi from './fugi.js';
`;

let counter = 0;

const sourceFile = ts.createSourceFile(
  'hoge.ts',
  source,
  ts.ScriptTarget.ES2020
);

function crawlNodes(node: ts.Node) {
  console.log(`${counter}: ${node.kind}`, ts.SyntaxKind[node.kind]);
  if (node.kind === ts.SyntaxKind.ImportDeclaration) {
    inspectImport(node);
  }
  counter++;
  node.forEachChild(crawlNodes);
}

function collectImports(node: ts.Node): Array<ts.Node> {
  const imports: Array<ts.Node> = [];
  const collectImport = (node: ts.Node) => {
    if (node.kind === ts.SyntaxKind.ImportDeclaration) {
      imports.push(node);
    }
  }
  node.forEachChild(collectImport);
  return imports;
}

function inspectImport(node: ts.Node) {
  if (node.kind !== ts.SyntaxKind.ImportDeclaration) {
    throw new Error(
      `node kind want: ${ts.SyntaxKind[ts.SyntaxKind.ImportDeclaration]}, got: ${ts.SyntaxKind[node.kind]}`,
    );
  }
  node.forEachChild((child: ts.Node) => {
    switch (child.kind) {
    case ts.SyntaxKind.ImportClause:
    case ts.SyntaxKind.StringLiteral:
      console.log(child.getText(sourceFile));
    }
  });
}

// crawlNodes(sourceFile);
const imports = collectImports(sourceFile);
for (const imp of imports) {
  console.log(imp.getText(sourceFile));
}
