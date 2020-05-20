export function createURL(
  moduleProtocol: string,
  modulePath: string,
  moduleVersion: string,
  filePath: string,
): string {
  return `${moduleProtocol}://${modulePath}@${moduleVersion}${filePath}`;
}
