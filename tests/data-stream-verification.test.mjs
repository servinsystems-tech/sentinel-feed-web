import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { Script } from 'node:vm';

const root = new URL('../', import.meta.url);
const read = path => readFileSync(new URL(path, root));
const html = read('index.html').toString('utf8');
const page = read('data-stream-verification.html').toString('utf8');
const key = 'teEskjes9wFF06PkLWaxrSEbHJimNZ5jp2N7zWb7Qw4=';
const fingerprint = 'sha256:3e53c9f279b608978521694456010db11108fa1652e86bc245206cf017c88745';

test('published identity files have exact bytes and the fingerprint hashes the decoded public key', () => {
  assert.deepEqual(read('keys/sf-ed25519-v1-public-key.txt'), Buffer.from(`${key}\n`));
  assert.deepEqual(read('keys/sf-ed25519-v1-fingerprint.txt'), Buffer.from(`${fingerprint}\n`));
  const raw = Buffer.from(key, 'base64');
  assert.equal(raw.length, 32);
  assert.equal(raw.toString('base64'), key);
  assert.equal('sha256:' + createHash('sha256').update(raw).digest('hex'), fingerprint);
});

test('public guide binds the key ID, stable URLs, raw-body protocol, and replay checks', () => {
  assert.match(page, /sf-ed25519-v1/);
  assert.match(page, /https:\/\/getsentinelfeed\.com\/keys\/sf-ed25519-v1-public-key\.txt/);
  assert.match(page, /https:\/\/getsentinelfeed\.com\/keys\/sf-ed25519-v1-fingerprint\.txt/);
  assert.match(page, /ASCII\(timestamp\) \+ "\." \+ ASCII\(delivery_id\) \+ "\." \+ raw_body/);
  for (const header of ['X-SentinelFeed-Signature', 'X-SentinelFeed-Timestamp', 'X-SentinelFeed-Delivery-Id', 'X-SentinelFeed-Key-Id', 'X-SentinelFeed-Event']) {
    assert.ok(page.includes(header));
  }
  for (const value of [key, fingerprint, 'daily-vulnerability-brief', 'application/json', '±5 minutes', 'raw HTTP request bytes']) {
    assert.ok(page.includes(value));
  }
  assert.match(page, /same timestamp, ID, body and signature/i);
  assert.match(page, /atomically record the Delivery ID/);
  assert.match(page, /only now trust\/parse the JSON/);
  const examples = [...page.matchAll(/<pre class="verification-code"><code>([\s\S]*?)<\/code><\/pre>/g)];
  assert.equal(examples.length, 3);
  new Script(examples[2][1].replaceAll('&amp;', '&').replaceAll('&lt;', '<').replaceAll('&gt;', '>'));
});

test('Enterprise copy links the guide and checkout remains on the exact three live prices', () => {
  const enterprise = html.match(/<article class="plan"><p class="eyebrow">FOR TEAMS THAT AUTOMATE[\s\S]*?<\/article>/)?.[0];
  assert.ok(enterprise);
  assert.match(enterprise, /Cryptographically signed Data Stream deliveries/);
  assert.match(enterprise, /href="data-stream-verification\.html">Verify Data Stream signatures/);
  assert.match(html, /href="data-stream-verification\.html">Data Stream verification/);
  const config = JSON.parse(html.match(/<script id="checkout-config" type="application\/json">([^<]+)<\/script>/)?.[1] ?? 'null');
  assert.deepEqual(config, {
    environment: 'production', token: 'live_7395424bad626fbc2c4f37e795d',
    prices: {
      personal: 'pri_01m3pmg6kkhdcqbcads8btv6h4',
      team: 'pri_01m3pmj4p2aj0sqygr72x87dhb',
      enterprise: 'pri_01m3pmkpk1ayprw9a1z537z72z',
    },
  });
  assert.doesNotMatch(html + read('app.js').toString('utf8'), /\btest_[a-z0-9]+\b|pri_01[a-z0-9]{22}.*sandbox/i);
});

test('served files contain only the public signing identity', () => {
  const served = [html, page, read('keys/sf-ed25519-v1-public-key.txt').toString(), read('keys/sf-ed25519-v1-fingerprint.txt').toString()].join('\n');
  assert.doesNotMatch(served, new RegExp('DATA_STREAM_SIGNING_' + 'PRIVATE_KEY|BEGIN ' + 'PRIVATE KEY|private' + '-key', 'i'));
});
