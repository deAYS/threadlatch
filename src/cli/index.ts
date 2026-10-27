#!/usr/bin/env node
import { createInterface } from 'node:readline/promises';
import { runCli } from './commands.js';
const readStdin = async () => { const chunks: Buffer[] = []; let size = 0; for await (const chunk of process.stdin) { const b = Buffer.from(chunk); size += b.length; if (size > 10 * 1_048_576) throw new Error('Input size limit exceeded.'); chunks.push(b); } return Buffer.concat(chunks).toString('utf8'); };
const ask = process.stdin.isTTY ? async (question: string) => { const rl = createInterface({ input: process.stdin, output: process.stderr }); try { return await rl.question(question); } finally { rl.close(); } } : undefined;
process.exitCode = await runCli(process.argv.slice(2), { cwd: process.cwd(), stdout: s => { process.stdout.write(s); }, stderr: s => { process.stderr.write(s); }, stdin: readStdin, ask });
