// ==========================================
// SECCIONES EN INGLÉS — PARTE 2
// (Biblioteca, Comunidad, Tracking, Dashboard, Footer, Modales)
// ==========================================

// --- LIBRARY SECTION ---
EN_SECTIONS['library-header'] = `
  <button class="btn-back" onclick="showSection('inicio')">← Back</button>
  <h2>Educational Resources Library</h2>
  <p class="section-description">Practical guides, academic references, and recommended apps</p>`;

EN_SECTIONS['library-tabs'] = `
  <button class="tab-btn active" onclick="showLibraryTab('guias')">Downloadable Guides</button>
  <button class="tab-btn" onclick="showLibraryTab('referencias')">Academic References</button>
  <button class="tab-btn" onclick="showLibraryTab('apps')">Recommended Apps</button>`;

EN_SECTIONS['guides-content'] = `
  <div class="guides-grid">
    <div class="guide-card">
      <div class="guide-icon">💚</div>
      <h3>Self-Care for PPC</h3>
      <p class="guide-pages">Practical strategies and personalised plan</p>
      <ul class="guide-contents">
        <li>20 applicable practical strategies</li>
        <li>Common barriers and solutions</li>
        <li>Personalised self-care plan</li>
      </ul>
      <div style="display:flex;gap:10px;margin-top:15px;">
        <button class="btn btn-primary" onclick="descargarGuia('autocuidado')" style="flex:1;">⬇️ Download</button>
        <button class="btn btn-secondary" onclick="leerGuia('autocuidado')" style="flex:1;">📖 Read</button>
      </div>
    </div>
    <div class="guide-card">
      <div class="guide-icon">⚠️</div>
      <h3>Warning Signs</h3>
      <p class="guide-pages">Early symptoms and when to seek help</p>
      <ul class="guide-contents">
        <li>Early symptom checklist</li>
        <li>When to seek professional help</li>
        <li>Local support resources</li>
      </ul>
      <div style="display:flex;gap:10px;margin-top:15px;">
        <button class="btn btn-primary" onclick="descargarGuia('alertas')" style="flex:1;">⬇️ Download</button>
        <button class="btn btn-secondary" onclick="leerGuia('alertas')" style="flex:1;">📖 Read</button>
      </div>
    </div>
    <div class="guide-card">
      <div class="guide-icon">👥</div>
      <h3>Team Support</h3>
      <p class="guide-pages">Effective communication and safe spaces</p>
      <ul class="guide-contents">
        <li>Effective peer communication</li>
        <li>How to offer and receive support</li>
        <li>Group debriefing dynamics</li>
      </ul>
      <div style="display:flex;gap:10px;margin-top:15px;">
        <button class="btn btn-primary" onclick="descargarGuia('equipo')" style="flex:1;">⬇️ Download</button>
        <button class="btn btn-secondary" onclick="leerGuia('equipo')" style="flex:1;">📖 Read</button>
      </div>
    </div>
    <div class="guide-card">
      <div class="guide-icon">🧘</div>
      <h3>Mindfulness</h3>
      <p class="guide-pages">Progressive practices from 2-7 minutes</p>
      <ul class="guide-contents">
        <li>Theoretical introduction to mindfulness</li>
        <li>Progressive practices (2-7 min)</li>
        <li>How to integrate into your routine</li>
      </ul>
      <div style="display:flex;gap:10px;margin-top:15px;">
        <button class="btn btn-primary" onclick="descargarGuia('mindfulness')" style="flex:1;">⬇️ Download</button>
        <button class="btn btn-secondary" onclick="leerGuia('mindfulness')" style="flex:1;">📖 Read</button>
      </div>
    </div>
  </div>`;

// --- COMMUNITY SECTION ---
EN_SECTIONS['community-header'] = `
  <button class="btn-back" onclick="showSection('inicio')">← Back</button>
  <h2>You Are Not Alone: Community & Support</h2>
  <p class="section-description">Connect, share, and find professional support</p>`;

EN_SECTIONS['community-contacts'] = `
  <h3>📞 Professional Help Contacts</h3>
  <p class="card-intro">If you need immediate support or professional intervention:</p>
  <div class="contact-list">
    <div class="contact-item emergency">
      <h4>🏥 Crisis Intervention Resources</h4>
      <p class="contact-number"><strong>024</strong></p>
      <p>Suicide prevention helpline (Spain)</p>
      <p class="contact-number" style="font-size:1.5rem;margin-top:10px;"><strong>717 003 717</strong></p>
      <p>Hope Line (Spain)</p>
      <p class="availability">Available 24/7 - Free - Confidential</p>
    </div>
    <div class="contact-item">
      <h4>🧠 Psychological Support Services</h4>
      <p>Contact the psychologist of your local paediatric palliative care team.</p>
      <p>If your team does not have one, request psychological support through your primary care physician.</p>
    </div>
    <p>Spanish Association of Paediatric Palliative Care</p>
    <p>Training, support, and resources for PPC professionals</p>
    <a href="https://www.pedpal.es" target="_blank" class="contact-link">www.pedpal.es</a>
  </div>
  <div class="contact-item">
    <h4>🌍 IAHPC - International Association for Hospice & Palliative Care</h4>
    <p>International network of palliative care professionals</p>
    <p>Resources, continuing education, and global professional connections</p>
    <a href="https://www.hospicecare.com" target="_blank" class="contact-link">www.hospicecare.com</a>
  </div>
  <div class="contact-item">
    <h4>🧠 Professional Psychology Associations</h4>
    <p>Guidance and specialised psychologist finder services</p>
    <p>Specialisations in burnout, trauma, and healthcare professionals</p>
    <a href="https://www.cop.es" target="_blank" class="contact-link">www.cop.es</a>
  </div>
  <div class="contact-item">
    <h4>❤️ Hospital Support Programmes</h4>
    <p>Check if your hospital offers:</p>
    <ul>
      <li>Occupational health service with psychological support</li>
      <li>Employee Assistance Programmes (EAP)</li>
      <li>Peer support groups</li>
      <li>Schwartz Rounds or reflection spaces</li>
    </ul>
  </div>`;

EN_SECTIONS['community-testimonials'] = `
  <h3>✨ Resilience Testimonials</h3>
  <p class="card-intro">Anonymous stories from professionals who have faced and overcome difficulties:</p>
  <div class="testimonial-list">
    <div class="testimonial-item">
      <h4>"Acknowledging was the first step"</h4>
      <p class="testimonial-text">"After 5 years in PPC, I started having recurring nightmares about cases. I felt guilty for not being able to 'leave it at work'. The assessment helped me recognise I had secondary traumatic stress. I sought specialised therapy and learned processing techniques. Today I'm still in PPC, but with tools to look after myself."</p>
      <p class="testimonial-role">- Nurse, 32, 7 years in PPC</p>
    </div>
    <div class="testimonial-item">
      <h4>"Self-care is not selfishness"</h4>
      <p class="testimonial-text">"I always thought looking after myself was 'taking time away' from the children. My burnout reached a point where I considered leaving the profession. My mentor told me: 'You can't pour from an empty cup.' I started with small changes: 10 minutes of daily mindfulness, time limits, exercise. The difference was enormous."</p>
      <p class="testimonial-role">- Physician, 45, 12 years in PPC</p>
    </div>
    <div class="testimonial-item">
      <h4>"I found my community"</h4>
      <p class="testimonial-text">"I felt alone with what I was experiencing. Connecting with other PPC professionals who understood without me having to explain was transformative. We created a monthly support group. Sharing, crying together, and celebrating small victories restored my hope."</p>
      <p class="testimonial-role">- Psychologist, 38, 6 years in PPC</p>
    </div>
    <div class="testimonial-item">
      <h4>"Supervision saved my career"</h4>
      <p class="testimonial-text">"I started professional supervision when I was already at my limit. Having a safe space to process difficult cases, cry without judgement, and receive guidance was vital. Now it's non-negotiable in my routine. It's my professional 'life insurance'."</p>
      <p class="testimonial-role">- Social Worker, 41, 9 years in PPC</p>
    </div>
  </div>`;

EN_SECTIONS['community-disclaimer'] = `
  <h4>⚠️ Important</h4>
  <p>This tool does not replace a professional clinical evaluation. If you are experiencing significant difficulties that affect your daily life, work, or well-being, please seek support from a specialised mental health professional.</p>`;

// --- TRACKING SECTION ---
EN_SECTIONS['tracking-header'] = `
  <button class="btn-back" onclick="showSection('inicio')">← Back</button>
  <h2>My Personal Tracking</h2>
  <p class="section-description">Monitor your progress and generate personalised plans</p>`;


EN_SECTIONS['tracking-content'] = `
  <div class="tracking-card">
    <h3>📋 Assessment History</h3>
    <p>Your completed assessments and their evolution over time will appear here.</p>
    <div id="evaluationHistory" class="history-list">
      <p class="empty-state">You haven't completed any assessment yet. <a href="#evaluaciones" onclick="showSection('evaluaciones')">Start now</a></p>
    </div>
  </div>
  <div class="tracking-card">
    <h3>🎯 Personalised Plan</h3>
    <p>Based on your assessments, you will receive a personalised well-being plan with concrete actions.</p>
    <div id="personalPlan" class="plan-content">
      <p class="empty-state">Complete at least one assessment to generate your personalised plan.</p>
    </div>
    <button class="btn btn-primary" onclick="generatePersonalPlan()" id="generatePlanBtn">Generate Personalised Plan</button>
  </div>
  <div class="tracking-card">
    <h3>📊 Progress</h3>
    <p>Repeat the assessments every 3 months to see your evolution.</p>
    <div class="progress-info">
      <p>📅 <strong>Recommendation:</strong> Assess your well-being every 3 months to detect early changes and adjust your self-care strategies.</p>
      <p>🔔 In a full version, you could set automatic reminders for re-evaluation.</p>
    </div>
  </div>`;

// --- DASHBOARD SECTION ---
EN_SECTIONS['dashboard-header'] = `
  <button class="btn-back" onclick="showSection('inicio')">← Back</button>
  <h2>📈 Current real-time status</h2>
  <p class="section-description">Real-time statistics from all assessments completed by healthcare professionals</p>`;

// --- FOOTER ---
EN_SECTIONS['footer-content'] = `
  <div class="footer-button">
    <button class="btn btn-primary" onclick="window.open('https://forms.gle/y2mSUMvSM6wsN8RN7', '_blank')">
      Share your results for the research project
    </button>
  </div>
  <div class="license">
    <p><strong>⚠️ IMPORTANT NOTICE:</strong> This is an experimental application in development.</p>
    <p>Results and recommendations are indicative and <strong>IN NO CASE replace professional psychological advice</strong>.</p>
    <p>© 2025 Álvaro Navarro Mingorance</p>
    <p>This work is licensed under a Creative Commons Attribution-NonCommercial 4.0 International License</p>
    <div class="license-icon">🅭🅯</div>
    <p style="margin-top:10px;"><a href="#" onclick="document.getElementById('creditosModal').style.display='flex'; return false;" class="credits-link">Credits and References</a></p>
    <div id="firebase-status" style="margin-top:10px;font-size:0.8em;color:#666;">
      Status: <span id="status-text">Connecting...</span> <span id="status-dot" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:orange;"></span>
    </div>
  </div>`;

// --- EVAL MODAL (demographic section) ---
EN_SECTIONS['eval-demographics'] = `
  <div class="form-section-title">About you</div>
  <select id="eval-profesion" class="form-input" data-i18n-options="profesion">
    <option value="">Profession...</option>
    <option value="medico">Physician</option>
    <option value="enfermero">Nurse</option>
    <option value="psicologo">Psychologist</option>
    <option value="fisioterapeuta">Physiotherapist</option>
    <option value="trabajador">Social Worker</option>
    <option value="otro">Other healthcare professional</option>
  </select>
  <select id="eval-ambito" class="form-input" data-i18n-options="ambito">
    <option value="">Work setting...</option>
    <option value="paliativos_pediatricos">Paediatric palliative care</option>
    <option value="paliativos_adultos">Adult palliative care</option>
    <option value="otras_pediatricas">Other paediatric specialties</option>
    <option value="otras_adultos">Other adult specialties</option>
  </select>
  <input type="number" id="eval-edad" class="form-input" placeholder="Age">
  <select id="eval-experiencia" class="form-input" data-i18n-options="experiencia">
    <option value="">Time in PPC...</option>
    <option value="1">< 1 year</option>
    <option value="2">1-3 years</option>
    <option value="3">3-5 years</option>
    <option value="4">5-10 years</option>
    <option value="5">> 10 years</option>
  </select>
  <input type="text" id="eval-pais" class="form-input" placeholder="Country of work">`;

EN_SECTIONS['eval-consent'] = `
  <div style="display:flex;align-items:flex-start;gap:10px;">
    <input type="checkbox" id="eval-consent" style="margin-top:4px;min-width:18px;min-height:18px;accent-color:var(--color-primary);cursor:pointer;">
    <label for="eval-consent" style="font-size:0.85em;line-height:1.5;color:var(--color-text-secondary);cursor:pointer;">
      <strong style="color:var(--color-text);">Informed consent:</strong> I declare that I participate voluntarily and authorise the processing of the data entered for <strong>personal self-assessment</strong> and <strong>scientific research</strong> purposes. I understand that:
      <ul style="margin:8px 0 4px 0;padding-left:18px;">
        <li>The data is <strong>completely anonymous</strong>: no name, email, or identifying data is collected.</li>
        <li>It is used exclusively for self-assessment and aggregated statistical analysis.</li>
        <li>It is stored on secure servers (Firebase/Google Cloud) in compliance with the <strong>General Data Protection Regulation (GDPR — EU 2016/679)</strong>.</li>
        <li>As the data is anonymous and not linked to any identity, it is not possible to exercise rights of access, rectification, or deletion on individual records.</li>
        <li>Only the <strong>principal investigator</strong> will have access to raw data. The public dashboard shows only aggregated statistics.</li>
      </ul>
    </label>
  </div>
  <p id="consent-error" style="color:var(--color-error);font-size:0.8em;margin:8px 0 0 28px;display:none;">⚠️ You must accept the informed consent to continue.</p>`;
