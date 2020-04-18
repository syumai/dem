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

  static parse = (name: string): Module | undefined => {
    const u = new URL(name);
    const { protocol, hostname, pathname } = u;
    const result = pathname.match(moduleRegex);
    if (!result) {
      return undefined;
    }
    const path = hostname + result[1];
    const version = result[2];
    return new Module(protocol.replace(/\:$/, ""), path, version, []);
  };
}
