const moduleRegex = /([^@]+)@([^/]+)\/?/;

export class Module {
  constructor(
    public readonly protocol: string,
    public readonly path: string,
    public version: string,
    public files: string[]
  ) {}

  compare(mod: Module): number {
    return this.path.localeCompare(mod.path);
  }

  toString(): string {
    return `${this.protocol}://${this.path}`;
  }

  toStringWithVersion(): string {
    return `${this.toString()}@${this.version}`;
  }
}

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
  return new Module(protocol.replace(/\:$/, ''), path, version, []);
}
