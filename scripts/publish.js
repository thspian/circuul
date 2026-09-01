#!/usr/bin/env node
/**
 * Bump + publish @thspian/circuul-{core,react,react-native} in order.
 *
 * Usage:
 *   npm run release -- --otp=123456
 *   npm run release -- patch --otp=123456
 *   npm run release -- minor --otp=123456
 *   npm run release -- --no-bump --otp=123456   # publish current versions as-is
 *
 * OTP can also be set via NPM_OTP.
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const PACKAGES = [
  { dir: 'packages/core', name: '@thspian/circuul-core' },
  { dir: 'packages/react', name: '@thspian/circuul-react' },
  { dir: 'packages/react-native', name: '@thspian/circuul-react-native' },
];

function parseArgs(argv) {
  let bump = 'patch';
  let noBump = false;
  let otp = process.env.NPM_OTP || '';
  let dryRun = false;

  for (const arg of argv) {
    if (arg === '--no-bump') noBump = true;
    else if (arg === '--dry-run') dryRun = true;
    else if (arg.startsWith('--otp=')) otp = arg.slice('--otp='.length);
    else if (arg === 'patch' || arg === 'minor' || arg === 'major') bump = arg;
    else if (arg === '--help' || arg === '-h') {
      console.log(`Usage: npm run release -- [patch|minor|major] [--otp=CODE] [--no-bump] [--dry-run]`);
      process.exit(0);
    }
  }
  return { bump, noBump, otp, dryRun };
}

function readPkg(rel) {
  const file = path.join(ROOT, rel, 'package.json');
  return { file, json: JSON.parse(fs.readFileSync(file, 'utf8')) };
}

function writePkg(file, json) {
  fs.writeFileSync(file, `${JSON.stringify(json, null, 2)}\n`);
}

function bumpSemver(version, type) {
  const parts = String(version).split('.').map((n) => parseInt(n, 10));
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    throw new Error(`Invalid semver: ${version}`);
  }
  let [major, minor, patch] = parts;
  if (type === 'major') {
    major += 1;
    minor = 0;
    patch = 0;
  } else if (type === 'minor') {
    minor += 1;
    patch = 0;
  } else {
    patch += 1;
  }
  return `${major}.${minor}.${patch}`;
}

function run(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, {
    cwd: opts.cwd || ROOT,
    stdio: 'inherit',
    env: process.env,
    shell: false,
  });
  if (res.status !== 0) {
    process.exit(res.status || 1);
  }
}

const { bump, noBump, otp, dryRun } = parseArgs(process.argv.slice(2));

if (!otp && !dryRun) {
  console.error('Missing OTP. Pass --otp=XXXXXX or set NPM_OTP.');
  process.exit(1);
}

const core = readPkg(PACKAGES[0].dir);
const nextVersion = noBump
  ? core.json.version
  : bumpSemver(core.json.version, bump);

console.log(
  noBump
    ? `Publishing current version ${nextVersion} (no bump)`
    : `Bumping ${core.json.version} → ${nextVersion} (${bump})`
);

for (const pkg of PACKAGES) {
  const { file, json } = readPkg(pkg.dir);
  json.version = nextVersion;
  if (json.dependencies && json.dependencies['@thspian/circuul-core']) {
    json.dependencies['@thspian/circuul-core'] = `^${nextVersion}`;
  }
  if (!dryRun) writePkg(file, json);
  console.log(`  ${pkg.name}@${nextVersion}`);
}

if (dryRun) {
  console.log('Dry run only — no files written, nothing published.');
  process.exit(0);
}

for (const pkg of PACKAGES) {
  console.log(`\n→ Publishing ${pkg.name}@${nextVersion}`);
  run(
    'npm',
    ['publish', '--access', 'public', `--otp=${otp}`],
    { cwd: path.join(ROOT, pkg.dir) }
  );
}

console.log(`\nDone. Published @thspian/circuul-{core,react,react-native}@${nextVersion}`);
console.log('Commit the version bumps and push when ready.');
