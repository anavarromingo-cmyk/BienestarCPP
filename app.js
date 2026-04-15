// ==========================================
// CONFIGURACIÓN FIREBASE
// ==========================================
// Sustituir con tus claves reales de Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyDazKVlP_psziqwv1UaJrN1j3S7XsxEnbg",
  authDomain: "bienestar-paliativos.firebaseapp.com",
  databaseURL: "https://bienestar-paliativos-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "bienestar-paliativos",
  storageBucket: "bienestar-paliativos.firebasestorage.app",
  messagingSenderId: "543787332247",
  appId: "1:543787332247:web:2f97651846b02568a05c3d",
  measurementId: "G-65F04Y05V8"
};

// Inicializar Firebase
let db;
let auth;
let currentUser = null;

try {
  // Comprobar si ya está inicializado
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  db = firebase.firestore();
  auth = firebase.auth();

  console.log("Firebase inicializado correctamente");

  // Habilitar persistencia sin conexión si es posible
  db.enablePersistence()
    .catch((err) => {
      if (err.code == 'failed-precondition') {
        console.warn('Persistencia falló: Múltiples pestañas abiertas.');
      } else if (err.code == 'unimplemented') {
        console.warn('Persistencia no soportada por el navegador.');
      }
    });

  // Autenticación Anónima
  auth.onAuthStateChanged((user) => {
    const statusText = document.getElementById('status-text');
    const statusDot = document.getElementById('status-dot');

    if (user) {
      currentUser = user;
      console.log("Usuario conectado (ID):", user.uid);
      if (statusText) statusText.textContent = "Conectado";
      if (statusDot) statusDot.style.background = "#4CAF50"; // Green

      // Intentar cargar historial si estamos en la vista de seguimiento
      cargarHistorialFirebase();
    } else {
      console.log("Usuario desconectado. Iniciando sesión anónima...");
      if (statusText) statusText.textContent = "Conectando...";
      if (statusDot) statusDot.style.background = "orange";

      auth.signInAnonymously().catch((error) => {
        console.error("Error en autenticación anónima:", error);
        if (statusText) statusText.textContent = "Error Auth: " + error.code;
        if (statusDot) statusDot.style.background = "red";
      });
    }
  });

} catch (error) {
  console.warn("Firebase no configurado o error de inicialización. La app funcionará en modo local.", error);
}

// ==========================================
// FIN CONFIGURACIÓN FIREBASE
// ==========================================

// Application state
let evaluationResults = {};
let hasCompletedEvaluations = false;

// Sistema de gestión de evaluaciones (en memoria)
class EvaluacionManager {
  constructor() {
    this.evaluaciones = [];
  }

  guardarEvaluacion(tipo, datos, resultados) {
    const evaluacion = {
      id: Date.now(),
      tipo: tipo,
      fecha: new Date().toISOString(),
      datos: {
        profesion: datos.profession || 'No especificada',
        ambito: datos.ambito || 'No especificado',
        edad: datos.age || 'No especificada',
        experiencia: datos.experience || 'No especificada',
        pais: datos.country || 'No especificado'
      },
      resultados: resultados
    };

    // Guardar en memoria local
    this.evaluaciones.push(evaluacion);

    // Guardar en Firebase si está conectado
    if (currentUser && db) {
      db.collection('evaluaciones').add({
        userId: currentUser.uid,
        ...evaluacion,
        timestamp: new Date() // Usar fecha local
      })
        .then((docRef) => {
          console.log("Evaluación guardada en Firebase con ID: ", docRef.id);
          const statusText = document.getElementById('status-text');
          if (statusText) statusText.textContent = "Guardado OK";
          setTimeout(() => { if (statusText) statusText.textContent = "Conectado"; }, 3000);
        })
        .catch((error) => {
          console.error("Error al guardar en Firebase: ", error);
          const statusText = document.getElementById('status-text');
          const statusDot = document.getElementById('status-dot');
          if (statusText) statusText.textContent = "Error Guardando: " + error.code;
          if (statusDot) statusDot.style.background = "orange";
          alert("Error guardando datos: " + error.message + "\nRevisa las Reglas de Firestore.");
        });
    }

    return evaluacion;
  }

  obtenerEvaluaciones(tipo = null) {
    if (tipo) {
      return this.evaluaciones.filter(e => e.tipo === tipo);
    }
    return this.evaluaciones;
  }

  obtenerHistorial() {
    return this.evaluaciones.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  }

  limpiarHistorial() {
    this.evaluaciones = [];
  }
}

const evaluacionManager = new EvaluacionManager();
let evaluacionActual = '';
let demographicData = {};
let currentStep = 'demographics'; // demographics, questionnaire, results
let currentQuestionIndex = 0;
let answers = [];

/**
 * Reinicia los campos demográficos en el modal de evaluación.
 * Si los elementos no existen, se ignora de forma segura.
 */
function resetDemographicsFields() {
  const profesionEl = document.getElementById('eval-profesion');
  const ambitoEl = document.getElementById('eval-ambito');
  const edadEl = document.getElementById('eval-edad');
  const experienciaEl = document.getElementById('eval-experiencia');
  const paisEl = document.getElementById('eval-pais');
  if (profesionEl) profesionEl.value = '';
  if (ambitoEl) ambitoEl.value = '';
  if (edadEl) edadEl.value = '';
  if (experienciaEl) experienciaEl.value = '';
  if (paisEl) paisEl.value = '';
  // Reset consent checkbox
  const consentEl = document.getElementById('eval-consent');
  const consentErr = document.getElementById('consent-error');
  if (consentEl) consentEl.checked = false;
  if (consentErr) consentErr.style.display = 'none';
}

/**
 * Renderiza todas las preguntas de la evaluación en el contenedor del modal.
 * Se construye una lista de preguntas con opciones tipo radio basadas en la configuración.
 *
 * @param {string} evalKey - Clave de la evaluación (burnout, compassion, selfcare)
 */
function renderEvaluationForm(evalKey) {
  const container = document.getElementById('evalItemsContainer');
  if (!container) return;
  container.innerHTML = '';

  const config = evaluations[evalKey];
  if (!config) return;

  // Crear un progreso simple opcional
  const totalQuestions = config.questions.length;

  config.questions.forEach((question, index) => {
    const qWrapper = document.createElement('div');
    qWrapper.className = 'eval-question-item';
    qWrapper.style.marginBottom = '15px';

    const qLabel = document.createElement('p');
    qLabel.textContent = `${index + 1}. ${question}`;
    qLabel.style.marginBottom = '6px';
    qLabel.style.fontWeight = '500';
    qWrapper.appendChild(qLabel);

    const optionsWrapper = document.createElement('div');
    optionsWrapper.className = 'item-options'; // Use CSS class for grid/flex

    config.options.forEach(opt => {
      const label = document.createElement('label');
      label.className = 'option-btn'; // Use CSS class for button style

      const input = document.createElement('input');
      input.type = 'radio';
      input.name = `question-${index}`;
      input.value = opt.value;

      // Event listener for visual selection
      input.addEventListener('change', () => {
        // Remove selected class from siblings
        const siblings = optionsWrapper.querySelectorAll('.option-btn');
        siblings.forEach(sib => sib.classList.remove('selected'));
        // Add to current
        if (input.checked) {
          label.classList.add('selected');
        }
      });

      label.appendChild(input);

      const span = document.createElement('span');
      span.textContent = opt.text;
      label.appendChild(span);

      optionsWrapper.appendChild(label);
    });
    qWrapper.appendChild(optionsWrapper);
    container.appendChild(qWrapper);
  });

  // Al finalizar, mostrar el botón de resultados
  const footer = document.querySelector('#evalModal .eval-modal-footer');
  if (footer) {
    footer.style.display = 'flex';
  }
}

// Navigation
function showSection(sectionId) {
  // Hide all sections
  document.querySelectorAll('.app-section').forEach(section => {
    section.classList.remove('active');
    section.style.display = 'none'; // Ensure hidden
  });

  // Show target section
  const target = document.getElementById(sectionId);
  if (target) {
    target.classList.add('active');
    target.style.display = 'block'; // Ensure visible
  }

  // Update logic triggers
  if (sectionId === 'seguimiento') {
    if (currentUser) {
      cargarHistorialFirebase(); // Recargar historial al entrar
    } else {
      mostrarHistorialEvaluaciones();
    }
  }
  if (sectionId === 'dashboard' && !dashboardLoaded) {
    cargarDashboard();
  }

  // Update nav active state (mobile friendly)
  // ... (omitted purely visual logic if simpler)
}

function abrirEvaluacion(type) {
  // Map legacy or Spanish identifiers to internal keys
  // Accept both the internal key (e.g. "burnout", "compassion", "selfcare") and
  // more user‑friendly names used in the HTML (e.g. "compasion", "autocuidado").
  const keyMap = {
    compasion: 'compassion',
    autocuidado: 'selfcare',
    autoCuidado: 'selfcare',
    burnout: 'burnout',
    compasion: 'compassion'
  };
  // Normalise incoming type to lower‑case and remove accents if necessary
  const normalised = type && typeof type === 'string' ? type.trim().toLowerCase() : '';
  evaluacionActual = keyMap[normalised] || normalised;

  // Si no existe la evaluación solicitada, mostrar advertencia en consola y abortar
  if (!evaluations[evaluacionActual]) {
    console.warn(`Tipo de evaluación desconocido: ${type}`);
    return;
  }
  // Reiniciar estados de navegación interna
  currentStep = 'demographics';
  currentQuestionIndex = 0;
  answers = [];

  // Reiniciar campos demográficos existentes
  resetDemographicsFields();

  // Actualizar título del modal
  const titleElement = document.getElementById('evalTitle');
  if (titleElement) titleElement.textContent = evaluations[evaluacionActual].title;

  // Renderizar preguntas en el contenedor del modal
  renderEvaluationForm(evaluacionActual);

  // Mostrar modal
  const modal = document.getElementById('evalModal');
  if (modal) {
    modal.classList.add('active');
    modal.style.display = 'flex';
  }
}

function startQuestionnaire() {
  // Validate demographics
  const profession = document.getElementById('eval-profesion').value;
  const age = document.getElementById('eval-edad').value;
  const experience = document.getElementById('eval-experiencia').value;
  const country = document.getElementById('eval-pais').value || 'No especificado';

  demographicData = {
    profession: profession || 'No especificada',
    age: age || 'No especificada',
    experience: experience || 'No especificada',
    country: country
  };

  // Switch to questionnaire
  currentStep = 'questionnaire';
  document.getElementById('step-demographics').style.display = 'none';
  document.getElementById('step-questionnaire').style.display = 'block';

  renderQuestion();
}

function renderQuestion() {
  const config = evaluations[evaluacionActual];
  const questionText = config.questions[currentQuestionIndex];
  const progressPercent = ((currentQuestionIndex) / config.questions.length) * 100;

  document.getElementById('evalProgress').style.width = `${progressPercent}%`;
  document.getElementById('questionText').textContent = questionText;
  document.getElementById('questionCounter').textContent = `Pregunta ${currentQuestionIndex + 1} de ${config.questions.length}`;

  // Render options
  const optionsContainer = document.getElementById('optionsContainer');
  optionsContainer.innerHTML = '';

  config.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'btn btn-outline option-btn';
    btn.textContent = opt.text;
    btn.onclick = () => selectOption(opt.value);
    optionsContainer.appendChild(btn);
  });
}

function selectOption(value) {
  answers[currentQuestionIndex] = value;

  if (currentQuestionIndex < evaluations[evaluacionActual].questions.length - 1) {
    currentQuestionIndex++;
    renderQuestion();
  } else {
    calcularResultados();
  }
}

function calcularResultados() {
  console.log('calcularResultados iniciado');

  // Validar consentimiento RGPD
  const consentCheckbox = document.getElementById('eval-consent');
  const consentError = document.getElementById('consent-error');
  if (consentCheckbox && !consentCheckbox.checked) {
    if (consentError) consentError.style.display = 'block';
    consentCheckbox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  if (consentError) consentError.style.display = 'none';

  let puntuacion = 0;
  let interpretacion = '';
  let recomendaciones = [];

  // Obtener datos demográficos de los campos del modal
  const profesion = (document.getElementById('eval-profesion')?.value || '').trim() || 'No especificada';
  const ambito = (document.getElementById('eval-ambito')?.value || '').trim() || 'No especificado';
  const edad = (document.getElementById('eval-edad')?.value || '').trim() || 'No especificada';
  const experiencia = (document.getElementById('eval-experiencia')?.value || '').trim() || 'No especificada';
  const pais = (document.getElementById('eval-pais')?.value || '').trim() || 'No especificado';

  demographicData = { profession: profesion, ambito: ambito, age: edad, experience: experiencia, country: pais };

  // Recoger respuestas de cada pregunta (radios)
  const config = evaluations[evaluacionActual];
  answers = [];
  if (config) {
    config.questions.forEach((_, idx) => {
      const selected = document.querySelector(`input[name="question-${idx}"]:checked`);
      const val = selected ? Number(selected.value) : 0;
      answers.push(val);
    });
  }

  // Cálculo específico según tipo
  if (evaluacionActual === 'burnout') {
    // MBI Scoring
    // Subscales: Emotional Exhaustion (AE), Depersonalization (D), Personal Accomplishment (RP)
    // Items indices (0-based) for each subscale
    const aeItems = [0, 1, 2, 5, 7, 12, 13, 15, 19];
    const dItems = [4, 9, 10, 14, 21];
    const rpItems = [3, 6, 8, 11, 16, 17, 18, 20];

    let aeSum = 0, dSum = 0, rpSum = 0;

    answers.forEach((val, idx) => {
      if (aeItems.includes(idx)) aeSum += val;
      if (dItems.includes(idx)) dSum += val;
      if (rpItems.includes(idx)) rpSum += val;
    });

    // Niveles (basados en manual MBI servicios humanos)
    // AE: Bajo 0-18, Medio 19-26, Alto >26
    // D: Bajo 0-5, Medio 6-9, Alto >9
    // RP: Bajo 0-33, Medio 34-39, Alto >39 (RP es inversa: bajo score = alto burnout)

    const getLevelAE = (s) => s > 26 ? 'Alto' : (s >= 19 ? 'Medio' : 'Bajo');
    const getLevelD = (s) => s > 9 ? 'Alto' : (s >= 6 ? 'Medio' : 'Bajo');
    const getLevelRP = (s) => s < 34 ? 'Bajo' : (s <= 39 ? 'Medio' : 'Alto');

    const levelAE = getLevelAE(aeSum);
    const levelD = getLevelD(dSum);
    const levelRP = getLevelRP(rpSum);

    // Interpretación global (simplificada)
    // Alto Burnout habitualmente es Alto AE + Alto D + Bajo RP
    if (levelAE === 'Alto' && levelD === 'Alto' && levelRP === 'Bajo') {
      interpretacion = 'Alto riesgo de Burnout (Síndrome completo).';
      recomendaciones = ['Consulta con un especialista', 'Revisión urgente de condiciones laborales', 'Prioridad absoluta al descanso'];
    } else if (levelAE === 'Alto' || levelD === 'Alto') {
      interpretacion = 'Riesgo moderado/alto de Burnout. Signos de alerta presentes.';
      recomendaciones = ['Incrementa actividades de desconexión', 'Supervisión de casos', 'Fortalece red de apoyo'];
    } else {
      interpretacion = 'Bajo riesgo de Burnout. Perfil saludable.';
      recomendaciones = ['Mantén tus estrategias actuales', 'Comparte tu bienestar con el equipo'];
    }

    // Guardado detallado
    // (Podríamos guardar subescalas en el objeto de resultados)
    var burnoutSubResultados = {
      ae: { score: aeSum, level: levelAE },
      d: { score: dSum, level: levelD },
      rp: { score: rpSum, level: levelRP }
    };

    // Asignamos puntuación principal AE para gráfica simple
    puntuacion = aeSum;

  } else if (evaluacionActual === 'compassion') {
    // ProQOL v5 Scoring Standard (Stamm, 2010)
    // Escala 1-5 (Nunca=1, ..., Muy a menudo=5)

    // COMPASSION SATISFACTION (CS)
    // Items: 3, 6, 12, 16, 18, 20, 22, 24, 27, 30
    // Indices (0-based): 2, 5, 11, 15, 17, 19, 21, 23, 26, 29
    const csIndices = [2, 5, 11, 15, 17, 19, 21, 23, 26, 29];

    // BURNOUT (BO)
    // Items: 1, 4, 8, 10, 15, 17, 19, 21, 26, 29
    // Indices (0-based): 0, 3, 7, 9, 14, 16, 18, 20, 25, 28
    // *Reverse scored items*: 1, 4, 15, 17, 29 (Indices: 0, 3, 14, 16, 28)
    const boIndices = [0, 3, 7, 9, 14, 16, 18, 20, 25, 28];
    const boReverseIndices = [0, 3, 14, 16, 28];

    // SECONDARY TRAUMATIC STRESS (STS)
    // Items: 2, 5, 7, 9, 11, 13, 14, 23, 25, 28
    // Indices (0-based): 1, 4, 6, 8, 10, 12, 13, 22, 24, 27
    const stsIndices = [1, 4, 6, 8, 10, 12, 13, 22, 24, 27];

    let csSum = 0, boSum = 0, stsSum = 0;

    answers.forEach((val, idx) => {
      // CS Calculation
      if (csIndices.includes(idx)) {
        csSum += val;
      }

      // BO Calculation
      if (boIndices.includes(idx)) {
        if (boReverseIndices.includes(idx)) {
          boSum += (6 - val); // Reverse scoring (1->5, 5->1)
        } else {
          boSum += val;
        }
      }

      // STS Calculation
      if (stsIndices.includes(idx)) {
        stsSum += val;
      }
    });

    // Niveles según Manual ProQOL v5 (Stamm, 2010)
    // Puntuaciones brutas:
    // Bajo: <= 22
    // Medio: 23 - 41
    // Alto: >= 42

    const getProQOLLevel = (score) => {
      if (score <= 22) return 'Bajo';
      if (score <= 41) return 'Medio';
      return 'Alto';
    };

    const levelCS = getProQOLLevel(csSum);
    const levelBO = getProQOLLevel(boSum);
    const levelSTS = getProQOLLevel(stsSum);

    // Interpretación combinada
    if (levelBO === 'Alto' || levelSTS === 'Alto') {
      interpretacion = 'Riesgo Alto de Fatiga por Compasión / Estrés Traumático Secundario.';
      recomendaciones = ['Plan de autocuidado inmediato', 'Búsqueda de apoyo terapéutico', 'Reducción de exposición traumática temporal'];
    } else if (levelCS === 'Bajo') {
      interpretacion = 'Baja Satisfacción por Compasión (Riesgo de Burnout).';
      recomendaciones = ['Reconectar con el propósito', 'Recordar logros pasados', 'Formación y desarrollo'];
    } else {
      interpretacion = 'Calidad de Vida Profesional Equilibrada.';
      recomendaciones = ['Continúa monitoreando tu bienestar', 'Mantén rutinas saludables'];
    }

    var proqolSubResultados = {
      cs: { score: csSum, level: levelCS },
      bo: { score: boSum, level: levelBO },
      sts: { score: stsSum, level: levelSTS }
    };

    puntuacion = csSum; // Show CS as main positive score

  } else {
    // Autocuidado
    puntuacion = Math.round((answers.reduce((a, b) => a + b, 0) / (answers.length * 5)) * 100);

    if (puntuacion > 70) {
      interpretacion = 'Excelente rutina de autocuidado.';
      recomendaciones = ['Mantén tu rutina', 'Sé mentor de otros'];
    } else if (puntuacion > 40) {
      interpretacion = 'Autocuidado moderado, áreas de mejora.';
      recomendaciones = ['Identifica 1-2 áreas para mejorar', 'Pequeños cambios diarios'];
    } else {
      interpretacion = 'Autocuidado insuficiente. Riesgo de salud.';
      recomendaciones = ['Prioridad absoluta: dormir y comer bien', 'Buscar apoyo'];
    }
  }

  // Guardar resultado
  const resultadosHist = {
    total: puntuacion,
    level: { text: interpretacion.split('.')[0] },
    recomendaciones: recomendaciones,
    subscales: (evaluacionActual === 'burnout') ? burnoutSubResultados : ((evaluacionActual === 'compassion') ? proqolSubResultados : null)
  };
  evaluacionManager.guardarEvaluacion(evaluacionActual, demographicData, resultadosHist);
  hasCompletedEvaluations = true;

  window.resultadoActual = {
    tipo: evaluacionActual,
    titulo: evaluations[evaluacionActual].title,
    puntuacion: puntuacion,
    interpretacion: interpretacion,
    recomendaciones: recomendaciones,
    profesion: profesion,
    ambito: ambito,
    edad: edad,
    experiencia: experiencia,
    fecha: new Date().toLocaleDateString('es-ES'),
    subscales: (evaluacionActual === 'burnout') ? burnoutSubResultados : ((evaluacionActual === 'compassion') ? proqolSubResultados : null)
  };

  const modal = document.getElementById('evalModal');
  if (modal) {
    modal.classList.remove('active');
    modal.style.display = 'none';
  }
  setTimeout(() => {
    mostrarResultados();
  }, 300);
}

function mostrarResultados() {
  const r = window.resultadoActual;

  document.getElementById('resultadoTitulo').textContent = 'Resultados - ' + r.titulo;
  document.getElementById('resultadoSubtitulo').textContent = 'Evaluación completada el ' + r.fecha;
  document.getElementById('resultado-fecha').textContent = r.fecha;
  document.getElementById('resultado-profesion').textContent = r.profesion;
  const ambitoNames = {
    'paliativos_pediatricos': 'Paliativos pediátricos',
    'paliativos_adultos': 'Paliativos de adultos',
    'otras_pediatricas': 'Otras especialidades pediátricas',
    'otras_adultos': 'Otras especialidades de adultos'
  };
  document.getElementById('resultado-ambito').textContent = ambitoNames[r.ambito] || r.ambito || 'No especificado';
  document.getElementById('resultado-edad').textContent = r.edad || '-';
  document.getElementById('resultado-experiencia').textContent = r.experiencia || '-';
  document.getElementById('resultado-puntuacion').textContent = r.puntuacion;
  document.getElementById('resultado-interpretacion').textContent = r.interpretacion;

  // Mostrar subescalas si existen
  const scoreContainer = document.getElementById('resultado-puntuacion-container');
  // Limpiar subescalas previas si las hubiera (manteniendo el total)
  const existingSubscales = scoreContainer.querySelectorAll('.subscale-item');
  existingSubscales.forEach(el => el.remove());

  if (r.subscales) {
    const subscaleWrapper = document.createElement('div');
    subscaleWrapper.className = 'subscale-item'; // Clase para facil limpieza
    subscaleWrapper.style.marginTop = '20px';
    subscaleWrapper.style.textAlign = 'left';
    subscaleWrapper.style.fontSize = '0.9em';
    subscaleWrapper.style.borderTop = '1px solid rgba(255,255,255,0.3)';
    subscaleWrapper.style.paddingTop = '10px';

    Object.entries(r.subscales).forEach(([key, val]) => {
      // Map keys to readable names
      const names = {
        ae: 'Agotamiento Emocional',
        d: 'Despersonalización',
        rp: 'Realización Personal',
        cs: 'Satisfacción por Compasión',
        bo: 'Burnout (ProQOL)',
        sts: 'Estrés Traumático Secundario'
      };

      const p = document.createElement('p');
      p.style.margin = '4px 0';
      p.style.display = 'flex';
      p.style.justifyContent = 'space-between';
      p.innerHTML = `<span>${names[key] || key.toUpperCase()}:</span> <strong>${val.score} (${val.level})</strong>`;
      subscaleWrapper.appendChild(p);
    });
    scoreContainer.appendChild(subscaleWrapper);
  }

  const recList = document.getElementById('resultado-recomendaciones');
  recList.innerHTML = '';
  r.recomendaciones.forEach(rec => {
    const li = document.createElement('li');
    li.textContent = rec;
    recList.appendChild(li);
  });

  // Generar un mini-plan inmediato para el modal
  let planTexto = '';
  if (r.tipo === 'burnout' && r.puntuacion > 26) {
    planTexto = "Recomendación inmediata: Agenda una cita con salud laboral o tu supervisor. Prioriza el descanso físico.";
  } else if (r.tipo === 'compassion' && (window.resultadoActual.subscales?.sts?.level === 'Alto')) {
    planTexto = "Recomendación inmediata: Practica la técnica de 'Grounding' (Bibliotheca > Recursos) ahora mismo.";
  } else if (r.tipo === 'selfcare' && r.puntuacion < 50) {
    planTexto = "Recomendación inmediata: Elige una acción pequeña de autocuidado (ej. beber agua, estirar) y hazla hoy.";
  } else {
    planTexto = "Revisa las recomendaciones arriba y consulta la sección de 'Mi Seguimiento' para un plan detallado.";
  }
  document.getElementById('resultado-plan').innerHTML = `<p>${planTexto}</p>`;

  const modal = document.getElementById('resultadoModal');
  modal.classList.add('activo');
  modal.style.display = 'flex';
}

function cerrarResultado() {
  document.getElementById('resultadoModal').classList.remove('activo');
  document.getElementById('resultadoModal').style.display = 'none';
}

function cerrarEvaluacion() {
  document.getElementById('evalModal').classList.remove('active');
  document.getElementById('evalModal').style.display = 'none';
}

// Data structures
const evaluations = {
  burnout: {
    name: 'Burnout',
    title: 'Evaluación de Burnout',
    // MBI-HSS (Human Services Survey) - 22 items
    questions: [
      'Me siento emocionalmente agotado/a por mi trabajo.', // 1. AE
      'Me siento cansado al final de la jornada de trabajo.', // 2. AE
      'Cuando me levanto por la mañana y me enfrento a otra jornada de trabajo me siento fatigado.', // 3. AE
      'Siento que puedo entender fácilmente a las personas que tengo que atender.', // 4. RP
      'Siento que estoy tratando a algunos pacientes como si fuesen objetos impersonales.', // 5. D
      'Siento que trabajar todo el día con la gente me cansa.', // 6. AE
      'Siento que trato con mucha efectividad los problemas de las personas a las que tengo que atender.', // 7. RP
      'Siento que mi trabajo me está desgastando.', // 8. AE
      'Siento que estoy influyendo positivamente en las vidas de otras personas a través de mi trabajo.', // 9. RP
      'Me he vuelto más insensible con la gente desde que ejerzo la profesión.', // 10. D
      'Me preocupa que este trabajo me esté endureciendo emocionalmente.', // 11. D
      'Me siento muy enérgico/a en mi trabajo.', // 12. RP
      'Me siento frustrado/a por el trabajo.', // 13. AE
      'Siento que estoy demasiado tiempo en mi trabajo.', // 14. AE
      'Siento que realmente no me importa lo que les ocurra a las personas a las que tengo que atender profesionalmente.', // 15. D
      'Trabajar en contacto directo con las personas me produce bastante estrés.', // 16. AE
      'Tengo facilidad para crear una atmósfera relajada a mis pacientes.', // 17. RP
      'Me encuentro animado/a después de trabajar junto con los pacientes.', // 18. RP
      'He realizado muchas cosas que merecen la pena en este trabajo.', // 19. RP
      'En el trabajo siento que estoy al límite de mis posibilidades.', // 20. AE
      'En mi trabajo trato los problemas emocionalmente con mucha calma.', // 21. RP
      'Creo que los pacientes me culpan de algunos de sus problemas.' // 22. D
    ],
    // Escala de frecuencia 0-6
    options: [
      { text: "Nunca", value: 0 },
      { text: "Pocas veces al año o menos", value: 1 },
      { text: "Una vez al mes o menos", value: 2 },
      { text: "Unas pocas veces al mes", value: 3 },
      { text: "Una vez a la semana", value: 4 },
      { text: "Unas pocas veces a la semana", value: 5 },
      { text: "Todos los días", value: 6 }
    ],
    // Indices para subescalas (0-indexed based on the array above)
    indices: {
      AE: [0, 1, 2, 5, 7, 12, 13, 15, 19], // Agotamiento Emocional (9 items)
      D: [4, 9, 10, 14, 21], // Despersonalización (5 items)
      RP: [3, 6, 8, 11, 16, 17, 18, 20] // Realización Personal (8 items)
    }
  },
  compassion: {
    name: 'Fatiga por Compasión',
    title: 'Evaluación de Fatiga por Compasión',
    description: 'Considere cada una de las siguientes preguntas sobre usted y su situación laboral actual. Seleccione el número que refleje honestamente la frecuencia con la que ha experimentado estas cosas en los últimos 30 días.',
    questions: [
      "Me siento feliz.", // 1. CS
      "Estoy preocupado/a por más de uno/a de los/as niños/as que atiendo.", // 2. BO
      "Obtengo satisfacción por el hecho de poder ayudar a la gente.", // 3. CS
      "Me siento conectado/a con otros.", // 4. CS
      "Me asusto o sorprendo ante ruidos inesperados.", // 5. STS
      "Me siento con energía después de trabajar con los/as niños/as que atiendo.", // 6. CS
      "Me resulta difícil separar mi vida privada de mi vida como cuidador/a.", // 7. STS
      "No me siento tan productivo/a en mi trabajo porque no duermo bien debido a las experiencias traumáticas de las personas a las que atiendo.", // 8. STS
      "Creo que el estrés traumático de aquellos a los que atiendo me ha afectado.", // 9. STS
      "Me siento atrapado/a en mi trabajo como cuidador/a.", // 10. BO
      "Debido a mi trabajo como cuidador/a, me he sentido 'al límite' por distintas cosas.", // 11. STS
      "Me gusta mi trabajo como cuidador/a.", // 12. CS
      "Me siento deprimido/a por las experiencias traumáticas de las personas a las que atiendo.", // 13. STS
      "Siento como si estuviera experimentando el trauma de alguien a quien he atendido.", // 14. STS
      "Tengo creencias que me sostienen.", // 15. CS
      "Me agrada ser capaz de seguir el ritmo de las nuevas técnicas y protocolos de asistencia.", // 16. CS
      "Soy la persona que siempre quise ser.", // 17. CS
      "Mi trabajo me satisface.", // 18. CS
      "Me siento agotado/a a causa de mi trabajo como cuidador/a.", // 19. BO
      "Tengo pensamientos y sentimientos de felicidad por aquellos/as a los que atiendo y por cómo puedo ayudarles.", // 20. CS
      "Me siento abrumado/a porque la carga de mi trabajo parece interminable.", // 21. BO
      "Creo que puedo marcar la diferencia a través de mi trabajo.", // 22. CS
      "Evito ciertas actividades o situaciones porque me recuerdan las experiencias traumáticas de las personas a las que atiendo.", // 23. STS
      "Estoy orgulloso/a de lo que puedo hacer para ayudar.", // 24. CS
      "Como resultado de mi asistencia, tengo pensamientos intrusivos y aterradores.", // 25. STS
      "Me siento atascado/a por el sistema.", // 26. BO
      "Tengo la idea de que tengo éxito como cuidador/a.", // 27. CS
      "No puedo recordar partes importantes de mi trabajo con víctimas de trauma.", // 28. STS
      "Soy una persona muy humanitaria.", // 29. CS
      "Me siento feliz por haber elegido hacer este trabajo." // 30. CS
    ],
    // Escala 1-5
    options: [
      { text: "Nunca", value: 1 },
      { text: "Rara vez", value: 2 },
      { text: "A veces", value: 3 },
      { text: "A menudo", value: 4 },
      { text: "Muy a menudo", value: 5 }
    ]
  },
  selfcare: {
    name: 'Autocuidado',
    title: 'Evaluación de Autocuidado',
    description: 'Evalúe sus prácticas actuales de autocuidado (1 = Nunca, 5 = Siempre).',
    questions: [
      "Duermo las horas que necesito para sentirme descansado/a.",
      "Hago ejercicio físico regularmente.",
      "Mantengo una dieta equilibrada y me hidrato bien.",
      "Dedico tiempo a actividades que disfruto fuera del trabajo.",
      "Mantengo contacto regular con amigos y familia.",
      "Soy capaz de desconectar mentalmente del trabajo al salir.",
      "Practico alguna técnica de relajación o mindfulness.",
      "Busco apoyo cuando me siento desbordado/a.",
      "Me permito sentir y expresar mis emociones.",
      "Tengo claras mis prioridades y valores personales."
    ],
    options: [
      { text: "Nunca", value: 1 },
      { text: "Rara vez", value: 2 },
      { text: "A veces", value: 3 },
      { text: "A menudo", value: 4 },
      { text: "Siempre", value: 5 }
    ]
  }
};

// Funciones de gestión del historial simplificadas (duplicación evitada)
function cargarHistorialFirebase() {
  if (!currentUser || !db) return;
  console.log("Cargando historial desde Firebase...");

  db.collection('evaluaciones')
    .where('userId', '==', currentUser.uid)
    .orderBy('timestamp', 'desc')
    .get()
    .then((querySnapshot) => {
      evaluacionManager.limpiarHistorial();
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        evaluacionManager.evaluaciones.push({
          id: data.id || doc.id,
          tipo: data.tipo,
          fecha: data.fecha,
          datos: data.datos,
          resultados: data.resultados
        });
      });
      console.log(`Historial cargado: ${evaluacionManager.evaluaciones.length}`);
      if (document.getElementById('seguimiento').classList.contains('active')) {
        mostrarHistorialEvaluaciones();
      }
      if (evaluacionManager.evaluaciones.length > 0) hasCompletedEvaluations = true;
    })
    .catch((error) => {
      console.error("Error historial:", error);
      // Fallback para índice faltante
      if (error.code === 'failed-precondition') {
        db.collection('evaluaciones').where('userId', '==', currentUser.uid).get()
          .then(qs => {
            evaluacionManager.limpiarHistorial();
            qs.forEach(d => {
              const data = d.data();
              evaluacionManager.evaluaciones.push({
                id: data.id || d.id,
                tipo: data.tipo,
                fecha: data.fecha,
                datos: data.datos,
                resultados: data.resultados
              });
            });
            evaluacionManager.evaluaciones.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
            if (document.getElementById('seguimiento').classList.contains('active')) {
              mostrarHistorialEvaluaciones();
            }
          });
      }
    });
}

function mostrarHistorialEvaluaciones() {
  const container = document.getElementById('evaluationHistory');
  if (!container) return;

  const historial = evaluacionManager.obtenerHistorial();

  if (historial.length === 0) {
    container.innerHTML = '<p class="empty-state">Aún no has completado ninguna evaluación. <a href="#" onclick="showSection(\'evaluaciones\'); return false;">Comienza ahora</a></p>';
    return;
  }

  container.innerHTML = historial.map(item => {
    return `
      <div style="background: var(--color-surface); padding: 15px; margin-bottom: 15px; border-radius: 8px; border-left: 4px solid var(--color-primary); box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <h4 style="margin: 0 0 5px 0;">${evaluations[item.tipo]?.name || item.tipo}</h4>
        <div style="font-size: 0.9em; color: #666;">
          <p style="margin: 2px 0;">Fecha: ${new Date(item.fecha).toLocaleDateString()}</p>
          <p style="margin: 2px 0;">País: ${item.datos.pais || 'No especificado'}</p>
          <p style="margin: 5px 0; font-weight: bold;">Puntuación: ${item.resultados.total}</p>
        </div>
      </div>
    `;
  }).join('');
}

// Generate Plan Logic (Placeholder for full generation logic)
// Generate Plan Logic
function generatePersonalPlan() {
  const planContainer = document.getElementById('personalPlan');
  if (!planContainer) return;

  const history = evaluacionManager.obtenerHistorial();
  if (history.length === 0) {
    alert("Para generar un plan personalizado, primero debes completar al menos una evaluación.");
    return;
  }

  // Análisis simple de la última evaluación de cada tipo
  const latestBurnout = history.find(h => h.tipo === 'burnout');
  const latestCompassion = history.find(h => h.tipo === 'compassion');
  const latestSelfcare = history.find(h => h.tipo === 'selfcare');

  let planHTML = '<div style="text-align: left;">';
  let acciones = [];

  // Lógica de generación de recomendaciones
  if (latestBurnout) {
    const score = latestBurnout.resultados.total; // AE Score mainly
    if (score > 26) {
      acciones.push("<strong>🚨 Prioridad Burnout:</strong> Tus niveles de agotamiento son altos. Programa 2 días de desconexión total este mes.");
      acciones.push("🗣️ <strong>Supervisión:</strong> Solicita una reunión de supervisión clínica para revisar casos difíciles.");
    } else if (score > 18) {
      acciones.push("⚠️ <strong>Atención Burnout:</strong> Estás en zona de riesgo. Revisa tus límites horarios esta semana.");
    }
  }

  if (latestCompassion) {
    const csScore = latestCompassion.resultados.subscales?.cs?.score || 0;
    const stsScore = latestCompassion.resultados.subscales?.sts?.score || 0;

    if (stsScore > 40) { // High STS (using approx percentage logic if raw score)
      acciones.push("🛡️ <strong>Trauma Secundario:</strong> Reduce la exposición a historias traumáticas fuera del trabajo (noticias, redes).");
      acciones.push("🧘 <strong>Regulación:</strong> Practica la técnica DRAW tras cada encuentro difícil.");
    }
    if (csScore < 35) { // Low Compassion Satisfaction
      acciones.push("❤️ <strong>Reconexión:</strong> Escribe cada viernes 3 cosas que agradeces de tu trabajo.");
    }
  }

  if (latestSelfcare) {
    const score = latestSelfcare.resultados.total; // 0-100
    if (score < 50) {
      acciones.push("🥗 <strong>Básicos:</strong> Tu autocuidado necesita refuerzo inmediato. Enfócate solo en dormir 7h y comer sentado.");
    } else if (score < 75) {
      acciones.push("🏃 <strong>Mantenimiento:</strong> Añade una actividad física de 20 min a tu rutina semanal.");
    }
  }

  // Fallback si todo está bien
  if (acciones.length === 0) {
    acciones.push("🌟 <strong>Mantenimiento:</strong> Tus niveles son saludables. Continúa con tus rutinas actuales y comparte tus estrategias con compañeros.");
    acciones.push("📚 <strong>Formación:</strong> Considera mentorizar a colegas más jóvenes.");
  }

  // Construir HTML
  planHTML += '<ul style="list-style: none; padding: 0;">';
  acciones.forEach(accion => {
    planHTML += `<li style="margin-bottom: 12px; padding: 10px; background: var(--color-background); border-left: 3px solid var(--color-primary); border-radius: 4px;">${accion}</li>`;
  });
  planHTML += '</ul>';

  // Agregar botón de descarga o acción extra
  planHTML += `<div style="margin-top: 15px; font-size: 0.9em; color: var(--color-text-secondary);">
    Generado el ${new Date().toLocaleDateString()} a las ${new Date().toLocaleTimeString()}
  </div></div>`;

  planContainer.innerHTML = planHTML;

  // Visual feedback
  const btn = document.getElementById('generatePlanBtn');
  if (btn) {
    btn.textContent = "Plan Actualizado ✅";
    setTimeout(() => btn.textContent = "Regenerar Plan Personalizado", 3000);
  }
}

function saveDemographicsAndStart() {
  // Logic for the *other* form (initial flow if used)
  const profession = document.getElementById('profession')?.value;
  const age = document.getElementById('age')?.value;
  const experience = document.getElementById('experience')?.value;
  const country = document.getElementById('country')?.value || 'No especificado';

  if (document.getElementById('demographics-section')) {
    // If this is part of a specific flow
    demographicData = { profession, age, experience, country };
    // Trigger next step...
  }
}

// Main listeners
window.addEventListener('DOMContentLoaded', () => {
  showSection('inicio'); // Default

  // Modal closers
  document.getElementById('evalModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('evalModal')) cerrarEvaluacion();
  });

  document.getElementById('resultadoModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('resultadoModal')) cerrarResultado();
  });

  // Check history
  const histContainer = document.getElementById('evaluationHistory');
  if (histContainer) mostrarHistorialEvaluaciones();
});
// ==========================================
// NAVIGATION & INTERACTION LOGIC
// ==========================================

function showResourceTab(tabId) {
  // Hide all resource tabs
  document.querySelectorAll('.resource-tab').forEach(tab => {
    tab.classList.remove('active');
    tab.style.display = 'none'; // Ensure hidden
  });

  // Show selected tab
  const selectedTab = document.getElementById(tabId + '-tab');
  if (selectedTab) {
    selectedTab.classList.add('active');
    selectedTab.style.display = 'block';
  }

  // Update button states
  // We assume buttons have onClick="showResourceTab('id')" so we can find them by context or querying
  // Easier: Query all buttons in .resources-tabs
  const resourceBtns = document.querySelector('#recursos .resources-tabs')?.querySelectorAll('.tab-btn');
  if (resourceBtns) {
    resourceBtns.forEach(btn => {
      // Check if this button's onclick string contains the tabId
      if (btn.getAttribute('onclick')?.includes(tabId)) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }
}

function showLibraryTab(tabId) {
  // Hide all library tabs
  document.querySelectorAll('.library-tab').forEach(tab => {
    tab.classList.remove('active');
    tab.style.display = 'none';
  });

  // Show selected tab
  const selectedTab = document.getElementById(tabId + '-tab');
  if (selectedTab) {
    selectedTab.classList.add('active');
    selectedTab.style.display = 'block';
  }

  // Update button states
  const libraryBtns = document.querySelector('#biblioteca .resources-tabs')?.querySelectorAll('.tab-btn');
  if (libraryBtns) {
    libraryBtns.forEach(btn => {
      if (btn.getAttribute('onclick')?.includes(tabId)) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }
}

// Content for guides (Simulated as we don't have external files yet)
const guideContentMap = {
  autocuidado: {
    title: "Plan de Autocuidado para CPP",
    content: `<h3>1. Fundamentos del Autocuidado</h3>
    <p>El autocuidado no es un lujo, es una responsabilidad ética.</p>
    <ul>
      <li><strong>Físico:</strong> Dormir 7-8h, comer sentado y despacio, hidratación constante.</li>
      <li><strong>Emocional:</strong> Permitirse llorar, tener un "compañero de batalla", terapia personal.</li>
    </ul>
    <h3>2. Estrategias en Turno</h3>
    <p>Usa la regla de los 90 minutos: cada 90 min de trabajo intenso, toma 5 min de desconexión.</p>`
  },
  alertas: {
    title: "Señales de Alerta Temprana",
    content: `<h3>Identifica tus Señales</h3>
    <p>El burnout no aparece de golpe. Busca estos signos:</p>
    <ul>
      <li>Cinismo o sarcasmo excesivo con pacientes.</li>
      <li>Temor al ir a trabajar ("síndrome del domingo por la noche").</li>
      <li>Alteraciones del sueño recurrentes.</li>
      <li>Aislamiento del equipo.</li>
    </ul>`
  },
  equipo: {
    title: "Apoyo en Equipo",
    content: `<h3>Cuidar al Cuidador en Grupo</h3>
    <p>Estrategias para líderes y compañeros:</p>
    <ul>
      <li><strong>Check-in:</strong> Iniciar reuniones preguntando "¿Cómo llegamos hoy?".</li>
      <li><strong>Debriefing:</strong> Espacio seguro tras fallecimientos.</li>
      <li><strong>Celebración:</strong> Reconocer pequeños éxitos y cumpleaños.</li>
    </ul>`
  },
  mindfulness: {
    title: "Guía de Mindfulness",
    content: `<h3>Mindfulness en Acción</h3>
    <p>No necesitas 30 minutos. Prueba esto:</p>
    <ul>
      <li><strong>Respiración 4-7-8:</strong> Inhala 4, reten 7, exhala 8.</li>
      <li><strong>STOP:</strong> Stop (para), Take a breath (respira), Observe (observa), Proceed (prosigue).</li>
    </ul>`
  }
};

let currentGuideType = null;

function leerGuia(type) {
  const guide = guideContentMap[type];
  if (!guide) {
    alert("Contenido no disponible actualmente.");
    return;
  }

  currentGuideType = type;
  document.getElementById('guiaTitle').textContent = guide.title;
  document.getElementById('guiaContent').innerHTML = guide.content;

  const modal = document.getElementById('guiaModal');
  if (modal) {
    modal.style.display = 'flex';
  }
}

function cerrarGuia() {
  document.getElementById('guiaModal').style.display = 'none';
}

function descargarGuia(type) {
  // Simulación de descarga
  const guide = guideContentMap[type];
  if (!guide) return;

  alert(`Iniciando descarga de: ${guide.title}.pdf\n(Simulación: En producción esto descargaría el archivo real)`);
}

function descargarGuiaActual() {
  if (currentGuideType) {
    descargarGuia(currentGuideType);
  }
}

function startGuidedExercise(type) {
  alert("Iniciando ejercicio guiado: " + type + "\n(Aquí se abriría el reproductor de audio o el paso a paso interactivo)");
}

// ==========================================
// EXPOSE FUNCTIONS GLOBALLY
// ==========================================
// Update existing exports and add new ones
const _globalFns = {
  showSection,
  abrirEvaluacion,
  cerrarEvaluacion,
  startQuestionnaire,
  calcularResultados,
  cerrarResultado,
  mostrarHistorialEvaluaciones,
  cargarHistorialFirebase,
  generatePersonalPlan,
  showResourceTab,
  showLibraryTab,
  leerGuia,
  cerrarGuia,
  descargarGuia,
  descargarGuiaActual,
  startGuidedExercise,
  applyDashboardFilters,
  resetDashboardFilters,
  toggleMenu: function () {
    const menu = document.getElementById('navMenu');
    if (menu) menu.classList.toggle('active');
  }
};

Object.keys(_globalFns).forEach(key => {
  window[key] = _globalFns[key];
});

// ==========================================
// DASHBOARD (Real-time with Firebase)
// ==========================================
let dashboardCharts = {};
let dashboardLoaded = false;
let dashboardRawData = []; // Store raw data for filtering

// Continent mapping for countries
const CONTINENT_MAP = {
  // Europe
  'España': 'europa', 'ESPAÑA': 'europa', 'Espala': 'europa', 'spain': 'europa',
  'Portugal': 'europa', 'Italia': 'europa', 'Francia': 'europa', 'Alemania': 'europa',
  'Reino Unido': 'europa', 'Holanda': 'europa', 'Bélgica': 'europa', 'Suiza': 'europa',
  'Austria': 'europa', 'Irlanda': 'europa', 'Suecia': 'europa', 'Noruega': 'europa',
  'Dinamarca': 'europa', 'Finlandia': 'europa', 'Polonia': 'europa', 'Grecia': 'europa',
  'Rumanía': 'europa', 'Hungría': 'europa', 'Chequia': 'europa',
  // Latin America
  'Argentina': 'latam', 'México': 'latam', 'Mexico': 'latam', 'uruguay': 'latam',
  'Uruguay': 'latam', 'Chile': 'latam', 'Colombia': 'latam', 'Perú': 'latam',
  'Peru': 'latam', 'Ecuador': 'latam', 'Brasil': 'latam', 'Venezuela': 'latam',
  'Bolivia': 'latam', 'Paraguay': 'latam', 'Costa Rica': 'latam',
  'Panamá': 'latam', 'Guatemala': 'latam', 'Honduras': 'latam',
  'El Salvador': 'latam', 'Nicaragua': 'latam', 'Cuba': 'latam',
  'República Dominicana': 'latam', 'Puerto Rico': 'latam'
};

function getContinent(pais) {
  if (!pais || pais === 'No especificado' || pais === '?' || pais === 'Prueba') return 'otro';
  return CONTINENT_MAP[pais] || 'otro';
}

function applyDashboardFilters() {
  const regionFilter = document.getElementById('filter-region')?.value || 'all';
  const profFilter = document.getElementById('filter-profesion')?.value || 'all';
  const ambitoFilter = document.getElementById('filter-ambito')?.value || 'all';

  let filtered = dashboardRawData;

  if (regionFilter !== 'all') {
    filtered = filtered.filter(d => {
      const pais = d.datos?.pais || 'No especificado';
      return getContinent(pais) === regionFilter;
    });
  }

  if (profFilter !== 'all') {
    filtered = filtered.filter(d => {
      const prof = d.datos?.profesion || '';
      return prof === profFilter;
    });
  }

  if (ambitoFilter !== 'all') {
    filtered = filtered.filter(d => {
      const ambito = d.datos?.ambito || 'paliativos_pediatricos';
      return ambito === ambitoFilter;
    });
  }

  // Update filter counter
  const activeFilters = [regionFilter, profFilter, ambitoFilter].filter(f => f !== 'all').length;
  const countEl = document.getElementById('filter-count');
  if (countEl) {
    if (activeFilters > 0) {
      countEl.textContent = `${filtered.length} de ${dashboardRawData.length} evaluaciones`;
      countEl.style.display = 'inline-block';
    } else {
      countEl.style.display = 'none';
    }
  }

  renderDashboard(filtered);
}

function resetDashboardFilters() {
  document.getElementById('filter-region').value = 'all';
  document.getElementById('filter-profesion').value = 'all';
  document.getElementById('filter-ambito').value = 'all';
  document.getElementById('filter-count').style.display = 'none';
  renderDashboard(dashboardRawData);
}

// Correct scoring thresholds per validated manuals
const SCORING = {
  // MBI-HSS (Maslach, Jackson & Leiter, 1996; Seisdedos, 1997)
  mbi: {
    ae: { bajo: [0, 18], medio: [19, 26], alto: [27, Infinity] },
    d:  { bajo: [0, 5],  medio: [6, 9],   alto: [10, Infinity] },
    rp: { alto: [0, 33], medio: [34, 39], bajo: [40, Infinity] } // Inverted: low score = high burnout
  },
  // ProQOL v5 (Stamm, 2010)
  proqol: {
    cs:  { bajo: [0, 22], medio: [23, 41], alto: [42, Infinity] },
    bo:  { bajo: [0, 22], medio: [23, 41], alto: [42, Infinity] },
    sts: { bajo: [0, 22], medio: [23, 41], alto: [42, Infinity] }
  }
};

function classifyScore(score, thresholds) {
  if (score >= thresholds.alto[0] && score <= thresholds.alto[1]) return 'Alto';
  if (score >= thresholds.medio[0] && score <= thresholds.medio[1]) return 'Medio';
  return 'Bajo';
}

function cargarDashboard() {
  if (!db) {
    document.getElementById('dashboard-loading').innerHTML = '<p>⚠️ Firebase no conectado. El dashboard requiere conexión a Firebase.</p>';
    return;
  }

  // Use onSnapshot for real-time updates
  db.collection('evaluaciones').onSnapshot((snapshot) => {
    const allData = [];
    snapshot.forEach(doc => allData.push(doc.data()));
    dashboardRawData = allData; // Store for filtering
    applyDashboardFilters(); // Apply current filters (or show all)
  }, (error) => {
    console.error('Error loading dashboard:', error);
    // Fallback: try without ordering
    db.collection('evaluaciones').get().then(snapshot => {
      const allData = [];
      snapshot.forEach(doc => allData.push(doc.data()));
      dashboardRawData = allData;
      applyDashboardFilters();
    }).catch(err => {
      document.getElementById('dashboard-loading').innerHTML = `<p>⚠️ Error: ${err.message}</p>`;
    });
  });
}

function renderDashboard(data) {
  if (data.length === 0) {
    document.getElementById('dashboard-loading').innerHTML = '<p>📭 Aún no hay evaluaciones registradas. ¡Sé el primero!</p>';
    return;
  }

  document.getElementById('dashboard-loading').style.display = 'none';
  document.getElementById('dashboard-content').style.display = 'block';

  // Classify evaluations
  const burnoutEvals = data.filter(d => d.tipo === 'burnout');
  const compassionEvals = data.filter(d => d.tipo === 'compassion');
  const selfcareEvals = data.filter(d => d.tipo === 'selfcare');

  // Unique users and countries
  const uniqueUsers = new Set(data.map(d => d.userId).filter(Boolean));
  const countries = {};
  data.forEach(d => {
    const c = d.datos?.pais || 'No especificado';
    if (c && c !== 'No especificado') countries[c] = (countries[c] || 0) + 1;
  });

  // KPIs
  document.getElementById('kpi-total').textContent = data.length;
  document.getElementById('kpi-burnout').textContent = burnoutEvals.length;
  document.getElementById('kpi-compassion').textContent = compassionEvals.length;
  document.getElementById('kpi-selfcare').textContent = selfcareEvals.length;
  document.getElementById('kpi-professionals').textContent = uniqueUsers.size;
  document.getElementById('kpi-countries').textContent = Object.keys(countries).length;

  // Profession distribution
  const professionLabels = {
    medico: 'Médico/a', enfermero: 'Enfermero/a', psicologo: 'Psicólogo/a',
    fisioterapeuta: 'Fisioterapeuta', trabajador: 'Trabajador/a Social',
    otro: 'Otro', 'No especificada': 'No especificada'
  };
  const profCounts = {};
  data.forEach(d => {
    const p = d.datos?.profesion || 'No especificada';
    const label = professionLabels[p] || p;
    profCounts[label] = (profCounts[label] || 0) + 1;
  });

  // Ámbito distribution
  const ambitoLabels = {
    paliativos_pediatricos: 'Paliativos pediátricos',
    paliativos_adultos: 'Paliativos de adultos',
    otras_pediatricas: 'Otras esp. pediátricas',
    otras_adultos: 'Otras esp. de adultos',
    'No especificado': 'No especificado'
  };
  const ambitoCounts = {};
  data.forEach(d => {
    // Existing records without ámbito are all from pediatric palliative care
    const a = d.datos?.ambito || 'paliativos_pediatricos';
    const label = ambitoLabels[a] || a;
    ambitoCounts[label] = (ambitoCounts[label] || 0) + 1;
  });

  // MBI risk levels recalculated from subscales
  const mbiLevels = { ae: {Bajo:0, Medio:0, Alto:0}, d: {Bajo:0, Medio:0, Alto:0}, rp: {Bajo:0, Medio:0, Alto:0} };
  const mbiGlobalRisk = { Bajo: 0, Moderado: 0, Alto: 0 };
  burnoutEvals.forEach(ev => {
    const sub = ev.resultados?.subscales;
    if (sub) {
      const aeScore = sub.ae?.score ?? 0;
      const dScore = sub.d?.score ?? 0;
      const rpScore = sub.rp?.score ?? 0;
      const aeLevel = classifyScore(aeScore, SCORING.mbi.ae);
      const dLevel = classifyScore(dScore, SCORING.mbi.d);
      const rpLevel = classifyScore(rpScore, SCORING.mbi.rp);
      mbiLevels.ae[aeLevel]++;
      mbiLevels.d[dLevel]++;
      mbiLevels.rp[rpLevel]++;
      // Global risk
      if (aeLevel === 'Alto' && dLevel === 'Alto' && rpLevel === 'Alto') mbiGlobalRisk.Alto++;
      else if (aeLevel === 'Alto' || dLevel === 'Alto') mbiGlobalRisk.Moderado++;
      else mbiGlobalRisk.Bajo++;
    } else {
      // Use level_text or total from older records
      const txt = ev.resultados?.level?.text || '';
      if (txt.includes('Alto')) mbiGlobalRisk.Alto++;
      else if (txt.includes('moderado') || txt.includes('Moderado')) mbiGlobalRisk.Moderado++;
      else mbiGlobalRisk.Bajo++;
    }
  });

  // ProQOL risk levels recalculated
  const proqolLevels = { cs: {Bajo:0, Medio:0, Alto:0}, bo: {Bajo:0, Medio:0, Alto:0}, sts: {Bajo:0, Medio:0, Alto:0} };
  const proqolGlobalRisk = { Bajo: 0, Moderado: 0, Alto: 0 };
  compassionEvals.forEach(ev => {
    const sub = ev.resultados?.subscales;
    if (sub) {
      const csScore = sub.cs?.score ?? 0;
      const boScore = sub.bo?.score ?? 0;
      const stsScore = sub.sts?.score ?? 0;
      const csLevel = classifyScore(csScore, SCORING.proqol.cs);
      const boLevel = classifyScore(boScore, SCORING.proqol.bo);
      const stsLevel = classifyScore(stsScore, SCORING.proqol.sts);
      proqolLevels.cs[csLevel]++;
      proqolLevels.bo[boLevel]++;
      proqolLevels.sts[stsLevel]++;
      if (boLevel === 'Alto' || stsLevel === 'Alto') proqolGlobalRisk.Alto++;
      else if (csLevel === 'Bajo') proqolGlobalRisk.Moderado++;
      else proqolGlobalRisk.Bajo++;
    } else {
      const txt = ev.resultados?.level?.text || '';
      if (txt.includes('Alto')) proqolGlobalRisk.Alto++;
      else if (txt.includes('Baja')) proqolGlobalRisk.Moderado++;
      else proqolGlobalRisk.Bajo++;
    }
  });

  // Timeline (evaluations per month)
  const timeline = {};
  data.forEach(d => {
    const dateStr = d.fecha || d.timestamp?.toDate?.()?.toISOString?.() || '';
    if (dateStr) {
      const month = dateStr.substring(0, 7); // YYYY-MM
      timeline[month] = (timeline[month] || 0) + 1;
    }
  });
  const sortedMonths = Object.keys(timeline).sort();

  // Chart colors
  const palette = [
    'rgba(33,128,141,0.75)', 'rgba(255,84,89,0.75)', 'rgba(230,129,97,0.75)',
    'rgba(98,108,113,0.75)', 'rgba(147,51,234,0.75)', 'rgba(34,197,94,0.75)',
    'rgba(245,158,11,0.75)', 'rgba(236,72,153,0.75)'
  ];
  const riskColors = { Bajo: 'rgba(33,128,141,0.75)', Medio: 'rgba(245,158,11,0.75)', Moderado: 'rgba(245,158,11,0.75)', Alto: 'rgba(255,84,89,0.75)' };

  // Destroy existing charts
  Object.values(dashboardCharts).forEach(c => c?.destroy?.());

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: { legend: { position: 'bottom', labels: { padding: 12, usePointStyle: true, font: { size: 11 } } } }
  };

  // 1. Profession chart (doughnut)
  dashboardCharts.profesion = new Chart(document.getElementById('chart-profesion'), {
    type: 'doughnut',
    data: {
      labels: Object.keys(profCounts),
      datasets: [{ data: Object.values(profCounts), backgroundColor: palette.slice(0, Object.keys(profCounts).length), borderWidth: 1 }]
    },
    options: { ...chartOptions, cutout: '55%' }
  });

  // 2. Ámbito chart (bar)
  dashboardCharts.ambito = new Chart(document.getElementById('chart-ambito'), {
    type: 'bar',
    data: {
      labels: Object.keys(ambitoCounts),
      datasets: [{ label: 'Evaluaciones', data: Object.values(ambitoCounts), backgroundColor: palette.slice(0, Object.keys(ambitoCounts).length), borderWidth: 0, borderRadius: 6 }]
    },
    options: { ...chartOptions, plugins: { ...chartOptions.plugins, legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
  });

  // 3. MBI risk chart (bar)
  dashboardCharts.mbiRisk = new Chart(document.getElementById('chart-mbi-risk'), {
    type: 'bar',
    data: {
      labels: ['Bajo', 'Moderado', 'Alto'],
      datasets: [{ label: 'Evaluaciones', data: [mbiGlobalRisk.Bajo, mbiGlobalRisk.Moderado, mbiGlobalRisk.Alto], backgroundColor: [riskColors.Bajo, riskColors.Moderado, riskColors.Alto], borderWidth: 0, borderRadius: 6 }]
    },
    options: { ...chartOptions, plugins: { ...chartOptions.plugins, legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
  });

  // 4. ProQOL risk chart (bar)
  dashboardCharts.proqolRisk = new Chart(document.getElementById('chart-proqol-risk'), {
    type: 'bar',
    data: {
      labels: ['Favorable', 'Moderado', 'Riesgo Alto'],
      datasets: [{ label: 'Evaluaciones', data: [proqolGlobalRisk.Bajo, proqolGlobalRisk.Moderado, proqolGlobalRisk.Alto], backgroundColor: [riskColors.Bajo, riskColors.Moderado, riskColors.Alto], borderWidth: 0, borderRadius: 6 }]
    },
    options: { ...chartOptions, plugins: { ...chartOptions.plugins, legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
  });

  // 5. Timeline chart (line)
  dashboardCharts.timeline = new Chart(document.getElementById('chart-timeline'), {
    type: 'line',
    data: {
      labels: sortedMonths.map(m => {
        const [y, mo] = m.split('-');
        const monthNames = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
        return `${monthNames[parseInt(mo)-1]} ${y.substring(2)}`;
      }),
      datasets: [{ label: 'Evaluaciones', data: sortedMonths.map(m => timeline[m]), borderColor: 'rgba(33,128,141,1)', backgroundColor: 'rgba(33,128,141,0.1)', fill: true, tension: 0.3, pointRadius: 4 }]
    },
    options: { ...chartOptions, plugins: { ...chartOptions.plugins, legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
  });

  // 6. Country chart (doughnut)
  const countryKeys = Object.keys(countries);
  dashboardCharts.pais = new Chart(document.getElementById('chart-pais'), {
    type: 'doughnut',
    data: {
      labels: countryKeys.length > 0 ? countryKeys : ['Sin datos'],
      datasets: [{ data: countryKeys.length > 0 ? Object.values(countries) : [1], backgroundColor: countryKeys.length > 0 ? palette.slice(0, countryKeys.length) : ['#ccc'], borderWidth: 1 }]
    },
    options: { ...chartOptions, cutout: '55%' }
  });

  // Detail tables
  const mkBadge = (n, cls) => `<span class="risk-badge ${cls}">${n}</span>`;
  const mbiTbody = document.getElementById('mbi-detail-table');
  if (mbiTbody && burnoutEvals.length > 0) {
    mbiTbody.innerHTML = `
      <tr><td>Agotamiento Emocional</td><td>${mkBadge(mbiLevels.ae.Bajo,'bajo')}</td><td>${mkBadge(mbiLevels.ae.Medio,'medio')}</td><td>${mkBadge(mbiLevels.ae.Alto,'alto')}</td></tr>
      <tr><td>Despersonalización</td><td>${mkBadge(mbiLevels.d.Bajo,'bajo')}</td><td>${mkBadge(mbiLevels.d.Medio,'medio')}</td><td>${mkBadge(mbiLevels.d.Alto,'alto')}</td></tr>
      <tr><td>Realización Personal</td><td>${mkBadge(mbiLevels.rp.Bajo,'bajo')}</td><td>${mkBadge(mbiLevels.rp.Medio,'medio')}</td><td>${mkBadge(mbiLevels.rp.Alto,'alto')}</td></tr>
    `;
  }

  const proqolTbody = document.getElementById('proqol-detail-table');
  if (proqolTbody && compassionEvals.length > 0) {
    proqolTbody.innerHTML = `
      <tr><td>Satisfacción por Compasión</td><td>${mkBadge(proqolLevels.cs.Bajo,'bajo')}</td><td>${mkBadge(proqolLevels.cs.Medio,'medio')}</td><td>${mkBadge(proqolLevels.cs.Alto,'alto')}</td></tr>
      <tr><td>Burnout</td><td>${mkBadge(proqolLevels.bo.Bajo,'bajo')}</td><td>${mkBadge(proqolLevels.bo.Medio,'medio')}</td><td>${mkBadge(proqolLevels.bo.Alto,'alto')}</td></tr>
      <tr><td>Estrés Traumático Secundario</td><td>${mkBadge(proqolLevels.sts.Bajo,'bajo')}</td><td>${mkBadge(proqolLevels.sts.Medio,'medio')}</td><td>${mkBadge(proqolLevels.sts.Alto,'alto')}</td></tr>
    `;
  }

  // Timestamp
  document.getElementById('dashboard-timestamp').textContent = new Date().toLocaleString('es-ES');
  dashboardLoaded = true;
}
