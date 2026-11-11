import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import React from 'react';
import { act, create } from 'react-test-renderer';

const require = createRequire(import.meta.url);
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
function memoryStorage() {
  const data = new Map();
  return { data, getItem: key => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, String(value)), removeItem: key => data.delete(key) };
}

// Execute the actual TypeScript implementation; only telemetry and the browser
// boundary are synthetic. No test reaches a network or a real user's storage.
function harness() {
  const storage = memoryStorage();
  const cache = new Map();
  let auth = { user: { id: 101 }, isLoading: false };
  let fetchHandler = () => { throw new Error('Network forbidden in owned-cache regression'); };
  const listeners = new Map();
  const sandbox = { console, localStorage: storage, window: { localStorage: storage,
    addEventListener: (type, listener) => listeners.set(type, listener),
    removeEventListener: type => listeners.delete(type) }, process: { env: {} },
    performance, FormData, Date, setTimeout, clearTimeout,
    fetch: (...args) => fetchHandler(...args) };
  const context = vm.createContext(sandbox);
  function load(name) {
    let path = name.startsWith('@/') ? resolve(root, 'src', name.slice(2)) : resolve(root, name);
    if (!/\.tsx?$/.test(path)) {
      try { readFileSync(`${path}.ts`); path += '.ts'; } catch { path += '.tsx'; }
    }
    if (cache.has(path)) return cache.get(path).exports;
    const source = readFileSync(path, 'utf8');
    const output = ts.transpileModule(source, { compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    }}).outputText;
    const module = { exports: {} }; cache.set(path, module);
    function localRequire(id) {
      if (id === '@/hooks/useAuth') return { useAuth: () => auth };
      if (id === './sentry' || id === '@/lib/sentry') return { trackApiCall() {}, trackError() {}, setUserContext() {}, trackUserAction() {}, addBreadcrumb() {} };
      if (id === 'react' || id === 'react/jsx-runtime') return require(id);
      if (id === 'lucide-react') return new Proxy({}, { get: () => () => null });
      if (id === './QuestionTable') return { __esModule: true, default: () => null };
      if (id.startsWith('@/')) return load(id);
      if (id.startsWith('.')) return load(resolve(dirname(path), id));
      throw new Error(`Unexpected dependency ${id}`);
    }
    vm.runInContext(`(function(require,module,exports){${output}\n})`, context, { filename: path })(localRequire, module, module.exports);
    return module.exports;
  }
  const api = load('src/lib/api.ts');
  function owner(id) {
    auth = { user: id ? { id } : null, isLoading: false };
    if (id) api.saveSession({ id }); else api.clearSession();
  }
  owner(101);
  return { storage, load, owner, listeners, setFetch: handler => { fetchHandler = handler; } };
}
const plain = value => JSON.parse(JSON.stringify(value));

test('actual IELTS scores: A → logout → B → A never shares a band or deletes A', () => {
  const h = harness(), scores = h.load('src/lib/ieltsScores.ts');
  const result = { band: 7.5, correct: 33, total: 40, answered: 40 };
  scores.saveSkillResult(20, 1, 'reading', result, 101);
  assert.equal(scores.loadSkillResult(20, 1, 'reading').band, 7.5);
  h.owner(null); assert.equal(scores.loadSkillResult(20, 1, 'reading'), null);
  h.owner(202); assert.equal(scores.loadSkillResult(20, 1, 'reading'), null);
  scores.saveSkillResult(20, 1, 'reading', { ...result, band: 5 }, 202);
  scores.saveSkillResult(20, 1, 'reading', result, 101); // late account-A callback
  assert.equal(scores.loadSkillResult(20, 1, 'reading').band, 5);
  h.owner(101); assert.equal(scores.loadSkillResult(20, 1, 'reading').band, 7.5);
});

test('legacy unowned results are preserved but never assigned to a signed-in user', () => {
  const h = harness(), scores = h.load('src/lib/ieltsScores.ts');
  const legacy = JSON.stringify({ band: 9, answered: 40 });
  h.storage.setItem('ielts-score-20-1-reading', legacy);
  assert.equal(scores.loadSkillResult(20, 1, 'reading'), null);
  assert.equal(h.storage.getItem('ielts-score-20-1-reading'), legacy);
});

test('SAT handoff, annotations and bookmarks have separate owner namespaces', () => {
  const h = harness(), cache = h.load('src/lib/ownedStudyCache.ts');
  for (const resource of ['sat_session', 'annot-question-4', 'college_saved']) {
    cache.writeOwnedCache(h.storage, 101, resource, 'A');
    assert.equal(cache.readOwnedCache(h.storage, 202, resource), null);
    cache.writeOwnedCache(h.storage, 202, resource, 'B');
    cache.removeOwnedCache(h.storage, 202, resource);
    assert.equal(cache.readOwnedCache(h.storage, 101, resource), 'A');
  }
});

test('invalid owners never read/write and blocked browser storage is safe', () => {
  const h = harness(), cache = h.load('src/lib/ownedStudyCache.ts');
  for (const owner of [null, undefined, 0, -1, 1.5, NaN, '101']) {
    cache.writeOwnedCache(h.storage, owner, 'paper', 'private');
    assert.equal(cache.readOwnedCache(h.storage, owner, 'paper'), null);
  }
  assert.equal(h.storage.data.size, 1); // synthetic session only
  const blocked = { getItem() { throw Error('disabled'); }, setItem() { throw Error('quota'); }, removeItem() { throw Error('disabled'); } };
  assert.equal(cache.readOwnedCache(blocked, 101, 'paper'), null);
  assert.doesNotThrow(() => cache.writeOwnedCache(blocked, 101, 'paper', 'text'));
  assert.doesNotThrow(() => cache.removeOwnedCache(blocked, 101, 'paper'));
});

test('actual answer hook hides A during the first B render and rejects stale A setters', () => {
  const h = harness(), { useOwnedStudyAnswers } = h.load('src/hooks/useOwnedStudyAnswers.ts');
  const cache = h.load('src/lib/ownedStudyCache.ts');
  let state, view; const frames = [];
  function Probe({ owner, resource = 'paper' }) {
    state = useOwnedStudyAnswers(resource, owner);
    frames.push({ owner, answers: plain(state.answers) });
    return React.createElement('output', null, JSON.stringify(state.answers));
  }
  act(() => { view = create(React.createElement(Probe, { owner: 101 })); });
  act(() => state.setAnswers({ 1: 'A private answer' }));
  const lateA = state.setAnswers;
  act(() => view.update(React.createElement(Probe, { owner: 202 })));
  assert.ok(frames.filter(f => f.owner === 202).every(f => !Object.values(f.answers).includes('A private answer')));
  assert.deepEqual(plain(state.answers), {});
  act(() => state.setAnswers({ 1: 'B answer' }));
  act(() => lateA({ 1: 'late A' }));
  assert.deepEqual(plain(state.answers), { 1: 'B answer' });
  assert.equal(cache.readOwnedCache(h.storage, 101, 'paper'), '{"1":"A private answer"}');
  assert.equal(cache.readOwnedCache(h.storage, 202, 'paper'), '{"1":"B answer"}');
  act(() => view.update(React.createElement(Probe, { owner: 101 })));
  assert.deepEqual(plain(state.answers), { 1: 'A private answer' });
  act(() => view.unmount());
});

test('actual hook survives remount, resource changes, corrupt/oversized/disabled cache', () => {
  const h = harness(), { useOwnedStudyAnswers } = h.load('src/hooks/useOwnedStudyAnswers.ts');
  const { studyCacheKey } = h.load('src/lib/ownedStudyCache.ts');
  let state, view;
  function Probe({ resource }) { state = useOwnedStudyAnswers(resource, 101); return null; }
  act(() => { view = create(React.createElement(Probe, { resource: 'one' })); });
  act(() => state.setAnswers({ 0: 'essay' }));
  act(() => view.unmount());
  act(() => { view = create(React.createElement(Probe, { resource: 'one' })); });
  assert.equal(state.answers[0], 'essay');
  for (const [resource, raw] of [['broken','{'], ['array','["bad"]'], ['huge','x'.repeat(500001)], ['filtered','{"1":"ok","bad":"ignored","2":42}']]) {
    h.storage.setItem(studyCacheKey(101, resource), raw);
    act(() => view.update(React.createElement(Probe, { resource })));
    assert.deepEqual(plain(state.answers), resource === 'filtered' ? { 1: 'ok' } : {});
  }
  h.storage.setItem = () => { throw Error('quota'); };
  act(() => state.setAnswers({ 4: 'not lost in memory' }));
  assert.equal(state.answers[4], 'not lost in memory');
  act(() => view.unmount());
});

test('actual SkillExam publishes only the signed-in owner after cache hydration', () => {
  const h = harness(), SkillExam = h.load('src/components/ielts/SkillExam.tsx').default;
  const scores = h.load('src/lib/ieltsScores.ts');
  let answer, view;
  const props = { storageKey: 'whole-paper', book: 20, test: 1, skill: 'reading',
    sections: [{ index: 1, label: 'Part 1', questions: [{ number: 1, correct_answer: 'cat' }] }],
    render: (_section, controls) => { answer = controls.onAnswerChange; return null; } };
  act(() => { view = create(React.createElement(SkillExam, props)); });
  act(() => answer(1, 'cat'));
  assert.equal(scores.loadSkillResult(20, 1, 'reading').correct, 1);
  h.owner(202);
  act(() => view.update(React.createElement(SkillExam, { ...props })));
  assert.equal(scores.loadSkillResult(20, 1, 'reading'), null);
  h.owner(101);
  act(() => view.update(React.createElement(SkillExam, { ...props })));
  assert.equal(scores.loadSkillResult(20, 1, 'reading').correct, 1);
  act(() => view.unmount());
});

for (const kind of ['Reading', 'Listening']) {
  test(`actual ${kind}Exam keeps own answers isolated and preserves parent-controlled mode`, () => {
    const h = harness(), Exam = h.load(`src/components/ielts/${kind}Exam.tsx`).default;
    const props = { storageKey: `${kind}-synthetic-paper`,
      passage: { section: 1, title: 'Synthetic passage', passage_text: 'Synthetic text' },
      section: { section: 1, title: 'Synthetic audio section' },
      questions: [{ id: 1, number: 1, question_type: 'completion', question_text: 'Synthetic gap', correct_answer: 'cat' }] };
    let view;
    act(() => { view = create(React.createElement(Exam, props)); });
    const input = () => view.root.findAllByType('input').find(n => n.props.type !== 'checkbox');
    assert.ok(input());
    act(() => input().props.onChange({ target: { value: 'private A' } }));
    assert.equal(input().props.value, 'private A');
    h.owner(202);
    act(() => view.update(React.createElement(Exam, { ...props })));
    assert.equal(input().props.value, '');
    const beforeControlled = new Map(h.storage.data);
    let parentAnswer;
    act(() => view.update(React.createElement(Exam, { ...props,
      answers: { 1: 'parent value' }, onAnswerChange: (number, value) => { parentAnswer = { number, value }; } })));
    assert.equal(input().props.value, 'parent value');
    act(() => input().props.onChange({ target: { value: 'new parent value' } }));
    assert.deepEqual(parentAnswer, { number: 1, value: 'new parent value' });
    assert.deepEqual(h.storage.data, beforeControlled);
    act(() => view.unmount());
  });
}

test('actual vocabulary progress remains separate after account switching', () => {
  const h = harness(), vocab = h.load('src/lib/vocabProgress.ts');
  vocab.setStatus('synthetic-word', 'mastered');
  h.owner(202); assert.equal(vocab.getStatus('synthetic-word'), 'new');
  vocab.setStatus('synthetic-word', 'learning');
  h.owner(101); assert.equal(vocab.getStatus('synthetic-word'), 'mastered');
});

test('delayed token refresh cannot resurrect A after logout or replace B session', async () => {
  for (const nextOwner of [null, 202]) {
    const h = harness(), api = h.load('src/lib/api.ts');
    api.saveSession({ id: 101, access_token: 'synthetic-A', refresh_token: 'synthetic-refresh-A' });
    let resolveRefresh, refreshStarted;
    const started = new Promise(resolve => { refreshStarted = resolve; });
    h.setFetch(async url => {
      if (url.endsWith('/auth/refresh')) {
        refreshStarted();
        return new Promise(resolve => { resolveRefresh = resolve; });
      }
      return { status: 401, ok: false, json: async () => ({ detail: 'expired' }) };
    });
    const request = api.apiFetch('/synthetic-private');
    await started;
    h.owner(nextOwner);
    resolveRefresh({ status: 200, ok: true, json: async () => ({ access_token: 'new-A', refresh_token: 'new-refresh-A' }) });
    await assert.rejects(request);
    assert.equal(api.getSession()?.id ?? null, nextOwner);
  }
});

test('a delayed private API response cannot render A data after B signs in', async () => {
  const h = harness(), api = h.load('src/lib/api.ts');
  let resolveRequest;
  h.setFetch(() => new Promise(resolve => { resolveRequest = resolve; }));
  const request = api.apiFetch('/synthetic-private');
  h.owner(202);
  resolveRequest({ status: 200, ok: true, json: async () => ({ owner: 101, private: 'synthetic A result' }) });
  await assert.rejects(request);
});

test('unchanged current account can refresh and receive its response normally', async () => {
  const h = harness(), api = h.load('src/lib/api.ts');
  api.saveSession({ id: 101, access_token: 'synthetic-expired', refresh_token: 'synthetic-refresh' });
  let requests = 0;
  h.setFetch(async (url, options) => {
    if (url.endsWith('/auth/refresh')) return { ok: true, json: async () => ({ access_token: 'synthetic-new', refresh_token: 'synthetic-new-refresh' }) };
    requests++;
    if (requests === 1) return { status: 401, ok: false, json: async () => ({}) };
    assert.equal(options.headers.Authorization, 'Bearer synthetic-new');
    return { status: 200, ok: true, json: async () => ({ owner: 101 }) };
  });
  assert.equal((await api.apiFetch('/synthetic-private')).owner, 101);
  assert.equal(requests, 2);
  assert.equal(api.getSession().id, 101);
  assert.equal(api.getSession().access_token, 'synthetic-new');
});

test('public requests and unchanged-account auth errors retain their behavior', async () => {
  const h = harness(), api = h.load('src/lib/api.ts');
  h.owner(null);
  h.setFetch(async () => ({ status: 200, ok: true, json: async () => ({ public: true }) }));
  assert.equal((await api.apiFetch('/synthetic-public')).public, true);
  h.owner(101);
  h.setFetch(async () => ({ status: 401, ok: false, json: async () => ({ detail: 'synthetic unauthorized' }) }));
  await assert.rejects(api.apiFetch('/synthetic-private'), error => error.status === 401);
});

test('WritingExam remounts private draft and feedback after an account switch', async () => {
  const h = harness(), WritingExam = h.load('src/components/ielts/WritingExam.tsx').default;
  let view;
  const props = { storageKey: 'writing-20-1', task: { task: 1, prompt: 'Synthetic prompt', min_words: 1, minutes: 1 },
    onSubmit: async () => ({ band: 7, feedback: 'Private synthetic feedback for A' }) };
  act(() => { view = create(React.createElement(WritingExam, props)); });
  act(() => view.root.findByType('textarea').props.onChange({ target: { value: 'A private essay' } }));
  const button = view.root.findAllByType('button').find(node => String(node.props.children).includes('Submit'));
  assert.ok(button, 'actual writing submit button exists');
  await act(async () => { await button.props.onClick(); });
  assert.ok(JSON.stringify(view.toJSON()).includes('Private synthetic feedback for A'));
  h.owner(202);
  act(() => view.update(React.createElement(WritingExam, { ...props })));
  assert.equal(view.root.findByType('textarea').props.value, '');
  assert.ok(!JSON.stringify(view.toJSON()).includes('Private synthetic feedback for A'));
  h.owner(101);
  act(() => view.update(React.createElement(WritingExam, { ...props })));
  assert.equal(view.root.findByType('textarea').props.value, 'A private essay');
  act(() => view.unmount());
});

test('real AuthProvider resets account-owned screen state and follows other-tab logout', () => {
  const h = harness(), auth = h.load('src/hooks/useAuth.tsx'), api = h.load('src/lib/api.ts');
  let currentAuth, setPrivate, view;
  function Screen() {
    currentAuth = auth.useAuth();
    const [privateValue, setter] = React.useState('empty'); setPrivate = setter;
    return React.createElement('output', null, `${currentAuth.user?.id ?? 'none'}:${privateValue}`);
  }
  api.saveSession({ id: 101, access_token: 'synthetic-A' });
  act(() => { view = create(React.createElement(auth.AuthProvider, null, React.createElement(Screen))); });
  act(() => setPrivate('private-A-state'));
  assert.equal(view.toJSON().children[0], '101:private-A-state');
  act(() => currentAuth.login({ id: 202, access_token: 'synthetic-B' }));
  assert.equal(view.toJSON().children[0], '202:empty');
  act(() => setPrivate('private-B-state'));
  api.clearSession();
  act(() => h.listeners.get('storage')({ key: 'ilm_session' }));
  assert.equal(view.toJSON().children[0], 'none:empty');
  act(() => view.unmount());
  assert.equal(h.listeners.has('storage'), false);
});
