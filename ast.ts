import jspmts from "https://jspm.dev/typescript@4.3.2";
import * as path from "./vendor/https/deno.land/std/path/mod.ts";
const ts = jspmts as any

const dec = new TextDecoder("utf-8");

export async function hasDefaultExportLocal(
  filePath: string,
): Promise<boolean> {
  const body = dec.decode(await Deno.readFile(filePath));
  return hasDefaultExport(body);
}

export async function hasDefaultExportRemote(url: string): Promise<boolean> {
  const res = await fetch(url, { redirect: "follow" });
  const body = await res.text();
  return hasDefaultExport(body);
}

export function hasDefaultExport(body: string): boolean {
  const sourceFile = ts.createSourceFile("", body, ts.ScriptTarget.ES2020);
  let hasDefault = false;
  sourceFile.forEachChild((node: any) => {
    hasDefault = hasDefault || node.kind === ts.SyntaxKind.ExportAssignment;
  });
  return hasDefault;
}

function removeQuotes(s: string): string {
  return s.replace(/[\'\"\`]/g, "");
}

const crawlImport = (filePaths: string[], sourceFile: any) =>
  (
    node: any,
  ) => {
    if (node.kind === ts.SyntaxKind.ImportDeclaration) {
      node.forEachChild((child: any) => {
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
