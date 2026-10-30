import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from 'playwright';

const url = process.env.OKUMA_TEST_URL ?? 'http://127.0.0.1:4173';
const screenshots = await mkdtemp(join(tmpdir(), 'okuma-journey-'));
const browser = await chromium.launch({ channel: process.platform === 'win32' ? 'msedge' : undefined });
const problems = [];

async function checkLayout(page, name, screenshot = false) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => [...document.querySelectorAll('.reward')].every((element) => Number(getComputedStyle(element).opacity) > 0.99));
  const layout = await page.evaluate(() => ({
    width: innerWidth, height: innerHeight,
    scrollWidth: document.documentElement.scrollWidth,
    scrollHeight: document.documentElement.scrollHeight,
  }));
  assert.ok(layout.scrollWidth <= layout.width + 1, `${name}: horizontal overflow ${JSON.stringify(layout)}`);
  if (layout.width >= 900 && layout.height >= 600) {
    assert.ok(layout.scrollHeight <= layout.height + 1, `${name}: desktop overflow ${JSON.stringify(layout)}`);
  }
  if (screenshot) await page.screenshot({ path: join(screenshots, `${name}.png`), fullPage: true });
}

async function navigate(page, screen) {
  await page.evaluate(async (screen) => {
    const { useApp } = await import('/src/store/app.ts');
    useApp.getState().go(screen);
  }, screen);
}

async function finishQuestions(page, retry = false) {
  const data = await page.evaluate(async () => {
    const { getTextById } = await import('/src/content/loader.ts');
    const { useApp } = await import('/src/store/app.ts');
    const { default: i18n } = await import('/src/i18n/index.ts');
    return { questions: getTextById(useApp.getState().textId).questions, next: i18n.t('question.next'), check: i18n.t('question.check'), yes: i18n.t('question.true'), no: i18n.t('question.false'), up: i18n.t('question.moveUp') };
  });
  for (const question of data.questions) {
    await page.getByRole('heading', { name: question.prompt, exact: true }).waitFor();
    if (question.type === 'ordering') {
      for (let target = 0; target < question.items.length; target++) {
        const labels = await page.locator('.order-label').allTextContents();
        const current = labels.indexOf(question.items[target]);
        for (let position = current; position > target; position--) {
          await page.locator('.order-item').filter({ hasText: question.items[target] }).getByRole('button', { name: data.up }).click();
        }
      }
      await page.getByRole('button', { name: data.check, exact: true }).click();
    } else {
      const answer = question.type === 'trueFalse' ? (question.answer ? data.yes : data.no) : question.options[question.answer];
      await page.getByRole('button', { name: answer, exact: true }).click();
    }
    await page.getByRole('button', { name: data.next, exact: true }).click();
  }
  if (retry) {
    await page.locator('[role="alert"] button').click();
  }
  await page.locator('.result-screen').waitFor();
}

try {
  for (const lang of ['tr', 'de']) {
    const context = await browser.newContext({ viewport: { width: 1024, height: 600 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    page.on('pageerror', (error) => problems.push(error.message));
    await page.goto(url);
    const seed = await page.evaluate(async (lang) => {
      const { db } = await import('/src/db/db.ts');
      const { getLevelTexts } = await import('/src/content/loader.ts');
      const { useApp } = await import('/src/store/app.ts');
      const { setUiLanguage } = await import('/src/i18n/index.ts');
      await setUiLanguage(lang);
      const texts = getLevelTexts(lang, '10-13').flatMap((group) => group.texts);
      const id = await db.profiles.add({ name: 'Deniz Test', avatar: '🏴‍☠️', lang, ageGroup: '10-13', targetWpm: 150, createdAt: 1700000000000 });
      await db.sessions.bulkAdd(texts.slice(0, -1).map((text) => ({ profileId: id, lang, textId: text.id, mode: 'explore', wordCount: text.wordCount, activeMs: 120000, wpm: 150, comprehension: 1, effectiveWpm: 150, score: 150, targetWpm: 150, createdAt: Date.now() - 200000 })));
      useApp.getState().selectProfile(id, 'home');
      return { id, title: texts.at(-1).title, total: texts.length };
    }, lang);
    await page.locator('.home-screen').waitFor();
    await checkLayout(page, `${lang}-home`, true);
    await page.locator('.journey-link').click();
    await page.locator('.journey-checklist').waitFor();
    assert.equal(await page.locator('.activity-tile button:disabled').count(), 2);
    await checkLayout(page, `${lang}-locked`);
    await page.locator('.journey-checklist .btn').click();
    await page.locator('.library-screen').waitFor();
    assert.match(await page.getByRole('tab', { selected: true }).innerText(), /5/);
    await checkLayout(page, `${lang}-library`);
    await page.locator('.text-pick').filter({ hasText: seed.title }).click();
    await page.locator('.btn.big').click();
    await page.locator('.reading').waitFor();
    await checkLayout(page, `${lang}-reading`);
    await page.locator('.btn.big').click();
    await checkLayout(page, `${lang}-questions`);
    await finishQuestions(page);
    const summary = await page.evaluate(async () => (await import('/src/store/app.ts')).useApp.getState().playSummary);
    assert.equal(summary.comprehension, 1);
    assert.deepEqual(summary.milestones, { levels: [5], island: true, journey: true });
    await checkLayout(page, `${lang}-final-result`, true);
    await page.locator('.result-actions button').first().click();
    await page.locator('.certificate').waitFor();
    await page.locator('.gift-reveal').click();
    const gift = await page.locator('.certificate-gift strong').innerText();
    await checkLayout(page, `${lang}-certificate`, true);
    await page.emulateMedia({ media: 'print' });
    assert.equal(await page.locator('.journey-activities').isVisible(), false);
    assert.equal(await page.locator('.certificate').isVisible(), true);
    await page.emulateMedia({ media: 'screen' });
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: width >= 900 ? 900 : 844 });
      await checkLayout(page, `${lang}-certificate-${width}`, true);
    }
    await page.reload();
    await page.evaluate(async ({ id, lang }) => {
      const { setUiLanguage } = await import('/src/i18n/index.ts');
      await setUiLanguage(lang);
      (await import('/src/store/app.ts')).useApp.getState().selectProfile(id, 'journey');
    }, { id: seed.id, lang });
    await page.locator('.gift-reveal').click();
    assert.equal(await page.locator('.certificate-gift strong').innerText(), gift);
    await page.setViewportSize({ width: 1024, height: 600 });
    await page.locator('.activity-tile button').first().click();
    await page.locator('.btn.big').click();
    await page.locator('.reading').waitFor();
    page.once('dialog', (dialog) => dialog.dismiss());
    await page.locator('.run-header button').click();
    assert.equal(await page.locator('.reading').count(), 1);
    page.once('dialog', (dialog) => dialog.accept());
    await page.locator('.run-header button').click();
    await page.locator('.journey-screen').waitFor();
    const countAfterExit = await page.evaluate(async () => (await import('/src/db/db.ts')).db.sessions.count());
    assert.equal(countAfterExit, seed.total);
    await page.locator('.activity-tile button').first().click();
    await page.locator('.btn.big').click();
    await page.locator('.reading .btn.big').click();
    await page.evaluate(async () => {
      const { db } = await import('/src/db/db.ts');
      const original = db.transaction.bind(db);
      db.transaction = (...args) => {
        db.transaction = original;
        return Promise.reject(new Error('Simulated storage failure'));
      };
    });
    await finishQuestions(page, true);
    const activitySummary = await page.evaluate(async () => (await import('/src/store/app.ts')).useApp.getState().playSummary);
    assert.deepEqual(activitySummary.milestones, { levels: [], island: false, journey: false });
    await page.locator('.result-actions button').last().click();
    await page.locator('.journey-screen').waitFor();
    await navigate(page, 'placement');
    await page.locator('.card .btn.primary').click();
    await page.locator('.btn.big').click();
    await page.locator('.reading .btn.big').click();
    await page.locator('.question').waitFor();
    page.once('dialog', (dialog) => dialog.accept());
    await page.locator('.run-header button').click();
    await page.locator('.home-screen').waitFor();
    const countAfterPlacementExit = await page.evaluate(async () => (await import('/src/db/db.ts')).db.sessions.count());
    assert.equal(countAfterPlacementExit, seed.total + 1);
    for (const mode of ['pacer', 'rsvp', 'voice']) {
      await page.evaluate(async ({ mode, lang }) => {
        if (mode === 'voice') {
          window.qaMic = { starts: 0, aborts: 0 };
          window.SpeechRecognition = class {
            start() { window.qaMic.starts++; }
            abort() { window.qaMic.aborts++; }
          };
        }
        const { useApp } = await import('/src/store/app.ts');
        const { getLevelTexts } = await import('/src/content/loader.ts');
        useApp.getState().chooseMode(mode);
        useApp.getState().startPlay(getLevelTexts(lang, '10-13')[0].texts[0].id);
      }, { mode, lang });
      await page.locator('.btn.big').click();
      await page.locator('.reading').waitFor();
      await checkLayout(page, `${lang}-${mode}`);
      page.once('dialog', (dialog) => dialog.accept());
      await page.locator('.run-header button').click();
      await page.locator('.library-screen').waitFor();
      if (mode === 'voice') {
        const microphone = await page.evaluate(() => window.qaMic);
        assert.ok(microphone.starts > 0 && microphone.aborts === microphone.starts, 'Microphone must stop on exit');
      }
    }
    const finalCount = await page.evaluate(async () => (await import('/src/db/db.ts')).db.sessions.count());
    assert.equal(finalCount, seed.total + 1);
    await context.close();
    console.log(`${lang}: completion, stable gift, print, activities, save retry, all-mode exit, microphone cleanup and responsive layouts passed`);
  }
  assert.deepEqual(problems, [], 'Browser errors');
  console.log(`Screenshots: ${screenshots}`);
} catch (error) {
  const page = browser.contexts().at(-1)?.pages().at(-1);
  if (page) {
    console.error(await page.locator('body').innerText());
    await page.screenshot({ path: join(screenshots, 'failure.png'), fullPage: true });
  }
  console.error({ problems, screenshots });
  throw error;
} finally {
  await browser.close();
}