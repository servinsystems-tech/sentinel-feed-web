import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
test('the public site does not ship the production daily MP3 or link to it', () => {
  assert.equal(existsSync(new URL('data/daily_brief.mp3', root)), false);
  for (const path of ['index.html', 'app.js', 'README.md']) {
    assert.doesNotMatch(readFileSync(new URL(path, root), 'utf8'), /data\/daily_brief\.mp3/);
  }
});
