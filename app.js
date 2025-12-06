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

  // Update nav active state (mobile friendly)
  // ... (omitted purely visual logic if simpler)
}

function startEvaluation(type) {
  evaluacionActual = type;
  currentStep = 'demographics';
  currentQuestionIndex = 0;
  answers = [];

  // Reset form
  document.getElementById('demographics-form').reset();

  // Update modal content
  document.getElementById('evalTitle').textContent = evaluations[type].title;

  // Show demographics step
  document.getElementById('step-demographics').style.display = 'block';
  document.getElementById('step-questionnaire').style.display = 'none';

  // Open modal
  const modal = document.getElementById('evalModal');
  modal.classList.add('active');
  modal.style.display = 'flex';
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
  let puntuacion = 0;
  let interpretacion = '';
  let recomendaciones = [];

  const datos = demographicData;
  const profesion = datos.profession;
  const edad = datos.age;
  const experiencia = datos.experience;

  // Cálculo específico según tipo
  if (evaluacionActual === 'burnout') {
    // MBI Scoring (Maslach Burnout Inventory) logic simplified for demo
    // Subscales: Emotional Exhaustion (AE), Depersonalization (D), Personal Accomplishment (RP)
    // Items indices (0-based) for each subscale
    const aeItems = [0, 1, 2, 5, 7, 12, 13, 15, 19];
    const dItems = [4, 9, 10, 14, 21];
    const rpItems = [3, 6, 8, 11, 16, 17, 18, 20]; // These are usually reversed or scored differently

    let scoreAE = 0, scoreD = 0, scoreRP = 0;

    answers.forEach((val, idx) => {
      if (aeItems.includes(idx)) scoreAE += val;
      if (dItems.includes(idx)) scoreD += val;
      if (rpItems.includes(idx)) scoreRP += val;
    });

    // Normalize roughly to 0-100 for global score (simplification)
    puntuacion = Math.round(((scoreAE + scoreD + (48 - scoreRP)) / 132) * 100);

    if (puntuacion < 33) {
      interpretacion = 'Nivel bajo de Burnout. Mantienes un buen equilibrio.';
      recomendaciones = ['Continúa con tus prácticas de autocuidado', 'Comparte tus estrategias con el equipo'];
    } else if (puntuacion < 66) {
      interpretacion = 'Nivel medio de Burnout. Atención a señales de alerta.';
      recomendaciones = ['Revisa tu carga laboral', 'Prioriza descansos', 'Practica mindfulness'];
    } else {
      interpretacion = 'Nivel alto de Burnout en riesgo. Se recomienda acción.';
      recomendaciones = ['Busca apoyo profesional', 'Habla con supervisores', 'Descanso necesario'];
    }
  } else if (evaluacionActual === 'compassion') {
    // ProQOL Scoring logic
    // CS (Compassion Satisfaction), BO (Burnout), STS (Secondary Traumatic Stress)

    // Simplificación: Suma directa
    puntuacion = Math.round((answers.reduce((a, b) => a + b, 0) / (answers.length * 5)) * 100);

    if (puntuacion < 40) {
      interpretacion = 'Baja fatiga por compasión.';
      recomendaciones = ['Sigue cultivando la satisfacción por compasión'];
    } else if (puntuacion < 70) {
      interpretacion = 'Nivel moderado de fatiga por compasión.';
      recomendaciones = ['Aumenta el autocuidado', 'Supervisión de casos'];
    } else {
      interpretacion = 'Alto riesgo de fatiga por compasión.';
      recomendaciones = ['Evaluación profesional', 'Tiempo fuera', 'Apoyo intensivo'];
    }
  } else {
    // Self-care
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
    level: { text: interpretacion.split('.')[0] }, // Extraer nivel aproximado
    recomendaciones: recomendaciones
  };

  evaluacionManager.guardarEvaluacion(evaluacionActual, datos, resultadosHist);
  hasCompletedEvaluations = true;

  // Preparar objeto para mostrar
  window.resultadoActual = {
    tipo: evaluacionActual,
    titulo: evaluations[evaluacionActual].title,
    puntuacion: puntuacion,
    interpretacion: interpretacion,
    recomendaciones: recomendaciones,
    profesion: profesion,
    edad: edad,
    experiencia: experiencia,
    fecha: new Date().toLocaleDateString('es-ES')
  };

  // Cerrar modal evaluacion
  document.getElementById('evalModal').classList.remove('active');
  document.getElementById('evalModal').style.display = 'none';

  // Mostrar resultados
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
  document.getElementById('resultado-edad').textContent = r.edad || '-';
  document.getElementById('resultado-experiencia').textContent = r.experiencia || '-';
  document.getElementById('resultado-puntuacion').textContent = r.puntuacion;
  document.getElementById('resultado-interpretacion').textContent = r.interpretacion;

  const recList = document.getElementById('resultado-recomendaciones');
  recList.innerHTML = '';
  r.recomendaciones.forEach(rec => {
    const li = document.createElement('li');
    li.textContent = rec;
    recList.appendChild(li);
  });

  document.getElementById('resultado-plan').textContent = "Recuerda: Este resultado es orientativo. Consulta con un profesional.";

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
    questions: [
      '¿Con qué frecuencia está cansado?',
      '¿Con qué frecuencia está físicamente exhausto?',
      '¿Con qué frecuencia está emocionalmente exhausto?',
      '¿Con qué frecuencia piensa: "no puedo más"?',
      '¿Con qué frecuencia se siente agotado?',
      '¿Con qué frecuencia se siente débil y susceptible a enfermar?',
      '¿Encuentra su trabajo emocionalmente agotador?',
      '¿Su trabajo le produce frustración?',
      '¿Se siente agotado al final de la jornada de trabajo?',
      '¿Se siente exhausto por la mañana al pensar en otro día de trabajo por delante?',
      '¿Siente que cada hora de trabajo es agotadora para usted?',
      '¿Tiene energía para la familia y los amigos durante el tiempo libre?',
      '¿Su trabajo es una fuente de estrés personal para usted?',
      '¿Encuentra difícil trabajar con sus pacientes/niños?',
      '¿Trabajar con sus pacientes/niños le produce desgaste?',
      '¿Le frustra trabajar con sus pacientes/niños?',
      '¿Siente que da más de lo que recibe cuando trabaja con sus pacientes/niños?',
      '¿Está cansado de trabajar con sus pacientes/niños?',
      '¿Se pregunta cuánto tiempo más será capaz de trabajar con sus pacientes/niños?'
    ],
    options: [
      { text: 'Nunca', value: 0 },
      { text: 'Sólo alguna vez', value: 25 },
      { text: 'Algunas veces', value: 50 },
      { text: 'Muchas veces', value: 75 },
      { text: 'Siempre', value: 100 }
    ],
    reverseItem: 11
  },
  compassion: {
    name: 'Fatiga por Compasión',
    title: 'Evaluación de Fatiga por Compasión',
    questions: [
      'Me gusta mi trabajo como profesional de ayuda',
      'Siento que puedo marcar la diferencia a través de mi trabajo',
      'Estoy orgulloso de lo que puedo hacer para ayudar',
      'Tengo pensamientos reconfortantes sobre las personas a las que he ayudado',
      'Creo que puedo hacer mucho bien a las personas a las que ayudo',
      'Me siento sobrecargado porque mi carga de casos parece interminable',
      'Siento que estoy fracasando en mi trabajo como profesional de ayuda',
      'Siento que mi trabajo me está desgastando',
      'Me siento "estancado" por el sistema',
      'Me siento desconectado de los demás',
      'Tengo pensamientos intrusivos sobre algunas de las personas a las que he ayudado',
      'Tengo dificultades para conciliar el sueño',
      'Siento que puedo "contagiarme" del trauma de aquellos a quienes ayudo',
      'Me siento vulnerable a causa de mi trabajo como profesional de ayuda',
      'Como resultado de mi trabajo he tenido saltos de una emoción extrema a otra'
    ],
    options: [
      { text: 'Nunca', value: 1 },
      { text: 'Raramente', value: 2 },
      { text: 'A veces', value: 3 },
      { text: 'A menudo', value: 4 },
      { text: 'Muy a menudo', value: 5 }
    ]
  },
  selfcare: {
    name: 'Autocuidado',
    title: 'Evaluación de Autocuidado',
    questions: [
      'Duermo lo suficiente (7-8 horas) regularmente',
      'Hago ejercicio físico al menos 3 veces por semana',
      'Mantengo una dieta equilibrada y saludable',
      'Tengo tiempo libre para hobbies y ocio',
      'Mantengo contacto social fuera del trabajo',
      'Practico técnicas de relajación o desconexión',
      'Puedo poner límites claros en mi trabajo',
      'Pido ayuda cuando me siento sobrepasado',
      'Tengo espacios para expresar mis emociones',
      'Me siento valorado en mi entorno laboral'
    ],
    options: [
      { text: 'Casi nunca', value: 1 },
      { text: 'A veces', value: 2 },
      { text: 'Frecuentemente', value: 3 },
      { text: 'Casi siempre', value: 4 }
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
function generatePersonalPlan() {
  alert("Generando plan personalizado (Simulado)...");
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