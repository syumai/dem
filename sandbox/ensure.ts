import * as ts from 'typescript';

const source = `
import * as dejs from './vendor/https/deno.land/x/dejs/mod.ts';
import { app, get } from './vendor/https/denopkg.com/dinatra/mod.ts';
import { indexHandler } from './handlers.ts';

const hoge = fuga?.fuge;

app(
  get('/', indexHandler),
);
`;

const sourceFile = ts.createSourceFile(
  'app.ts',
  source,
  ts.ScriptTarget.ES2020
);

function collectImports(node: ts.Node): Array<ts.Node> {
  const imports: Array<ts.Node> = [];
  const collectImport = (node: ts.Node) => {
    if (node.kind === ts.SyntaxKind.ImportDeclaration) {
      imports.push(node);
    }
  };
  node.forEachChild(collectImport);
  return imports;
}

function inspectImport(node: ts.Node) {
  if (node.kind !== ts.SyntaxKind.ImportDeclaration) {
    throw new Error(
      `node kind want: ${
        ts.SyntaxKind[ts.SyntaxKind.ImportDeclaration]
      }, got: ${ts.SyntaxKind[node.kind]}`
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

function analyzeImport(node: ts.Node): Array<ts.Node> {
  const imports: Array<ts.Node> = [];
  const collectImport = (node: ts.Node) => {
    if (node.kind === ts.SyntaxKind.ImportDeclaration) {
      imports.push(node);
    }
  };
  node.forEachChild(collectImport);
  return imports;
}

const config = {
  version: '0.1.0',
  modules: [
    {
      protocol: 'https',
      path: 'deno.land/x/dejs',
      version: '0.3.0',
      files: ['/mod.ts'],
    },
  ],
};

function removeQuotes(s: string): string {
  return s.replace(/[\'\"\`]/g, '');
}

function ensure(node: ts.SourceFile): string[] {
  const filePaths: string[] = [];
  const crawlImport = (node: ts.Node) => {
    if (node.kind === ts.SyntaxKind.ImportDeclaration) {
      node.forEachChild((child: ts.Node) => {
        if (child.kind === ts.SyntaxKind.StringLiteral) {
          filePaths.push(removeQuotes(child.getText(sourceFile)));
        }
      });
    }
  };
  node.forEachChild(crawlImport);
  return filePaths;
  // const moduleMap: { [key: string]: Object } = {};
  // for (const mod of config.modules) {
  //   const prefix = `./vendor/${mod.protocol}/${mod.path}`;
  //   for (const file of mod.files) {
  //     const key = `${prefix}${file}`;
  //     moduleMap[key] = mod;
  //   }
  // }
}

console.log(ensure(sourceFile));
