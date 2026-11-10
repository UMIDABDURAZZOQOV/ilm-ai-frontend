import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

// Use the project's compiler so this also runs on the existing Node 20 CI.
const source = readFileSync(new URL('../src/lib/test-mode-visibility.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
});
const { shouldShowTestModeBanner } = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`
);

test('public privacy policy does not receive the interactive beta banner', () => {
  assert.equal(shouldShowTestModeBanner('/privacy'), false);
  assert.equal(shouldShowTestModeBanner('/privacy/'), false);
  assert.equal(shouldShowTestModeBanner(null), false);
});

test('interactive beta pages retain their test notice', () => {
  for (const path of ['/', '/login', '/learn', '/privacy-tools']) {
    assert.equal(shouldShowTestModeBanner(path), true);
  }
});
