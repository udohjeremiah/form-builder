export function generateColor(input?: string): string {
  const hue = input
    ? ((hashString(input) % 360) + 360) % 360
    : Math.floor(Math.random() * 360); // eslint-disable-line sonarjs/pseudo-random
  const saturation = 70;
  const lightness = 55;
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

function hashString(input: string): number {
  let hash = 7;
  for (let index = 0; index < input.length; index++) {
    hash = hash * 31 + (input.codePointAt(index) ?? 0);
  }
  return hash;
}
