const moduleRegex = /([^@]+)@([^/]+)\/?/;

export type Module = {
  protocol: string;
  path: string;
  version: string;
  files: string[];
};

export function moduleEquals(a: Module, b: Module): boolean {
  return a.protocol === b.protocol && a.path === b.path;
}

export function parseModule(name: string): Module | undefined {
  const u = new URL(name);
  const { protocol, hostname, pathname } = u;
  const result = pathname.match(moduleRegex);
  if (!result) {
    return undefined;
  }
  const path = hostname + result[1];
  const version = result[2];
  return {
    protocol: protocol.replace(/\:$/, ''),
    path,
    version,
    files: [],
  };
}
