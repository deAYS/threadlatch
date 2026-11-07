import { access, realpath } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { delimiter, isAbsolute, join, resolve } from 'node:path';

/** Resolve installed Node entry points only; never execute a shell or project-local shim. */
export async function resolveCliRunner(root: string, searchPath = process.env.PATH ?? '') {
  try {
    return createRequire(resolve(root, 'package.json')).resolve(
      'threadlatch/dist-cli/cli/index.js',
    );
  } catch {
    /* A global npm installation may be available on PATH. */
  }
  for (const directory of searchPath.split(delimiter).filter(isAbsolute)) {
    const candidates = [
      join(directory, 'node_modules/threadlatch/dist-cli/cli/index.js'),
      resolve(directory, '../lib/node_modules/threadlatch/dist-cli/cli/index.js'),
      resolve(directory, '../threadlatch/dist-cli/cli/index.js'),
    ];
    // npm uses a symlink on POSIX; resolve it but never run arbitrary PATH wrappers.
    try {
      const linked = await realpath(join(directory, 'threadlatch'));
      if (linked.endsWith(join('threadlatch', 'dist-cli', 'cli', 'index.js')))
        candidates.unshift(linked);
    } catch {
      /* No npm link in this PATH entry. */
    }
    for (const candidate of candidates) {
      try {
        await access(candidate);
        return candidate;
      } catch {
        /* Continue to the next npm layout. */
      }
    }
  }
  return null;
}
