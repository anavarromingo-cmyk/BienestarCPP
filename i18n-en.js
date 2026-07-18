// ==========================================
// TRADUCCIONES UI — INGLÉS
// ==========================================
// Claves usadas en data-i18n="..." del HTML

const EN = {
  // -- Navbar --
  'nav.home': '🏠 Home',
  'nav.evaluations': '📋 Assessments',
  'nav.resources': '💆 Immediate Resources',
  'nav.library': '📚 Library',
  'nav.community': '👥 Community',
  'nav.tracking': '📊 My Tracking',
  'nav.dashboard': '📈 Current Status',
  'nav.credits': '© Credits',

  // -- Hero --
  'hero.title': 'How does your work affect you? Find out',
  'hero.subtitle': 'Working in paediatric palliative care is wonderful, but sometimes it can take a toll. Discover how you are doing and how to protect yourself.',

  // -- Home evaluation cards --
  'home.compassion.title': '💔 Compassion Fatigue',
  'home.compassion.desc': 'Emotional wear from continuous exposure to the suffering of children and families. Includes secondary traumatic stress and PTSD-like symptoms.',
  'home.compassion.btn': '🎯 Assess your Compassion Fatigue',
  'home.selfcare.title': '💚 Self-Care Deficit',
  'home.selfcare.desc': 'Insufficient attention to your physical, emotional, social, and spiritual well-being. You prioritise patients\' needs over your own.',
  'home.selfcare.btn': '🎯 Assess your Self-Care',
  'home.selfcare.disclaimer': '⚠️ <em>Non-validated, custom-designed scale.</em> Please complete it to help us correlate self-care data with validated instruments.',

  // -- Research disclaimer --
  'research.title': 'Recommendation for research',
  'research.text': 'To enable <strong>cross-instrument correlations</strong> and obtain more robust data, we recommend completing both <strong>scales</strong> (Compassion Fatigue and Self-Care), not just one. This will allow us to compare and cross-reference results to improve evidence on professional well-being.',

  // -- Quick access --
  'quick.title': 'Quick access to other resources',
  'quick.library.title': '📚 Learn More',
  'quick.library.desc': 'Downloadable guides, bibliography, and scientific references',
  'quick.resources.title': '💪 Resources',
  'quick.resources.desc': 'Mindfulness exercises, routines, and practical techniques',
  'quick.community.title': '👥 Community',
  'quick.community.desc': 'Forum, contacts, and testimonials from other professionals',
  'quick.dashboard.title': '📈 Current Status',
  'quick.dashboard.desc': 'Real-time statistics from all assessments',

  // -- Evaluations section --
  'eval.back': '← Back',
  'eval.title': 'Self-Assessments',
  'eval.desc': 'Learn about your current state with scientifically validated instruments',
  'eval.compassion.info.title': 'Compassion Fatigue',
  'eval.compassion.info.desc': 'The emotional wear that arises from continuous exposure to the suffering of children and their families. Includes secondary traumatic stress. Unlike burnout, it relates specifically to empathy towards others\' pain.',
  'eval.selfcare.info.title': 'Self-Care Deficit',
  'eval.selfcare.info.desc': 'Occurs when you prioritise your patients\' needs over your own, neglecting your physical, emotional, and spiritual well-being. Self-care is not selfish — it is essential to care well for others.',
  'eval.section.title': 'Self-Assessment: Discover how you are',
  'eval.btn.compassion': 'Check your Compassion Fatigue level',
  'eval.btn.selfcare': 'Do you really practise self-care? Find out',

  // -- Eval modal --
  'modal.about': 'About you',
  'modal.consent.title': '<strong>Informed consent:</strong>',
  'modal.consent.text': 'I declare that I participate voluntarily and authorise the processing of the data entered for <strong>personal self-assessment</strong> and <strong>scientific research</strong> purposes. I understand that:',
  'modal.consent.anon': 'The data is <strong>completely anonymous</strong>: no name, email, or identifying data is collected.',
  'modal.consent.use': 'It is used exclusively for self-assessment and aggregated statistical analysis.',
  'modal.consent.storage': 'It is stored on secure servers (Firebase/Google Cloud) in compliance with the <strong>General Data Protection Regulation (GDPR — EU 2016/679)</strong>.',
  'modal.consent.rights': 'As the data is anonymous and not linked to any identity, it is not possible to exercise rights of access, rectification, or deletion on individual records.',
  'modal.consent.access': 'Only the <strong>principal investigator</strong> will have access to raw data. The public dashboard shows only aggregated statistics.',
  'modal.consent.error': '⚠️ You must accept the informed consent to continue.',
  'modal.btn.results': '📊 View results',
  'modal.btn.close': '✕ Close',

  // -- Results modal --
  'results.title': 'Your Results',
  'results.date': 'Date:',
  'results.profession': 'Profession:',
  'results.scope': 'Work setting:',
  'results.age': 'Age:',
  'results.experience': 'Experience:',
  'results.score': '📊 Your Score',
  'results.recommendations': '💡 Personalised Recommendations',
  'results.plan': '📅 Your Action Plan',
  'results.download': '⬇️ Download PDF',

  // -- Resources section --
  'resources.title': 'Tools to Take Care of Yourself Right Now',
  'resources.desc': 'Practical exercises, daily routines, and emotional regulation techniques',
  'resources.tab.mindfulness': 'Mindfulness',
  'resources.tab.routines': 'Daily Routines',
  'resources.tab.regulation': 'Emotional Regulation',

  // -- Tracking section --
  'tracking.title': 'My Personal Tracking',
  'tracking.desc': 'Monitor your progress and generate personalised plans',
  'tracking.history': '📋 Assessment History',
  'tracking.plan': '🎯 Personalised Plan',
  'tracking.progress': '📊 Progress',
  'tracking.generate': 'Generate Personalised Plan',

  // -- Dashboard --
  'dashboard.title': '📈 Current real-time status',
  'dashboard.desc': 'Real-time statistics from all assessments completed by healthcare professionals',
  'dashboard.loading': 'Loading data from Firebase...',
  'dashboard.filters': '🔍 Filters',
  'dashboard.reset': '✕ Clear filters',
  'dashboard.kpi.total': 'Total Assessments',
  'dashboard.kpi.compassion': 'Compassion (ProQOL)',
  'dashboard.kpi.selfcare': 'Self-Care',
  'dashboard.kpi.professionals': 'Unique professionals',
  'dashboard.kpi.countries': 'Countries',
  'dashboard.chart.profession': '👩‍⚕️ Distribution by Profession',
  'dashboard.chart.scope': '🏥 Distribution by Work Setting',
  'dashboard.chart.proqol': '💔 ProQOL Levels',
  'dashboard.chart.timeline': '📅 Assessments per Month',
  'dashboard.chart.country': '🌍 Distribution by Country',
  'dashboard.table.title': '💔 ProQOL Detail by Subscale',
  'dashboard.table.subscale': 'Subscale',
  'dashboard.table.low': 'Low',
  'dashboard.table.medium': 'Medium',
  'dashboard.table.high': 'High',
  'dashboard.table.cs': 'Compassion Satisfaction',
  'dashboard.table.sts': 'Secondary Traumatic Stress',
  'dashboard.timestamp': '🔄 Real-time data · Last updated:',

  // -- Credits modal --
  'credits.title': 'Credits and References',
  'credits.close': 'Close',

  // -- Footer --
  'footer.btn': 'Share your results for the research project',
  'footer.warning': '<strong>⚠️ IMPORTANT NOTICE:</strong> This is an experimental application in development.',
  'footer.disclaimer': 'Results and recommendations are indicative and <strong>IN NO CASE replace professional psychological advice</strong>.',
  'footer.license': 'This work is licensed under a Creative Commons Attribution-NonCommercial 4.0 International License',
  'footer.credits': 'Credits and References',
  'footer.status': 'Status:',
  'footer.connecting': 'Connecting...',

  // -- Subscale names (results) --
  'subscale.cs': 'Compassion Satisfaction',
  'subscale.bo': 'Burnout (ProQOL)',
  'subscale.sts': 'Secondary Traumatic Stress',

  // -- Risk levels --
  'level.alto': 'High',
  'level.medio': 'Medium',
  'level.bajo': 'Low',

  // -- Interpretations --
  'interp.compassion.high': 'High risk of Compassion Fatigue / Secondary Traumatic Stress.',
  'interp.compassion.lowcs': 'Low Compassion Satisfaction (Burnout risk).',
  'interp.compassion.ok': 'Balanced Professional Quality of Life.',
  'interp.selfcare.high': 'Excellent self-care routine.',
  'interp.selfcare.mod': 'Moderate self-care, areas for improvement.',
  'interp.selfcare.low': 'Insufficient self-care. Health risk.'
};

// Opciones de <select> traducidas
const EN_OPTIONS = {
  profesion: {
    '': 'Profession...',
    'medico': 'Physician',
    'enfermero': 'Nurse',
    'psicologo': 'Psychologist',
    'fisioterapeuta': 'Physiotherapist',
    'trabajador': 'Social Worker',
    'otro': 'Other healthcare professional'
  },
  ambito: {
    '': 'Work setting...',
    'paliativos_pediatricos': 'Paediatric palliative care',
    'paliativos_adultos': 'Adult palliative care',
    'otras_pediatricas': 'Other paediatric specialties',
    'otras_adultos': 'Other adult specialties'
  },
  experiencia: {
    '': 'Time in PPC...',
    '1': '< 1 year',
    '2': '1-3 years',
    '3': '3-5 years',
    '4': '5-10 years',
    '5': '> 10 years'
  },
  region: {
    'all': '🌍 All regions',
    'europa': '🇪🇺 Europe',
    'latam': '🌎 Latin America'
  },
  filterProfesion: {
    'all': '👩‍⚕️ All professions',
    'medico': 'Physician',
    'enfermero': 'Nurse',
    'psicologo': 'Psychologist',
    'fisioterapeuta': 'Physiotherapist',
    'trabajador': 'Social Worker',
    'otro': 'Other professional'
  },
  filterAmbito: {
    'all': '🏥 All settings',
    'paliativos_pediatricos': 'Paediatric palliative care',
    'paliativos_adultos': 'Adult palliative care',
    'otras_pediatricas': 'Other paediatric sp.',
    'otras_adultos': 'Other adult sp.'
  }
};
