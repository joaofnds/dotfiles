export function flat(text) {
  return text
    .split(/[\s\x1c-\x1f\x85]+/)
    .filter(Boolean)
    .join(" ");
}

export function refuse(message) {
  console.error(message);
  process.exit(2);
}

export function refuseForeignDirectory() {
  if (process.cwd() !== import.meta.dir) {
    refuse(`run this with bun --cwd ${import.meta.dir}, because bun has already loaded any .env and bunfig.toml in ${process.cwd()}`);
  }
}
