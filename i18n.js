// ==========================================
// SISTEMA DE INTERNACIONALIZACIÓN (i18n)
// ==========================================
let currentLang = localStorage.getItem('bienestarLang') || 'es';

function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('bienestarLang', lang);
  applyTranslations();
  applySectionTranslations();
  const sel = document.getElementById('lang-select');
  if (sel) sel.value = lang;
  if (typeof dashboardLoaded !== 'undefined' && dashboardLoaded && typeof applyDashboardFilters === 'function') {
    applyDashboardFilters();
  }
}

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (currentLang === 'es') {
      const orig = el.getAttribute('data-i18n-original');
      if (orig !== null) {
        if (el.tagName === 'INPUT' && el.type !== 'checkbox') el.placeholder = orig;
        else el.innerHTML = orig;
      }
    } else {
      if (!el.hasAttribute('data-i18n-original')) {
        if (el.tagName === 'INPUT' && el.type !== 'checkbox') el.setAttribute('data-i18n-original', el.placeholder);
        else el.setAttribute('data-i18n-original', el.innerHTML);
      }
      const translated = EN[key];
      if (translated !== undefined) {
        if (el.tagName === 'INPUT' && el.type !== 'checkbox') el.placeholder = translated;
        else el.innerHTML = translated;
      }
    }
  });
  // Select options
  document.querySelectorAll('[data-i18n-options]').forEach(sel => {
    const groupKey = sel.getAttribute('data-i18n-options');
    const opts = EN_OPTIONS[groupKey];
    if (!opts) return;
    Array.from(sel.options).forEach(opt => {
      if (currentLang === 'es') {
        const orig = opt.getAttribute('data-i18n-original');
        if (orig !== null) opt.textContent = orig;
      } else {
        if (!opt.hasAttribute('data-i18n-original')) opt.setAttribute('data-i18n-original', opt.textContent);
        const tr = opts[opt.value];
        if (tr) opt.textContent = tr;
      }
    });
  });
}

// --- TRADUCCIONES POR SECCIÓN COMPLETA ---
function applySectionTranslations() {
  document.querySelectorAll('[data-i18n-section]').forEach(el => {
    const key = el.getAttribute('data-i18n-section');
    if (currentLang === 'es') {
      const orig = el.getAttribute('data-i18n-section-original');
      if (orig !== null) el.innerHTML = orig;
    } else {
      if (!el.hasAttribute('data-i18n-section-original')) {
        el.setAttribute('data-i18n-section-original', el.innerHTML);
      }
      if (EN_SECTIONS[key]) el.innerHTML = EN_SECTIONS[key];
    }
  });
}

// --- EVALUACIONES EN INGLÉS ---
const EN_EVALUATIONS = {
  compassion: {
    name: 'Compassion Fatigue',
    title: 'Compassion Fatigue Assessment (ProQOL v5)',
    description: 'Consider each of the following questions about you and your current work situation. Select the number that honestly reflects how frequently you experienced these things in the last 30 days.',
    questions: [
      "I am happy.","I am preoccupied with more than one person I help.","I get satisfaction from being able to help people.","I feel connected to others.","I jump or am startled by unexpected sounds.","I feel invigorated after working with those I help.","I find it difficult to separate my personal life from my life as a helper.","I am not as productive at work because I am losing sleep over traumatic experiences of a person I help.","I think that I might have been affected by the traumatic stress of those I help.","I feel trapped by my job as a helper.","Because of my helping, I have felt \"on edge\" about various things.","I like my work as a helper.","I feel depressed because of the traumatic experiences of the people I help.","I feel as though I am experiencing the trauma of someone I have helped.","I have beliefs that sustain me.","I am pleased with how I am able to keep up with helping techniques and protocols.","I am the person I always wanted to be.","My work makes me feel satisfied.","I feel worn out because of my work as a helper.","I have happy thoughts and feelings about those I help and how I could help them.","I feel overwhelmed because my case work load seems endless.","I believe I can make a difference through my work.","I avoid certain activities or situations because they remind me of frightening experiences of the people I help.","I am proud of what I can do to help.","As a result of my helping, I have intrusive, frightening thoughts.","I feel \"bogged down\" by the system.","I have thoughts that I am a \"success\" as a helper.","I can't recall important parts of my work with trauma victims.","I am a very caring person.","I am happy that I chose to do this work."
    ],
    options: [
      { text: "Never", value: 1 },{ text: "Rarely", value: 2 },{ text: "Sometimes", value: 3 },{ text: "Often", value: 4 },{ text: "Very Often", value: 5 }
    ]
  },
  selfcare: {
    name: 'Self-Care',
    title: 'Self-Care Assessment',
    description: 'Rate your current self-care practices (1 = Never, 5 = Always). Note: This is a non-validated, custom-designed scale.',
    questions: [
      "I sleep enough hours to feel rested.","I exercise regularly.","I maintain a balanced diet and stay well hydrated.","I dedicate time to activities I enjoy outside of work.","I stay in regular contact with friends and family.","I am able to mentally disconnect from work when I leave.","I practice some form of relaxation or mindfulness technique.","I seek support when I feel overwhelmed.","I allow myself to feel and express my emotions.","I have a clear sense of my priorities and personal values."
    ],
    options: [
      { text: "Never", value: 1 },{ text: "Rarely", value: 2 },{ text: "Sometimes", value: 3 },{ text: "Often", value: 4 },{ text: "Always", value: 5 }
    ]
  }
};

function getEvalConfig(evalKey) {
  if (currentLang === 'en') {
    const enConf = EN_EVALUATIONS[evalKey];
    if (enConf && enConf.questions !== null) return enConf;
    if (enConf && enConf.questions === null) {
      const esConf = evaluations[evalKey];
      return { ...esConf, options: enConf.options, title: enConf.title, name: enConf.name };
    }
  }
  return evaluations[evalKey];
}
