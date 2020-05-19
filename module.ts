const moduleRegex = /([^@]+)@([^/]+)\/?/;

export class Module {
  constructor(
    public readonly protocol: string,
    public readonly path: string,
    public version: string,
    public files: string[],
  ) {}

  toString(): string {
    return `${this.protocol}://${this.path}`;
  }

  toStringWithVersion(): string {
    return `${this.toString()}@${this.version}`;
  }

  static parse = (name: string): Module => {
    const u = new URL(name);
    const { protocol, hostname, pathname } = u;
    const result = pathname.match(moduleRegex);
    let path = "";
    let version = "";
    if (result) {
      path = hostname + result[1];
      version = result[2];
    } else {
      path = hostname + pathname;
    }
    return new Module(protocol.replace(/\:$/, ""), path, version, []);
  };
}

export function compareModules(modA: Module, modB: Module): number {
  return modA.path.localeCompare(modB.path);
}

export function moduleEquals(a: Module, b: Module): boolean {
  return a.protocol === b.protocol && a.path === b.path;
}
