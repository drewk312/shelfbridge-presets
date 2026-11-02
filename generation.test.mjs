import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, cpSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

test('release output is reproducible across calendar dates and checks registry drift', () => {
  const dir = mkdtempSync(join(tmpdir(),'shelfbridge-build-'));
  const root = fileURLToPath(new URL('.',import.meta.url));
  try {
    cpSync(root,dir,{recursive:true,filter:p=>!p.includes('.git') && !p.includes('.superpowers')});
    const build = day => spawnSync(process.execPath,[
      '--import','data:text/javascript,'+encodeURIComponent(
        'const Original=Date; globalThis.Date=class extends Original {constructor(...args){super(...(args.length?args:['+JSON.stringify(day)+']));}static now(){return new Original('+JSON.stringify(day)+').valueOf();}}'
      ),'build.mjs'
    ],{cwd:dir,encoding:'utf8'});
    assert.equal(build('2027-01-01T00:00:00Z').status,0);
    const before=readFileSync(join(dir,'catalog.json'),'utf8');
    assert.equal(build('2027-01-02T00:00:00Z').status,0);
    assert.equal(readFileSync(join(dir,'catalog.json'),'utf8'),before,'time must not change catalog bytes');
    writeFileSync(join(dir,'preset-registry.mjs'),'// stale registry\n');
    const check=spawnSync(process.execPath,['build.mjs','--check'],{cwd:dir,encoding:'utf8'});
    assert.equal(check.status,1,'the unified check must detect registry drift');
    assert.match(check.stderr,/preset-registry/);
  } finally { rmSync(dir,{recursive:true,force:true}); }
});
