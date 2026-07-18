// ==========================================
// SECCIONES COMPLETAS EN INGLÉS
// ==========================================
// Usado por applySectionTranslations() vía data-i18n-section="key"

const EN_SECTIONS = {};

// --- QUICK ACCESS (home) ---
EN_SECTIONS['quick-access'] = `
  <h3>Quick access to other resources</h3>
  <div class="quickaccess-grid">
    <div class="quickaccess-card" onclick="showSection('biblioteca')">
      <h4>📚 Learn More</h4>
      <p>Downloadable guides, bibliography, and scientific references</p>
    </div>
    <div class="quickaccess-card" onclick="showSection('recursos')">
      <h4>💪 Resources</h4>
      <p>Mindfulness exercises, routines, and practical techniques</p>
    </div>
    <div class="quickaccess-card" onclick="showSection('comunidad')">
      <h4>👥 Community</h4>
      <p>Forum, contacts, and testimonials from other professionals</p>
    </div>
    <div class="quickaccess-card" onclick="showSection('dashboard')">
      <h4>📈 Current Status</h4>
      <p>Real-time statistics from all assessments</p>
    </div>
  </div>`;

// --- EVALUATIONS SECTION ---
EN_SECTIONS['eval-header'] = `
  <button class="btn-back" onclick="showSection('inicio')">← Back</button>
  <h2>Self-Assessments</h2>
  <p class="section-description">Learn about your current state with scientifically validated instruments</p>`;

EN_SECTIONS['eval-education'] = `
  <div class="cards-grid">
    <div class="info-card compassion">
      <div class="info-card-icon">💚</div>
      <h3>Compassion Fatigue</h3>
      <p>The emotional wear from continuous exposure to the suffering of children and their families. It includes secondary traumatic stress and differs from burnout in its specific link to empathy.</p>
      <ul>
        <li><strong>Intrusive thoughts:</strong> Recurring memories of difficult cases</li>
        <li><strong>Avoidance:</strong> Emotional disconnection from patients</li>
        <li><strong>Emotional hyperarousal:</strong> Intense emotional responses</li>
      </ul>
    </div>
    <div class="info-card selfcare">
      <div class="info-card-icon">🌸</div>
      <h3>Self-Care Deficit</h3>
      <p>Occurs when you prioritise your patients' needs over your own, neglecting your physical, emotional, and spiritual well-being. Self-care is not selfish — it is essential.</p>
      <ul>
        <li><strong>Physical:</strong> Rest, nutrition, exercise</li>
        <li><strong>Emotional:</strong> Emotion management and psychological support</li>
        <li><strong>Social:</strong> Relationships and leisure time</li>
        <li><strong>Spiritual:</strong> Connection with values and purpose</li>
      </ul>
    </div>
  </div>`;

EN_SECTIONS['eval-buttons'] = `
  <h2>Self-Assessment: Discover how you are</h2>
  <div class="evaluation-buttons">
    <button class="btn btn-primary" onclick="abrirEvaluacion('compasion')">Check your Compassion Fatigue level</button>
    <button class="btn btn-primary" onclick="abrirEvaluacion('autocuidado')">Do you really practise self-care? Find out</button>
  </div>`;

// --- RESOURCES SECTION ---
EN_SECTIONS['resources-header'] = `
  <button class="btn-back" onclick="showSection('inicio')">← Back</button>
  <h2>Tools to Take Care of Yourself Right Now</h2>
  <p class="section-description">Practical exercises, daily routines, and emotional regulation techniques</p>`;

EN_SECTIONS['resources-tabs'] = `
  <button class="tab-btn active" onclick="showResourceTab('mindfulness')">Mindfulness</button>
  <button class="tab-btn" onclick="showResourceTab('rutinas')">Daily Routines</button>
  <button class="tab-btn" onclick="showResourceTab('regulacion')">Emotional Regulation</button>`;

EN_SECTIONS['mindfulness-content'] = `
  <div class="exercise-card">
    <div class="exercise-header"><h3>🫁 Deep Breathing</h3><span class="badge badge-beginner">Beginner</span></div>
    <div class="exercise-meta"><span class="duration">⏱️ 3 minutes</span></div>
    <p class="exercise-objective"><strong>Goal:</strong> Activate the parasympathetic system and calm the mind</p>
    <div class="exercise-content">
      <ol>
        <li>Adopt a comfortable position, sitting or lying down</li>
        <li>Breathe deeply through your nose counting to 4</li>
        <li>Hold the air counting to 4</li>
        <li>Exhale slowly through your mouth counting to 6</li>
        <li>Repeat this cycle 8-10 times</li>
      </ol>
      <div class="exercise-benefit"><strong>Benefits:</strong> Activates the parasympathetic system, reduces heart rate, calms the mind</div>
    </div>
    <button class="btn btn-primary btn-sm" onclick="startGuidedExercise('respiracion')">Start guided practice</button>
  </div>
  <div class="exercise-card">
    <div class="exercise-header"><h3>🧘 Express Body Scan</h3><span class="badge badge-beginner">Beginner</span></div>
    <div class="exercise-meta"><span class="duration">⏱️ 5 minutes</span></div>
    <p class="exercise-objective"><strong>Goal:</strong> Connect with your body and detect tension</p>
    <div class="exercise-content">
      <p>Start at your feet and slowly move up to the top of your head, noticing any sensation without judgement. Observe areas of tension, relaxation, warmth, or cold. Don't try to change anything — just notice.</p>
      <div class="exercise-benefit"><strong>Benefits:</strong> Increases body awareness, identifies accumulated tension, facilitates relaxation</div>
    </div>
    <button class="btn btn-primary btn-sm" onclick="startGuidedExercise('escaneo')">Start guided practice</button>
  </div>
  <div class="exercise-card">
    <div class="exercise-header"><h3>⏸️ DRAW — The Four Moments Pause</h3><span class="badge badge-beginner">Beginner</span></div>
    <div class="exercise-meta"><span class="duration">⏱️ 2 minutes</span></div>
    <p class="exercise-objective"><strong>Goal:</strong> Regain clarity in moments of crisis</p>
    <div class="exercise-content">
      <div class="draw-steps">
        <div class="draw-step"><strong>D</strong>raw back — Pause your pace</div>
        <div class="draw-step"><strong>R</strong>espire — 5 deep breaths</div>
        <div class="draw-step"><strong>A</strong>ssimilate — What am I feeling right now?</div>
        <div class="draw-step"><strong>W</strong>alk on — Continue with your day</div>
      </div>
    </div>
    <button class="btn btn-primary btn-sm" onclick="alert('You can practise DRAW at any moment. Simply pause, breathe, assimilate, and walk on.')">See reminder</button>
  </div>
  <div class="exercise-card">
    <div class="exercise-header"><h3>💚 Self-Compassion Meditation</h3><span class="badge badge-intermediate">Intermediate</span></div>
    <div class="exercise-meta"><span class="duration">⏱️ 7 minutes</span></div>
    <p class="exercise-objective"><strong>Goal:</strong> Cultivate kindness and compassion towards yourself</p>
    <div class="exercise-content">
      <h4>Suggested mantras:</h4>
      <ul>
        <li>"I deserve compassion and kindness"</li>
        <li>"I am doing the best I can"</li>
        <li>"It is normal to experience difficulties"</li>
      </ul>
      <p>Place your hands on your chest and feel the warmth while repeating these mantras.</p>
    </div>
    <button class="btn btn-primary btn-sm" onclick="startGuidedExercise('autocompasion')">Start guided practice</button>
  </div>
  <div class="exercise-card">
    <div class="exercise-header"><h3>🍵 Everyday Mindfulness</h3><span class="badge badge-beginner">Beginner</span></div>
    <div class="exercise-meta"><span class="duration">⏱️ 5 minutes</span></div>
    <p class="exercise-objective"><strong>Goal:</strong> Practise presence during common activities</p>
    <div class="exercise-content">
      <h4>Suggested activities:</h4>
      <ul>
        <li><strong>Eating or drinking:</strong> Notice flavours, textures, temperature</li>
        <li><strong>Walking:</strong> Feel each step, the contact with the ground</li>
        <li><strong>Shower:</strong> Experience the water temperature, soap scents</li>
      </ul>
    </div>
    <button class="btn btn-primary btn-sm" onclick="alert('Choose an everyday activity and dedicate mindful attention to it for 5 minutes.')">Start now</button>
  </div>`;

EN_SECTIONS['routines-content'] = `
  <div class="routines-container">
    <div class="routine-card">
      <div class="routine-header"><h3>🌅 Morning Routine</h3><span class="time-badge">5-15 minutes</span></div>
      <ul class="routine-list">
        <li><strong>Conscious breathing on waking (2 min)</strong><p>Before getting up, take 10 deep conscious breaths</p></li>
        <li><strong>Intention for the day (3 min)</strong><p>Write or visualise a positive intention for your day</p></li>
        <li><strong>Gentle stretching (5-10 min)</strong><p>Light yoga, basic stretches, or conscious movement</p></li>
        <li><strong>Mindful breakfast</strong><p>Eat without distractions, noticing flavours and textures</p></li>
      </ul>
    </div>
    <div class="routine-card">
      <div class="routine-header"><h3>⚕️ During the Shift</h3><span class="time-badge">2-5 min (multiple times)</span></div>
      <ul class="routine-list">
        <li><strong>Breaks every 90 minutes</strong><p>Brief pause to reset your attention and energy</p></li>
        <li><strong>Breathing between patients</strong><p>3 deep breaths before entering each room</p></li>
        <li><strong>Contact with nature</strong><p>Look out the window, touch a plant, briefly go outside</p></li>
        <li><strong>Hydration and nutrition</strong><p>Keep water nearby, healthy snacks available</p></li>
        <li><strong>Brief chat with a colleague</strong><p>Human connection with trusted co-workers</p></li>
      </ul>
    </div>
    <div class="routine-card">
      <div class="routine-header"><h3>🌙 Evening</h3><span class="time-badge">10-30 minutes</span></div>
      <ul class="routine-list">
        <li><strong>Physical disconnection</strong><p>Change clothes, mentally leave the work space</p></li>
        <li><strong>Regenerative movement</strong><p>Walk, yoga, gentle exercise, or any pleasurable physical activity</p></li>
        <li><strong>Social connection</strong><p>Quality time with family, friends, or a hobby</p></li>
        <li><strong>Closing ritual</strong><p>Reflective writing, gratitude practice, or meditation</p></li>
        <li><strong>Sleep hygiene</strong><p>Relaxing routine 30-60 min before bed (no screens)</p></li>
      </ul>
    </div>
  </div>`;

EN_SECTIONS['regulation-content'] = `
  <div class="regulation-grid">
    <div class="technique-card">
      <h3>🌡️ Emotional Thermometer</h3>
      <p class="technique-desc">Assess the intensity of your emotion and apply the appropriate technique</p>
      <div class="thermometer">
        <div class="temp-level level-low"><strong>1-3: Low Intensity</strong><p>✓ Gentle exercise or a walk</p><p>✓ Conscious breathing</p></div>
        <div class="temp-level level-medium"><strong>4-6: Moderate Intensity</strong><p>✓ DRAW Technique</p><p>✓ 5 Senses (grounding)</p><p>✓ Reflective writing</p></div>
        <div class="temp-level level-high"><strong>7-10: High Intensity</strong><p>✓ Seek immediate support</p><p>✓ Safe emotional discharge</p><p>✓ Contact a professional</p></div>
      </div>
    </div>
    <div class="technique-card">
      <h3>🖐️ The 5 Senses (GROUNDING)</h3>
      <p class="technique-desc">Anchor your attention to the present moment to reduce anxiety</p>
      <div class="grounding-steps">
        <div class="grounding-step">5 things you <strong>SEE</strong></div>
        <div class="grounding-step">4 things you <strong>TOUCH</strong></div>
        <div class="grounding-step">3 things you <strong>HEAR</strong></div>
        <div class="grounding-step">2 things you <strong>SMELL</strong></div>
        <div class="grounding-step">1 thing you <strong>TASTE</strong></div>
      </div>
      <button class="btn btn-secondary btn-sm" onclick="alert('Practise now: look around and identify 5 things you can see...')">Practise now</button>
    </div>
    <div class="technique-card">
      <h3>💭 Compassionate Inner Dialogue</h3>
      <p class="technique-desc">Transform your inner critic into a compassionate ally</p>
      <div class="dialogue-steps">
        <div class="step-box">1. <strong>Acknowledge</strong> the emotion without judgement</div>
        <div class="step-box">2. <strong>Be kind</strong> to yourself (as you would be with a friend)</div>
        <div class="step-box">3. <strong>Ask</strong>: What do I need right now?</div>
      </div>
    </div>
    <div class="technique-card">
      <h3>⚡ Safe Emotional Discharge</h3>
      <p class="technique-desc">Release intense emotions in a healthy way</p>
      <ul class="discharge-list">
        <li><strong>Physical movement:</strong> Dance, pillow boxing, energetic walking</li>
        <li><strong>Free writing:</strong> Without censorship or structure, write everything you feel</li>
        <li><strong>Sound/Vocalisations:</strong> In a private space, shout, cry, sigh deeply</li>
        <li><strong>Expressive art:</strong> Draw, paint, or model clay without aesthetic judgement</li>
      </ul>
    </div>
  </div>`;
