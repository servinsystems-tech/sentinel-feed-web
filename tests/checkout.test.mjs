import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const script = readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const config = JSON.parse(html.match(/<script id="checkout-config" type="application\/json">([^<]+)<\/script>/)?.[1] ?? 'null');
const prices = {
  personal: 'pri_01m3pmg6kkhdcqbcads8btv6h4',
  team: 'pri_01m3pmj4p2aj0sqygr72x87dhb',
  enterprise: 'pri_01m3pmkpk1ayprw9a1z537z72z',
};

test('the public checkout contains only the intended live plan configuration', () => {
  assert.equal(config.environment, 'production');
  assert.match(config.token, /^live_[a-f0-9]+$/);
  assert.deepEqual(config.prices, prices);
  assert.deepEqual([...html.matchAll(/data-plan="([^"]+)"/g)].map(match => match[1]), Object.keys(prices));
  assert.doesNotMatch(html, /PRE-LAUNCH PREVIEW|Checkout is in test mode|\btest_[a-z0-9]+|pri_01m2xb/);
  assert.doesNotMatch(html + script, /paddle_api_key|pdl_(?:live|sdbx)_/i);
});

test('only Individual advertises the seven-day trial', () => {
  assert.match(html, /Individual[\s\S]*?7-day free trial\. Then \$99\/month unless cancelled before the trial ends\./);
  assert.match(html, /Teams[\s\S]*?\$349[\s\S]*?No free trial\./);
  assert.match(html, /Enterprise[\s\S]*?\$999[\s\S]*?No free trial\./);
  assert.match(html, /Only Individual includes a 7-day free trial/);
});

test('each plan button opens exactly its own price in production without a sandbox call', async () => {
  const opened = [];
  const buttons = Object.keys(prices).map(plan => ({
    dataset: { plan },
    addEventListener(_event, handler) { this.click = handler; },
    setAttribute() {},
    removeAttribute() {},
  }));
  const status = { textContent: '', scrollIntoView() {} };
  const paddle = {
    Environment: { set() { throw new Error('sandbox mode must not be selected'); } },
    Initialize({ token }) { assert.equal(token, config.token); },
    Checkout: { open({ items }) { opened.push(items); } },
  };
  const document = {
    querySelector(selector) {
      if (selector === '#checkout-config') return { textContent: JSON.stringify(config) };
      if (selector === '#checkout-status') return status;
      return null;
    },
    querySelectorAll() { return buttons; },
    addEventListener() {},
    createElement() { return { remove() {} }; },
    head: { appendChild(sdk) { queueMicrotask(() => sdk.onload()); } },
  };
  vm.runInNewContext(script, { document, window: { Paddle: paddle }, setTimeout: () => 1, clearTimeout });
  for (const button of buttons) await button.click();
  assert.deepEqual(JSON.parse(JSON.stringify(opened)), Object.values(prices).map(priceId => [{ priceId, quantity: 1 }]));
});
