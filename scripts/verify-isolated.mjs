import {spawn} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {config} from 'dotenv';
import {neon} from '@neondatabase/serverless';
config({path: '.env.local', quiet: true});

const schema = `falak_verify_${randomBytes(6).toString('hex')}`;
if (!/^falak_verify_[a-f0-9]{12}$/.test(schema)) throw new Error('Invalid verification schema');
const sql = neon(process.env.DATABASE_URL);
const scoped = value => {const url = new URL(value); url.searchParams.set('schema', schema); return url.toString();};
const origin = 'http://localhost:3123';
const env = {...process.env, DATABASE_URL: scoped(process.env.DATABASE_URL), DIRECT_URL: scoped(process.env.DIRECT_URL || process.env.DATABASE_URL), SITE_URL: origin, BETTER_AUTH_URL: origin, TEST_BASE_URL: origin, NEXT_DIST_DIR: '.next/verification', ADMIN_EMAIL: 'verify-admin@example.com', ADMIN_PASSWORD: randomBytes(24).toString('base64url'), BETTER_AUTH_SECRET: randomBytes(48).toString('hex'), CONTENT_ADMIN_PIN: '12345', CONTENT_SESSION_SECRET: randomBytes(48).toString('hex'), RESEND_API_KEY: '', TWILIO_ACCOUNT_SID: '', TWILIO_AUTH_TOKEN: '', STRIPE_SECRET_KEY: '', STRIPE_WEBHOOK_SECRET: ''};
let server;
let logs = '';
function run(args) {return new Promise((resolve, reject) => {const child = spawn(process.execPath, args, {env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe']}); let output = ''; child.stdout.on('data', data => {output += data;}); child.stderr.on('data', data => {output += data;}); child.on('error', reject); child.on('exit', code => {if (code) reject(new Error(output)); else {console.log(output.trim()); resolve();}});});}
try {
  await sql.query(`CREATE SCHEMA "${schema}"`);
  console.log('Created isolated verification schema; public application data is unchanged.');
  await run(['node_modules/prisma/build/index.js', 'migrate', 'deploy']);
  await run(['node_modules/tsx/dist/cli.mjs', 'prisma/seed.ts']);
  if (process.env.VERIFY_PRODUCTION === 'true') await run(['node_modules/next/dist/bin/next', 'build']);
  server = spawn(process.execPath, ['node_modules/next/dist/bin/next', process.env.VERIFY_PRODUCTION === 'true' ? 'start' : 'dev', '-p', '3123'], {env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe']});
  server.stdout.on('data', data => {logs += data;}); server.stderr.on('data', data => {logs += data;});
  const deadline = Date.now() + 90000;
  let ready = false;
  while (Date.now() < deadline) {if (server.exitCode !== null) throw new Error(logs); try {ready = (await fetch(`${origin}/api/content`)).ok; if (ready) break;} catch {} await new Promise(resolve => setTimeout(resolve, 300));}
  if (!ready) throw new Error(`Verification server did not start: ${logs}`);
  if (process.env.VERIFY_BROWSER_ONLY !== 'true') await run(['--test', '--test-concurrency=1', 'tests/integration/backend.test.mjs', 'tests/integration/content.test.mjs']);
  await run(['tests/unsaved-changes.browser.mjs']);
  console.log(process.env.VERIFY_BROWSER_ONLY === 'true' ? 'Isolated browser verification passed.' : 'Isolated database and browser verification passed.');
} finally {
  if (server && server.exitCode === null) {const ended = new Promise(resolve => server.once('exit', resolve)); server.kill(); await ended;}
  await sql.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
  console.log('Removed the temporary verification schema.');
}
