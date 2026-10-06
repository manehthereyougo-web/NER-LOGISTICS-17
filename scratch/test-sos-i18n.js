const fs = require('fs');
const vm = require('vm');

// Setup DOM emulation for testing
function createEnvironment() {
  const listeners = {};
  const elements = {};

  const sandbox = {
    console: console,
    setTimeout: (fn) => fn(),
    clearTimeout: () => {},
    localStorage: {
      _data: {},
      getItem(k) { return this._data[k] || null; },
      setItem(k, v) { this._data[k] = String(v); },
      removeItem(k) { delete this._data[k]; }
    },
    navigator: {
      language: 'en-US',
      geolocation: { getCurrentPosition: () => {} }
    }
  };

  const document = {
    readyState: 'complete',
    documentElement: { lang: 'en' },
    body: {
      appendChild(child) {
        if (child.id) elements[child.id] = child;
      },
      style: {}
    },
    addEventListener(evt, fn) {
      if (!listeners[evt]) listeners[evt] = [];
      listeners[evt].push(fn);
    },
    dispatchEvent(e) {
      const list = listeners[e.type] || [];
      list.forEach(fn => fn(e));
    },
    getElementById(id) {
      if (!elements[id]) {
        elements[id] = {
          id,
          style: {},
          setAttribute(k, v) { this[k] = v; },
          getAttribute(k) { return this[k]; },
          addEventListener() {},
          appendChild(c) {},
          remove() { delete elements[id]; },
          classList: { add() {}, remove() {}, contains() { return false; } },
          innerHTML: '',
          innerText: '',
          textContent: ''
        };
      }
      return elements[id];
    },
    querySelectorAll(selector) {
      return [];
    },
    createElement(tag) {
      const el = {
        tagName: tag.toUpperCase(),
        style: {},
        setAttribute(k, v) { this[k] = v; },
        getAttribute(k) { return this[k]; },
        addEventListener() {},
        appendChild(c) {},
        remove() {},
        classList: { add() {}, remove() {}, contains() { return false; } },
        innerHTML: '',
        innerText: '',
        textContent: ''
      };
      return el;
    }
  };

  sandbox.window = sandbox;
  sandbox.document = document;
  sandbox.global = sandbox;
  sandbox.CustomEvent = function(type, detail) {
    this.type = type;
    this.detail = detail ? detail.detail : {};
  };
  sandbox.window.addEventListener = (evt, fn) => document.addEventListener(evt, fn);
  sandbox.window.dispatchEvent = (e) => document.dispatchEvent(e);

  vm.createContext(sandbox);

  // Load i18n
  const i18nCode = fs.readFileSync('js/i18n.js', 'utf8');
  vm.runInContext(i18nCode, sandbox);

  // Load sos-service
  const sosServiceCode = fs.readFileSync('js/services/sos-service.js', 'utf8');
  vm.runInContext(sosServiceCode, sandbox);

  // Load sos-ui
  const sosUiCode = fs.readFileSync('js/sos-ui.js', 'utf8');
  vm.runInContext(sosUiCode, sandbox);

  return { sandbox, document, elements };
}

console.log('============================================================');
console.log('TEST SUITE: Reactive Multi-Language SOS & Driver PWA');
console.log('============================================================\n');

const { sandbox, elements } = createEnvironment();
const I18N = sandbox.window.I18N;
const SOS_UI = sandbox.window.SafeRouteSOS_UI;

const testLangs = ['en', 'ta', 'hi', 'bn', 'as', 'nishi', 'meitei', 'khasi', 'mizo', 'konyak', 'ne'];
let passed = 0;
let total = 0;

function assert(cond, msg) {
  total++;
  if (cond) {
    console.log(`  ✓ ${msg}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${msg}`);
  }
}

// TEST 1: Dictionary keys existence across all 11 languages
console.log('TEST 1: Dictionary Key Coverage Across All 11 Languages');
testLangs.forEach(lang => {
  I18N.setLanguage(lang);
  const hosp = I18N.t('sos_find_hospital');
  const pol = I18N.t('sos_find_police');
  const single = I18N.t('mode_single_leg');
  const multi = I18N.t('mode_multiday_schedule');

  assert(Boolean(hosp && hosp.trim()), `[${lang}] sos_find_hospital exists: "${hosp}"`);
  assert(Boolean(pol && pol.trim()), `[${lang}] sos_find_police exists: "${pol}"`);
  assert(Boolean(single && single.trim()), `[${lang}] mode_single_leg exists: "${single}"`);
  assert(Boolean(multi && multi.trim()), `[${lang}] mode_multiday_schedule exists: "${multi}"`);
});

// TEST 2: Distinct Native Translations for Non-English
console.log('\nTEST 2: Distinct Native Translations (Not English Fallback)');
I18N.setLanguage('en');
const enHosp = I18N.t('sos_find_hospital');
const enPol = I18N.t('sos_find_police');

['ta', 'hi', 'bn', 'as', 'ne', 'meitei', 'mizo'].forEach(lang => {
  I18N.setLanguage(lang);
  const langHosp = I18N.t('sos_find_hospital');
  const langPol = I18N.t('sos_find_police');
  assert(langHosp !== enHosp, `[${lang}] Hospital translated to native: "${langHosp}"`);
  assert(langPol !== enPol, `[${lang}] Police translated to native: "${langPol}"`);
});

// TEST 3: SOS UI Modal Rendering in English then Reactive Switch to Tamil
console.log('\nTEST 3: Reactive SOS Modal Language Switching (en -> ta)');
I18N.setLanguage('en');
SOS_UI.openSosModal();

const modalBody = elements['sos-modal-body'];
assert(Boolean(modalBody), 'SOS modal body element exists');
assert(modalBody.innerHTML.includes('FIND NEAREST HOSPITAL'), 'English modal contains "FIND NEAREST HOSPITAL"');
assert(modalBody.innerHTML.includes('FIND NEAREST POLICE STATION'), 'English modal contains "FIND NEAREST POLICE STATION"');

// Now switch language to Tamil (ta) while modal is open!
I18N.setLanguage('ta');
assert(modalBody.innerHTML.includes('அருகிலுள்ள மருத்துவமனையைக் காண்'), 'Reactive update: Modal now displays Tamil hospital text');
assert(modalBody.innerHTML.includes('அருகிலுள்ள காவல் நிலையத்தைக் காண்'), 'Reactive update: Modal now displays Tamil police text');

// Now switch language to Hindi (hi) while modal is open!
console.log('\nTEST 4: Reactive SOS Modal Language Switching (ta -> hi)');
I18N.setLanguage('hi');
assert(modalBody.innerHTML.includes('निकटतम अस्पताल खोजें'), 'Reactive update: Modal now displays Hindi hospital text');
assert(modalBody.innerHTML.includes('निकटतम पुलिस स्टेशन खोजें'), 'Reactive update: Modal now displays Hindi police text');

// Now switch language to Assamese (as) while modal is open!
console.log('\nTEST 5: Reactive SOS Modal Language Switching (hi -> as)');
I18N.setLanguage('as');
assert(modalBody.innerHTML.includes('ওচৰৰ চিকিৎসালয় বিচাৰক'), 'Reactive update: Modal now displays Assamese hospital text');
assert(modalBody.innerHTML.includes('ওচৰৰ আৰক্ষী চকী বিচাৰক'), 'Reactive update: Modal now displays Assamese police text');

// TEST 6: Floating button label update
console.log('\nTEST 6: Floating Button Reactive Label');
const floatLabel = elements['sos-floating-label'];
if (floatLabel) {
  assert(floatLabel.textContent === '🚨 জৰুৰীকালীন SOS', `Assamese floating label updated: "${floatLabel.textContent}"`);
  I18N.setLanguage('ta');
  assert(floatLabel.textContent === '🚨 அவசர SOS உதவி', `Tamil floating label updated: "${floatLabel.textContent}"`);
} else {
  assert(false, 'Floating label element not found');
}

console.log('\n============================================================');
console.log(`RESULTS: ${passed} / ${total} tests passed successfully!`);
console.log('============================================================');

if (passed === total) {
  process.exit(0);
} else {
  process.exit(1);
}
