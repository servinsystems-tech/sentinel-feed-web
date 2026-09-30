import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const html = readFileSync(new URL('index.html', root), 'utf8');
const app = readFileSync(new URL('app.js', root), 'utf8');
const imageURL = 'https://getsentinelfeed.com/assets/og-sentinelfeed.png';
const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
function meta(attribute, name) {
  const tag = [...html.matchAll(/<meta\b[^>]+>/g)].map(match => match[0])
    .find(value => value.includes(`${attribute}="${name}"`));
  return tag?.match(/content="([^"]*)"/)?.[1];
}

test('the hero describes attention without promising a confirmed patch', () => {
  assert.match(html, /<p class="lead">A focused audio briefing on critical vulnerabilities, why they matter, and what deserves attention next\. Built for security leaders with decisions to make\.<\/p>/);
  assert.doesNotMatch(html, /what to patch next/);
});

test('a fixed MP3 is available through accessible native controls without autoplay', () => {
  const audio = html.match(/<audio\b[^>]*>[\s\S]*?<\/audio>/)?.[0];
  assert.ok(audio);
  assert.match(audio, /\bcontrols\b/);
  assert.match(audio, /preload="none"/);
  assert.doesNotMatch(audio, /\bautoplay\b/);
  for (const name of ['label', 'description']) {
    assert.match(audio, new RegExp(`aria-${name === 'label' ? 'labelledby' : 'describedby'}="audio-demo-${name}"`));
    assert.ok(html.includes(`id="audio-demo-${name}"`));
  }
  assert.match(audio, /<source src="assets\/sentinelfeed-audio-demo\.mp3" type="audio\/mpeg">/);
  const path = new URL('assets/sentinelfeed-audio-demo.mp3', root);
  assert.ok(existsSync(path));
  assert.ok(statSync(path).size > 1000);
  assert.equal(readFileSync(path).subarray(0, 3).toString(), 'ID3');
});

test('the demo and its transcript explicitly describe a fictional, non-current scenario', () => {
  assert.match(text, /Illustrative audio demo — fictional scenario/);
  assert.match(text, /this is not the current daily briefing or a real vulnerability alert/);
  const transcript = html.match(/<details class="demo-transcript">([\s\S]*?)<\/details>/)?.[1];
  assert.ok(transcript);
  assert.match(transcript, /The gateway and scenario are fictional/);
  assert.match(transcript, /This is not today's daily briefing/);
  assert.match(transcript, /internet-facing gateway/);
  assert.match(transcript, /It reports no real vulnerability and is not a current security alert/);
  assert.doesNotMatch(transcript, /CVE-\d{4}-\d+/);
});

test('the demo does not publish or reference private daily production audio', () => {
  assert.equal(existsSync(new URL('data/daily_brief.mp3', root)), false);
  assert.doesNotMatch(html + app, /data\/daily_brief\.mp3|https?:\/\/[^\s"'<>]*daily_brief\.mp3|r2\.cloudflarestorage\.com|X-Amz-(?:Signature|Credential)/i);
});

test('social previews reference the absolute URL of a real 1200 by 630 PNG', () => {
  const png = readFileSync(new URL('assets/og-sentinelfeed.png', root));
  assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.equal(png.subarray(12, 16).toString(), 'IHDR');
  assert.equal(png.readUInt32BE(16), 1200);
  assert.equal(png.readUInt32BE(20), 630);
  assert.equal(meta('property', 'og:image'), imageURL);
  assert.equal(meta('property', 'og:image:width'), '1200');
  assert.equal(meta('property', 'og:image:height'), '630');
  assert.equal(meta('property', 'og:image:type'), 'image/png');
  assert.equal(meta('name', 'twitter:card'), 'summary_large_image');
  assert.equal(meta('name', 'twitter:image'), imageURL);
  assert.equal(meta('name', 'twitter:title'), meta('property', 'og:title'));
  assert.equal(meta('name', 'twitter:description'), meta('property', 'og:description'));
});

test('the JSON example retains the null explanation and clarifies KEV false', () => {
  assert.match(text, /null means a signal is unavailable/);
  assert.match(text, /actively_exploited reflects CISA KEV catalog status\. false does not prove that exploitation has never occurred\./);
});
