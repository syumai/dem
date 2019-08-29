"use strict";
exports.__esModule = true;
var ts = require("typescript");
// import ts from './typescript.js';
var source = "\nimport * as dejs from './vendor/https/deno.land/x/dejs/mod.ts';\nimport { app, get } from './vendor/https/denopkg.com/dinatra/mod.ts';\nimport { indexHandler } from './handlers.ts';\n\napp(\n  get('/', indexHandler),\n);\n";
var counter = 0;
var sourceFile = ts.createSourceFile('hoge.ts', source, ts.ScriptTarget.ES2020);
function crawlNodes(node) {
    console.log(counter + ": " + node.kind, ts.SyntaxKind[node.kind]);
    if (node.kind === ts.SyntaxKind.ImportDeclaration) {
        inspectImport(node);
    }
    counter++;
    node.forEachChild(crawlNodes);
}
function collectImports(node) {
    var imports = [];
    var collectImport = function (node) {
        if (node.kind === ts.SyntaxKind.ImportDeclaration) {
            imports.push(node);
        }
    };
    node.forEachChild(collectImport);
    return imports;
}
function inspectImport(node) {
    if (node.kind !== ts.SyntaxKind.ImportDeclaration) {
        throw new Error("node kind want: " + ts.SyntaxKind[ts.SyntaxKind.ImportDeclaration] + ", got: " + ts.SyntaxKind[node.kind]);
    }
    node.forEachChild(function (child) {
        switch (child.kind) {
            case ts.SyntaxKind.ImportClause:
            case ts.SyntaxKind.StringLiteral:
                console.log(child.getText(sourceFile));
        }
    });
}
// crawlNodes(sourceFile);
var imports = collectImports(sourceFile);
for (var _i = 0, imports_1 = imports; _i < imports_1.length; _i++) {
    var imp = imports_1[_i];
    console.log(imp.getText(sourceFile));
}
