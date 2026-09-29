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

function harness() {
  const opened = [];
  const buttons = Object.keys(prices).map(plan => ({
    dataset: { plan },
    addEventListener(_event, handler) { this.click = handler; },
    setAttribute() {},
    removeAttribute() {},
  }));
  const status = { textContent: '', scrollIntoView() {} };
  function form(count) {
    const inputs = Array.from({ length: count }, () => ({ value: '', focus() {} }));
    const submitButton = { setAttribute() {}, removeAttribute() {} };
    return {
      hidden: true, inputs, submitButton, scrollIntoView() {},
      addEventListener(_event, handler) { this.submit = handler; },
      querySelector(selector) { return selector === 'input' ? inputs[0] : submitButton; },
      querySelectorAll() { return inputs; },
    };
  }
  const team = form(4);
  const enterprise = form(1);
  const paddle = {
    Environment: { set() { throw new Error('sandbox mode must not be selected'); } },
    Initialize({ token }) { assert.equal(token, config.token); },
    Checkout: { open(checkout) { opened.push(JSON.parse(JSON.stringify(checkout))); } },
  };
  const document = {
    querySelector(selector) {
      if (selector === '#checkout-config') return { textContent: JSON.stringify(config) };
      if (selector === '#checkout-status') return status;
      if (selector === '#team-setup') return team;
      if (selector === '#enterprise-setup') return enterprise;
      return null;
    },
    querySelectorAll() { return buttons; },
    addEventListener() {},
    createElement() { return { remove() {} }; },
    head: { appendChild(sdk) { queueMicrotask(() => sdk.onload()); } },
  };
  vm.runInNewContext(script, { document, window: { Paddle: paddle }, URL, setTimeout: () => 1, clearTimeout });
  const flush = () => new Promise(resolve => setImmediate(resolve));
  const submit = form => form.submit({ preventDefault() {} });
  return { opened, buttons, team, enterprise, status, flush, submit };
}

test('Individual opens its own price immediately; other plans require setup', async () => {
  const h = harness();
  h.buttons[0].click();
  await h.flush();
  assert.deepEqual(h.opened, [{ items: [{ priceId: prices.personal, quantity: 1 }] }]);
  h.buttons[1].click();
  h.buttons[2].click();
  await h.flush();
  assert.equal(h.opened.length, 1);
  assert.equal(h.enterprise.hidden, false);
});

test('Teams sends only up to four deduplicated additional emails as flat customData', async () => {
  const h = harness();
  h.buttons[1].click();
  h.team.inputs.forEach((input, index) => { input.value = `Member${index}@Example.com`; });
  h.submit(h.team);
  await h.flush();
  assert.deepEqual(h.opened, [{
    items: [{ priceId: prices.team, quantity: 1 }],
    customData: { sentinelfeed_plan: 'team', team_email_1: 'member0@example.com',
      team_email_2: 'member1@example.com', team_email_3: 'member2@example.com',
      team_email_4: 'member3@example.com' },
  }]);
  h.team.inputs[1].value = 'member0@example.com';
  h.submit(h.team);
  await h.flush();
  assert.equal(Object.keys(h.opened[1].customData).length, 4);
});

test('Teams with zero extras is valid; an invalid address or fifth extra cannot open checkout', async () => {
  const h = harness();
  h.buttons[1].click();
  h.submit(h.team);
  await h.flush();
  assert.deepEqual(h.opened[0].customData, { sentinelfeed_plan: 'team' });
  h.team.inputs[0].value = 'not-an-email';
  h.submit(h.team);
  await h.flush();
  assert.equal(h.opened.length, 1);
  h.team.inputs[0].value = 'bad<script>@example.com';
  h.submit(h.team);
  await h.flush();
  assert.equal(h.opened.length, 1);
  h.team.inputs[0].value = 'member0@example.com';
  h.team.inputs.push({ value: 'fifth@example.com', focus() {} });
  h.team.inputs.forEach((input,index) => { input.value = `member${index}@example.com`; });
  h.submit(h.team);
  await h.flush();
  assert.equal(h.opened.length, 1);
});

test('Enterprise requires a public HTTPS destination and sends it to its own checkout', async () => {
  const h = harness();
  h.buttons[2].click();
  for (const url of ['', 'http://security.example.com/feed', 'https:/security.example.com/feed',
    'https://security.example.com:0/feed', 'https://user:pass@security.example.com/feed',
    'https://@security.example.com/feed',
    'https://localhost/feed', 'https://127.0.0.1/feed', 'https://100.64.1.1/feed',
    'https://security.example.com/feed#secret', 'https://security.example.com/feed#']) {
    h.enterprise.inputs[0].value = url;
    h.submit(h.enterprise);
  }
  await h.flush();
  assert.equal(h.opened.length, 0);
  h.enterprise.inputs[0].value = 'https://security.example.com/sentinelfeed';
  h.submit(h.enterprise);
  await h.flush();
  assert.deepEqual(h.opened, [{
    items: [{ priceId: prices.enterprise, quantity: 1 }],
    customData: {
      sentinelfeed_plan: 'enterprise',
      data_stream_endpoint: 'https://security.example.com/sentinelfeed',
    },
  }]);
});
