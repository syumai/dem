// @deno-types='https://dev.jspm.io/typescript@3.9.2/lib/typescript.d.ts'
import ts from "./vendor/https/dev.jspm.io/typescript/lib/typescript.js";
import * as path from "./vendor/https/deno.land/std/path/mod.ts";

const dec = new TextDecoder("utf-8");

export async function hasDefaultExportLocal(
  filePath: string,
): Promise<boolean> {
  const body = dec.decode(await Deno.readFile(filePath));
  return await hasDefaultExport(body);
}

export async function hasDefaultExportRemote(url: string): Promise<boolean> {
  const res = await fetch(url, { redirect: "follow" });
  const body = await res.text();
  return await hasDefaultExport(body);
}

export async function hasDefaultExport(body: string): Promise<boolean> {
  const sourceFile = ts.createSourceFile("", body, ts.ScriptTarget.ES2020);
  let hasDefault = false;
  sourceFile.forEachChild((node: ts.Node) => {
    hasDefault = hasDefault || (node.kind === ts.SyntaxKind.ExportAssignment);
  });
  return hasDefault;
}

function removeQuotes(s: string): string {
  return s.replace(/[\'\"\`]/g, "");
}

const crawlImport = (filePaths: string[], sourceFile: ts.SourceFile) =>
  (node: ts.Node) => {
    if (node.kind === ts.SyntaxKind.ImportDeclaration) {
      node.forEachChild((child: ts.Node) => {
        if (child.kind === ts.SyntaxKind.StringLiteral) {
          filePaths.push(removeQuotes(child.getText(sourceFile)));
        }
      });
    }
  };

async function getImportFilePaths(
  dirName: string,
  excludes: string[],
): Promise<string[]> {
  const filePaths: string[] = [];
  for await (const f of Deno.readDir(dirName)) {
    if (!f.name) {
      continue;
    }
    if (f.isFile && f.name.match(/\.(js|ts)x?$/)) {
      const body = await Deno.readFile(path.join(dirName, f.name));
      const sourceFile = ts.createSourceFile(
        f.name,
        dec.decode(body),
        ts.ScriptTarget.ES2020,
      );
      sourceFile.forEachChild(crawlImport(filePaths, sourceFile));
    } else if (f.isDirectory && !excludes.includes(f.name)) {
      const result = await getImportFilePaths(
        path.join(dirName, f.name),
        excludes,
      );
      filePaths.push(...result);
    }
  }
  return filePaths;
}

export async function getFormattedImportFilePaths(
  dirName: string,
  excludes: string[],
): Promise<string[]> {
  return (await getImportFilePaths(dirName, excludes))
    .filter((f) => f.match(/vendor/))
    .map((f) => f.replace(/^.+vendor\//, ""))
    .map((f) => f.replace(/\//, "://"));
}
