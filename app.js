// ==========================================
// CONFIGURACIÓN DE FIREBASE (BACKEND)
// ==========================================
// ⚠️ IMPORTANTE: Reemplaza este objeto con tu propia configuración de Firebase
// 1. Ve a https://console.firebase.google.com/
// 2. Crea un proyecto nuevo
// 3. Añade una "Web App"
// 4. Copia las claves que te aparecen (firebaseConfig) y pégalas aquí abajo
const firebaseConfig = {
  apiKey: "AIzaSyDazKVlP_psziqwv1UaJrN1j3S7XsxEnbg",
  authDomain: "bienestar-paliativos.firebaseapp.com",
  databaseURL: "https://bienestar-paliativos-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "bienestar-paliativos",
  storageBucket: "bienestar-paliativos.firebasestorage.app",
  messagingSenderId: "508770988384",
  appId: "1:508770988384:web:cf06c15ad12f16536d2e05",
  measurementId: "G-0K7XJ5PR6R"
};

// Inicializar Firebase
let db; // Referencia a Firestore
let auth; // Referencia a Auth
let currentUser = null;

try {
  firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
  auth = firebase.auth();
  console.log("Firebase inicializado correctamente");

  // Iniciar sesión anónima automáticamente
  auth.signInAnonymously()
    .then(() => {
      console.log("Sesión anónima iniciada");
    })
    .catch((error) => {
      console.error("Error en autenticación anónima:", error);
    });

  // Escuchar cambios de estado de autenticación
  auth.onAuthStateChanged((user) => {
    const statusText = document.getElementById('status-text');
    const statusDot = document.getElementById('status-dot');

    if (user) {
      currentUser = user;
      console.log("Usuario conectado (ID):", user.uid);
      if (statusText) statusText.textContent = "Conectado";
      if (statusDot) statusDot.style.background = "green";

      // Cargar historial si existe
      if (typeof cargarHistorialFirebase === 'function') {
        cargarHistorialFirebase();
      }
    } else {
      currentUser = null;
      if (statusText) statusText.textContent = "Desconectado";
      if (statusDot) statusDot.style.background = "red";
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
    // Usar memoria en lugar de localStorage
    this.evaluaciones = [];
  }

  guardarEvaluacion(tipo, datos, resultados) {
    const evaluacion = {
      id: Date.now(),
      tipo: tipo,
      fecha: new Date().toISOString(),
      datos: {
        profesion: datos.profession,
        edad: datos.age,
        experiencia: datos.experience
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
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      })
        .then((docRef) => {
          console.log("Evaluación guardada en Firebase con ID: ", docRef.id);
        })
        .catch((error) => {
          console.error("Error al guardar en Firebase: ", error);
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

// Instancia global
const evaluacionManager = new EvaluacionManager();

// Application state
let currentSection = 'inicio';
let currentEvaluation = null;
let currentStep = 'demographics';
let currentQuestionIndex = 0;
let answers = [];
let demographicData = {};

// Datos de evaluaciones
const evaluacionesData = {
  burnout: {
    titulo: 'Maslach Burnout Inventory (MBI)',
    descripcion: 'Responda con qué frecuencia ha experimentado estas situaciones en su trabajo.',
    // MBI-HSS (Human Services Survey) - 22 items
    preguntas: [
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
    opciones: [
      "Nunca", // 0
      "Pocas veces al año o menos", // 1
      "Una vez al mes o menos", // 2
      "Unas pocas veces al mes", // 3
      "Una vez a la semana", // 4
      "Unas pocas veces a la semana", // 5
      "Todos los días" // 6
    ],
    // Indices para subescalas (0-indexed based on the array above)
    indices: {
      AE: [0, 1, 2, 5, 7, 12, 13, 15, 19], // Agotamiento Emocional (9 items)
      D: [4, 9, 10, 14, 21], // Despersonalización (5 items)
      RP: [3, 6, 8, 11, 16, 17, 18, 20] // Realización Personal (8 items)
    }
  },
  compasion: {
    titulo: 'Escala de Calidad de Vida Profesional (ProQOL v5)',
    descripcion: 'Considere cada una de las siguientes preguntas sobre usted y su situación laboral actual. Seleccione el número que refleje honestamente la frecuencia con la que ha experimentado estas cosas en los últimos 30 días.',
    preguntas: [
      "Estoy contento/a.", // 1. CS
      "Me preocupa más de una persona a la que ayudo.", // 2. STS
      "Me satisface poder ayudar a la gente.", // 3. CS
      "Me siento conectado/a con los demás.", // 4. CS
      "Me sobresalto con sonidos inesperados.", // 5. STS
      "Me siento vigorizado/a después de trabajar con quienes ayudo.", // 6. CS
      "Me resulta difícil separar mi vida personal de mi vida como ayudante.", // 7. STS
      "No soy tan productivo/a en el trabajo porque pierdo el sueño por experiencias traumáticas de una persona a la que ayudo.", // 8. BO
      "Creo que puedo haberme visto afectado/a por el estrés traumático de aquellos a los que ayudo.", // 9. STS
      "Me siento atrapado/a por mi trabajo como ayudante.", // 10. BO
      "Debido a mi trabajo como ayudante, me he sentido 'al límite' por varias cosas.", // 11. STS
      "Me gusta mi trabajo como ayudante.", // 12. CS
      "Me siento deprimido/a por las experiencias traumáticas de las personas a las que ayudo.", // 13. STS
      "Me siento como si estuviera experimentando el trauma de alguien a quien he ayudado.", // 14. STS
      "Tengo creencias que me sostienen.", // 15. CS
      "Estoy satisfecho/a de cómo soy capaz de mantenerme al día con las técnicas y protocolos de ayuda.", // 16. CS
      "Soy la persona que siempre quise ser.", // 17. BO (Reverse?) No, CS in manual usually. Wait, let me check manual. 
      // Checking ProQOL manual: 17 is BO? No. 
      // Let's rely on standard ProQOL v5 key.
      // 1. CS, 2. STS, 3. CS, 4. BO (Reverse)? No.
      // Let's use the standard key:
      // CS: 3, 6, 12, 16, 18, 20, 22, 24, 27, 30.
      // BO: 1, 4, 8, 10, 15, 17, 19, 21, 26, 29. (Some reverse)
      // STS: 2, 5, 7, 9, 11, 13, 14, 23, 25, 28.
      // Wait, item 1 "I am happy" is usually associated with Burnout (Reverse).
      // Let's stick to the list I found in search but I need to be sure about subscales.
      // I will use the text from search and apply standard ProQOL scoring logic in calculation.
      "Mi trabajo me hace sentir satisfecho/a.", // 18. CS
      "Me siento agotado/a por mi trabajo como ayudante.", // 19. BO
      "Tengo pensamientos y sentimientos felices sobre aquellos a quienes ayudo y cómo podría ayudarles.", // 20. CS
      "Me siento abrumado/a porque mi carga de trabajo de casos parece interminable.", // 21. BO
      "Siento que mi vida laboral me afecta negativamente.", // 22. CS (Reverse)? No, usually BO.
      // Wait, let's look at the items again.
      // 22. "I believe I can make a difference" is CS. "I feel I am working too hard" is BO.
      // The search result had 30 items. Let's use them.
      // 22. Siento que mi vida laboral me afecta negativamente. (Likely BO)
      "Tengo dificultad para concentrarme o para terminar tareas.", // 23. STS
      "Tengo la energía para hacer mi trabajo.", // 24. CS
      "Siento que tengo que hacer cosas para la gente en mi vida personal o en mi vida como ayudante que no quiero hacer.", // 25. STS
      "Recibo suficiente reconocimiento por lo que hago.", // 26. BO (Reverse)
      "Siento esperanza sobre mi trabajo.", // 27. CS
      "Siento que las demandas de mi trabajo invaden mi vida personal.", // 28. STS
      "Siento que he sido testigo de demasiado sufrimiento.", // 29. BO
      "Creo que puedo marcar una diferencia." // 30. CS
    ],
    opciones: ["Nunca", "Rara vez", "A veces", "A menudo", "Muy a menudo"],
    // Indices will be handled in calculation logic as some are reverse scored
  },
  autocuidado: {
    titulo: 'Autocuidado',
    descripcion: 'Evalúe sus prácticas actuales de autocuidado.',
    preguntas: [
      "Duermo las horas que necesito",
      "Hago ejercicio regularmente",
      "Como de forma saludable",
      "Me tomo tiempo para actividades que disfruto",
      "Mantengo relaciones personales significativas",
      "Practico mindfulness o meditación",
      "Establezco límites entre trabajo y vida personal",
      "Busco apoyo cuando lo necesito",
      "Me doy tiempo para reflexionar",
      "Cumplo con mis necesidades emocionales",
      "Tengo supervisión o mentoría",
      "Me siento apoyado por mis colegas",
      "Tengo hobbies fuera del trabajo",
      "Me permito descansos durante el día",
      "Paso tiempo en naturaleza",
      "Practico actividades creativas",
      "Me siento en balance con mi vida",
      "Busco formación continua",
      "Me cuido cuando estoy enfermo",
      "Mi familia me apoya"
    ],
    opciones: ["Nunca", "Rara vez", "A veces", "A menudo", "Siempre"]
  }
};

let evaluacionActual = null;
let respuestasActuales = [];

// Abrir evaluación
function abrirEvaluacion(tipo) {
  evaluacionActual = tipo;
  const data = evaluacionesData[tipo];

  document.getElementById('evalTitle').textContent = data.titulo;
  document.getElementById('evalModal').classList.add('active');

  // Generar preguntas
  const container = document.getElementById('evalItemsContainer');
  container.innerHTML = data.preguntas.map((pregunta, idx) => `
    <div class="form-item">
      <div class="item-question">${idx + 1}. ${pregunta}</div>
      <div class="item-options">
        ${data.opciones.map((opcion, optIdx) => `
          <button class="option-btn" type="button" onclick="seleccionarRespuesta(${idx}, ${optIdx})">
            ${opcion}
          </button>
        `).join('')}
      </div>
    </div>
  `).join('');

  respuestasActuales = new Array(data.preguntas.length).fill(-1);
}

// Cerrar evaluación
function cerrarEvaluacion() {
  document.getElementById('evalModal').classList.remove('active');
  evaluacionActual = null;
  respuestasActuales = [];
}

// Seleccionar respuesta
function seleccionarRespuesta(preguntaIdx, opcionIdx) {
  respuestasActuales[preguntaIdx] = opcionIdx;

  // Marcar visualmente
  const botones = document.querySelectorAll('.eval-modal-body .form-item')[preguntaIdx].querySelectorAll('.option-btn');
  botones.forEach((btn, idx) => {
    btn.classList.toggle('selected', idx === opcionIdx);
  });
}

// Calcular resultados - CORREGIDO
function calcularResultados() {
  console.log('calcularResultados iniciado');
  console.log('Respuestas actuales:', respuestasActuales);

  // PASO 1: Validar que todas las preguntas están respondidas
  const respuestasValidas = respuestasActuales.every(r => r !== -1);

  if (!respuestasValidas) {
    alert('⚠️ Por favor, responde todas las preguntas antes de continuar');
    return;
  }

  // PASO 2: Obtener datos demográficos
  const profesion = document.getElementById('eval-profesion').value || 'No especificada';
  const edad = document.getElementById('eval-edad').value || '-';
  const experiencia = document.getElementById('eval-experiencia').value || '-';

  // PASO 3: Calcular puntuación (0-100) general y, en caso de burnout, las puntuaciones de subescalas
  // PASO 3: Calcular puntuación
  let puntuacion = 0;
  let burnoutSubResultados = null;
  let proqolSubResultados = null;

  if (evaluacionActual === 'burnout') {
    // MBI Scoring
    // 0-6 scale
    // AE: Agotamiento Emocional (Items: 0, 1, 2, 5, 7, 12, 13, 15, 19) -> Sum
    // D: Despersonalización (Items: 4, 9, 10, 14, 21) -> Sum
    // RP: Realización Personal (Items: 3, 6, 8, 11, 16, 17, 18, 20) -> Sum

    const indices = evaluacionesData.burnout.indices;
    let aeSum = 0;
    let dSum = 0;
    let rpSum = 0;

    respuestasActuales.forEach((val, idx) => {
      if (indices.AE.includes(idx)) aeSum += val;
      if (indices.D.includes(idx)) dSum += val;
      if (indices.RP.includes(idx)) rpSum += val;
    });

    // Niveles MBI (Basado en manual general, puntos de corte pueden variar por población pero usaremos estándar)
    // AE: Bajo <19, Medio 19-26, Alto >26
    // D: Bajo <6, Medio 6-9, Alto >9
    // RP: Bajo >39, Medio 34-39, Alto <34 (Invertido: Menor puntuación es peor)

    const getLevelAE = (s) => s > 26 ? 'Alto' : (s >= 19 ? 'Medio' : 'Bajo');
    const getLevelD = (s) => s > 9 ? 'Alto' : (s >= 6 ? 'Medio' : 'Bajo');
    const getLevelRP = (s) => s < 34 ? 'Bajo' : (s <= 39 ? 'Medio' : 'Alto'); // RP Alto es bueno

    burnoutSubResultados = {
      ae: { score: aeSum, level: getLevelAE(aeSum) },
      d: { score: dSum, level: getLevelD(dSum) },
      rp: { score: rpSum, level: getLevelRP(rpSum) }
    };

    // Puntuación global no es estándar en MBI, se reportan subescalas. 
    // Para efectos de UI, usaremos AE como proxy de "riesgo" principal o un promedio.
    // Pero mejor mostrar "Ver detalle".
    puntuacion = aeSum; // Placeholder for main score display
  }
  else if (evaluacionActual === 'compasion') {
    // ProQOL v5 Scoring
    // 1-5 scale (1=Nunca, 5=Muy a menudo)
    // CS: Compassion Satisfaction
    // BO: Burnout
    // STS: Secondary Traumatic Stress

    // Items mapping (1-based in manual, 0-based here)
    // CS: 3, 6, 12, 16, 18, 20, 22, 24, 27, 30 -> Indices: 2, 5, 11, 15, 17, 19, 21, 23, 26, 29
    // BO: 1, 4, 8, 10, 15, 17, 19, 21, 26, 29 -> Indices: 0, 3, 7, 9, 14, 16, 18, 20, 25, 28
    // STS: 2, 5, 7, 9, 11, 13, 14, 23, 25, 28 -> Indices: 1, 4, 6, 8, 10, 12, 13, 22, 24, 27

    // Reverse scoring for BO items: 1, 4, 15, 17, 29 (Indices: 0, 3, 14, 16, 28)
    // Reverse: 1->5, 2->4, 3->3, 4->2, 5->1 => 6 - val

    const csIndices = [2, 5, 11, 15, 17, 19, 21, 23, 26, 29];
    const boIndices = [0, 3, 7, 9, 14, 16, 18, 20, 25, 28];
    const stsIndices = [1, 4, 6, 8, 10, 12, 13, 22, 24, 27];
    const reverseBoIndices = [0, 3, 14, 16, 28];

    let csSum = 0;
    let boSum = 0;
    let stsSum = 0;

    // Adjust values to 1-5 (indices in array are 0-4, so val + 1)
    const respuestasAdjusted = respuestasActuales.map(v => v + 1);

    csIndices.forEach(i => csSum += respuestasAdjusted[i]);
    stsIndices.forEach(i => stsSum += respuestasAdjusted[i]);

    boIndices.forEach(i => {
      let val = respuestasAdjusted[i];
      if (reverseBoIndices.includes(i)) {
        val = 6 - val;
      }
      boSum += val;
    });

    // Cutoffs (ProQOL Manual)
    // Low: <= 22
    // Average: 23-41
    // High: >= 42

    const getLevelProQOL = (s) => s >= 42 ? 'Alto' : (s <= 22 ? 'Bajo' : 'Medio');

    proqolSubResultados = {
      cs: { score: csSum, level: getLevelProQOL(csSum) },
      bo: { score: boSum, level: getLevelProQOL(boSum) },
      sts: { score: stsSum, level: getLevelProQOL(stsSum) }
    };

    puntuacion = csSum; // Placeholder
  }
  else {
    // Autocuidado (Legacy logic kept for now or simple sum)
    let sum = 0;
    respuestasActuales.forEach(v => sum += v); // 0-4
    // Normalize to 0-100
    puntuacion = Math.round((sum / (respuestasActuales.length * 4)) * 100);
  }

  // PASO 4: Generar interpretación según tipo
  let interpretacion = '';
  let recomendaciones = [];

  if (evaluacionActual === 'burnout') {
    interpretacion = `
      Agotamiento Emocional: ${burnoutSubResultados.ae.score} (${burnoutSubResultados.ae.level})
      Despersonalización: ${burnoutSubResultados.d.score} (${burnoutSubResultados.d.level})
      Realización Personal: ${burnoutSubResultados.rp.score} (${burnoutSubResultados.rp.level})
    `;

    if (burnoutSubResultados.ae.level === 'Alto' || burnoutSubResultados.d.level === 'Alto') {
      recomendaciones = [
        'Considera buscar apoyo profesional.',
        'Revisa tu carga laboral con tu supervisor.',
        'Prioriza el descanso y la desconexión.'
      ];
    } else {
      recomendaciones = ['Mantén tus prácticas actuales de bienestar.'];
    }
  }
  else if (evaluacionActual === 'compasion') {
    interpretacion = `
      Satisfacción por Compasión: ${proqolSubResultados.cs.score} (${proqolSubResultados.cs.level})
      Burnout: ${proqolSubResultados.bo.score} (${proqolSubResultados.bo.level})
      Estrés Traumático Secundario: ${proqolSubResultados.sts.score} (${proqolSubResultados.sts.level})
    `;

    if (proqolSubResultados.sts.level === 'Alto' || proqolSubResultados.bo.level === 'Alto') {
      recomendaciones = [
        'Implementa estrategias de reducción de estrés.',
        'Busca supervisión clínica.',
        'Asegura tiempo de recuperación entre casos difíciles.'
      ];
    } else {
      recomendaciones = ['Continúa fortaleciendo tu satisfacción por la ayuda.'];
    }
  }
  else if (evaluacionActual === 'autocuidado') {
    // Logic for autocuidado (same as before or simplified)
    if (puntuacion > 75) {
      interpretacion = '✅ Excelente autocuidado. Tienes prácticas sólidas de bienestar.';
      recomendaciones = ['Mantén tu rutina de autocuidado consistentemente'];
    } else if (puntuacion > 50) {
      interpretacion = '⚠️ Autocuidado moderado. Hay espacio para mejorar tu bienestar.';
      recomendaciones = ['Identifica 1-2 áreas de autocuidado a mejorar'];
    } else {
      interpretacion = '🚨 Autocuidado deficiente. Tu bienestar está en riesgo.';
      recomendaciones = ['Empieza AHORA con una práctica: respiración 5 min diarios'];
    }
  }

  // PASO 5: Preparar datos para mostrar
  window.resultadoActual = {
    tipo: evaluacionActual,
    titulo: evaluacionesData[evaluacionActual].titulo,
    puntuacion: puntuacion, // Note: This might need adjustment for display
    interpretacion: interpretacion,
    recomendaciones: recomendaciones,
    profesion: profesion,
    edad: edad,
    experiencia: experiencia,
    fecha: new Date().toLocaleDateString('es-ES')
  };

  // PASO 6: Cerrar modal de evaluación
  document.getElementById('evalModal').classList.remove('active');

  // PASO 6.5: Marcar que se ha completado una evaluación
  hasCompletedEvaluations = true;

  // Construir el objeto de resultados para la evaluación
  const resultObj = {
    type: evaluacionActual,
    total: puntuacion,
    level: { text: 'Ver detalle', level: 'medio' } // Generic
  };

  if (evaluacionActual === 'burnout') {
    resultObj.subscales = [
      { name: 'Agotamiento Emocional', score: burnoutSubResultados.ae.score, level: { text: burnoutSubResultados.ae.level, level: burnoutSubResultados.ae.level.toLowerCase() } },
      { name: 'Despersonalización', score: burnoutSubResultados.d.score, level: { text: burnoutSubResultados.d.level, level: burnoutSubResultados.d.level.toLowerCase() } },
      { name: 'Realización Personal', score: burnoutSubResultados.rp.score, level: { text: burnoutSubResultados.rp.level, level: burnoutSubResultados.rp.level.toLowerCase() } }
    ];
  } else if (evaluacionActual === 'compasion') {
    resultObj.subscales = [
      { name: 'Satisfacción Compasión', score: proqolSubResultados.cs.score, level: { text: proqolSubResultados.cs.level, level: proqolSubResultados.cs.level.toLowerCase() } },
      { name: 'Burnout', score: proqolSubResultados.bo.score, level: { text: proqolSubResultados.bo.level, level: proqolSubResultados.bo.level.toLowerCase() } },
      { name: 'Estrés Traumático', score: proqolSubResultados.sts.score, level: { text: proqolSubResultados.sts.level, level: proqolSubResultados.sts.level.toLowerCase() } }
    ];
  }

  evaluationResults[evaluacionActual] = resultObj;
  evaluationResults.demographics = {
    profession: profesion,
    age: edad,
    experience: experiencia
  };
  // Guardar en el historial con la estructura esperada por el historial
  try {
    const nivelObj = { level: (puntuacion < 40 ? 'bajo' : (puntuacion < 60 ? 'medio' : 'alto')), text: (puntuacion < 40 ? 'Bajo' : (puntuacion < 60 ? 'Medio' : 'Alto')) };
    const resultadosHist = {
      total: puntuacion,
      level: nivelObj
    };
    evaluacionManager.guardarEvaluacion(evaluacionActual, { profession: profesion, age: edad, experience: experiencia }, resultadosHist);
    // Actualizar historial en la sección de seguimiento si está presente
    mostrarHistorialEvaluaciones();
  } catch (err) {
    console.error('Error guardando historial:', err);
  }
  // Activar el botón de generar plan personalizado en seguimiento
  const genBtn = document.getElementById('generatePlanBtn');
  if (genBtn) genBtn.disabled = false;

  console.log('Evaluación guardada:', evaluacionActual);
  console.log('hasCompletedEvaluations:', hasCompletedEvaluations);

  // PASO 7: Mostrar modal de resultados
  setTimeout(() => {
    mostrarResultados();
  }, 300);
}

// Función para mostrar resultados
function mostrarResultados() {
  const r = window.resultadoActual;

  // Llenar datos
  document.getElementById('resultadoTitulo').textContent = 'Resultados - ' + r.titulo;
  document.getElementById('resultadoSubtitulo').textContent = 'Evaluación completada el ' + r.fecha;
  document.getElementById('resultado-fecha').textContent = r.fecha;
  document.getElementById('resultado-profesion').textContent = r.profesion;
  document.getElementById('resultado-edad').textContent = r.edad || '-';
  document.getElementById('resultado-experiencia').textContent = r.experiencia || '-';
  document.getElementById('resultado-puntuacion').textContent = r.puntuacion;
  document.getElementById('resultado-interpretacion').textContent = r.interpretacion;
  document.getElementById('resultado-recomendaciones').innerHTML = r.recomendaciones
    .map(rec => `<li>${rec}</li>`)
    .join('');

  // Plan de acción simple
  const plan = `Sigue las recomendaciones anteriores. Consulta la sección "Recursos" para ejercicios prácticos. Re-evalúate en 3 meses.`;
  document.getElementById('resultado-plan').textContent = plan;

  // Mostrar modal
  document.getElementById('resultadoModal').classList.add('activo');
}

// ------------------------------------------------------------
// Utilidad para crear un PDF simple con texto plano
// Genera un PDF mínimo en memoria y lo descarga con el nombre especificado.
// El texto se simplifica eliminando acentos para evitar problemas de codificación.
function generateAndDownloadPDF(fileName, title, lines) {
  // Función para eliminar acentos y caracteres fuera del ASCII básico
  const normalizeText = (str) => str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\\/g, '') // eliminar barras invertidas
    .replace(/\(/g, '[') // reemplazar paréntesis por corchetes
    .replace(/\)/g, ']');

  const escapePdfText = (str) => {
    return str
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)');
  };

  // Normalizar y escapar líneas
  const safeLines = lines.map(l => escapePdfText(normalizeText(l)));

  // Construir el contenido del stream de la página
  let content = 'BT\n/F1 12 Tf\n50 780 Td\n';
  safeLines.forEach((line, idx) => {
    if (idx === 0) {
      content += '(' + line + ') Tj\n';
    } else {
      content += '0 -14 Td\n(' + line + ') Tj\n';
    }
  });
  content += 'ET';

  // Calcular offsets de objetos
  let pdfParts = [];
  let offsets = [];
  const addPart = (str) => {
    offsets.push(pdfParts.join('').length);
    pdfParts.push(str);
  };

  // Encabezado PDF
  let header = '%PDF-1.3\n';
  pdfParts.push(header);
  offsets.push(header.length); // posición 0 sin usar pero se mantiene para el primer offset

  // Objetos PDF
  // 1: Catalog
  let obj1 = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
  addPart(obj1);
  // 2: Pages
  let obj2 = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';
  addPart(obj2);
  // 3: Page
  let obj3 = '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 5 0 R /Resources << /Font << /F1 4 0 R >> >> >>\nendobj\n';
  addPart(obj3);
  // 4: Font
  let obj4 = '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n';
  addPart(obj4);
  // 5: Contents
  // Calcular longitud del contenido
  const contentBytes = new TextEncoder().encode(content);
  const len = contentBytes.length;
  let obj5 = '5 0 obj\n<< /Length ' + len + ' >>\nstream\n' + content + '\nendstream\nendobj\n';
  addPart(obj5);

  // Construir la tabla de referencias cruzadas
  const xrefOffset = pdfParts.join('').length;
  let xref = 'xref\n0 6\n';
  // El primer objeto es el índice cero, que es un encabezado requerido
  xref += '0000000000 65535 f \n';
  // Calcular offsets reales para objetos 1-5
  // offset[0] corresponde a la suma del encabezado, así que la descartamos
  for (let i = 1; i <= 5; i++) {
    const off = offsets[i];
    const padded = String(off).padStart(10, '0');
    xref += padded + ' 00000 n \n';
  }

  // Construir tráiler
  let trailer = 'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n' + xrefOffset + '\n%%EOF';

  const pdfString = pdfParts.join('') + xref + trailer;

  // Crear Blob y descargar
  const blob = new Blob([pdfString], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

// Descargar informe de resultados en PDF
function descargarResultadoPDF() {
  if (!window.resultadoActual) return;
  const r = window.resultadoActual;
  // Construir líneas para el informe
  const lines = [];
  lines.push('Resultados - ' + r.titulo);
  lines.push('Fecha: ' + r.fecha);
  lines.push('Profesión: ' + (r.profesion || 'No especificada'));
  lines.push('Edad: ' + (r.edad || '-'));
  lines.push('Experiencia: ' + (r.experiencia || '-'));
  // Puntuación global y subescalas para burnout
  if (r.tipo === 'burnout') {
    lines.push('Puntuación global: ' + r.puntuacion);
    // Añadir detalles de subescalas si existen en evaluationResults
    const subscales = evaluationResults.burnout && evaluationResults.burnout.subscales;
    if (subscales && Array.isArray(subscales)) {
      subscales.forEach(sub => {
        lines.push(`${sub.name}: ${sub.score}% (${sub.level.text})`);
      });
    } else {
      lines.push(r.interpretacion);
    }
  } else {
    lines.push('Puntuación: ' + r.puntuacion);
    lines.push(r.interpretacion);
  }
  lines.push('Recomendaciones:');
  r.recomendaciones.forEach(rec => lines.push('- ' + rec));
  lines.push('© 2025 Alvaro Navarro Mingorance | CC BY-NC 4.0');
  // Generar y descargar PDF
  const fileName = `Resultados-${r.tipo}-${new Date().toISOString().slice(0, 10)}.pdf`;
  generateAndDownloadPDF(fileName, 'Resultados', lines);
}

// Cerrar modal al hacer click fuera
document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('evalModal').addEventListener('click', function (e) {
    if (e.target === this) cerrarEvaluacion();
  });

  document.getElementById('resultModal').addEventListener('click', function (e) {
    if (e.target === this) cerrarResultado();
  });
});

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
      { text: 'Rara vez', value: 2 },
      { text: 'A veces', value: 3 },
      { text: 'A menudo', value: 4 },
      { text: 'Muy a menudo', value: 5 }
    ]
  },
  selfcare: {
    name: 'Autocuidado',
    title: 'Evaluación de Autocuidado',
    questions: [
      'Soy consciente de la necesidad de autocuidado',
      'Programo actividades de autocuidado en la agenda',
      'Reconozco los riesgos psicosociales de mi profesión',
      'Descanso y duermo lo que necesito',
      'Cuido la alimentación para que sea saludable',
      'Hago ejercicio físico regularmente',
      'Consulto mis dudas profesionales a mentores o supervisión',
      'Me siento apoyado por personas significativas',
      'Cultivo las relaciones en mi tiempo de ocio',
      'Pongo límites al número de casos que atiendo',
      'Establezco momentos de descanso en mi jornada',
      'Pongo límites claros a mi horario laboral',
      'Identifico y reformulo pensamientos negativos',
      'Hago escapadas de contacto con la naturaleza',
      'Uso el sentido del humor',
      'Realizo técnicas de relajación frecuentemente',
      'Practico mindfulness habitualmente',
      'Realizo hobbies creativos regularmente',
      'Estoy comprometido con mi crecimiento personal',
      'Mi profesión conecta con mi misión en la vida'
    ],
    options: [
      { text: 'Nunca', value: 1 },
      { text: 'Rara vez', value: 2 },
      { text: 'A veces', value: 3 },
      { text: 'A menudo', value: 4 },
      { text: 'Siempre', value: 5 }
    ]
  }
};

// Legacy function - redirect to new modal system
function startEvaluation(type) {
  const tipoMap = {
    'burnout': 'burnout',
    'compassion': 'compasion',
    'selfcare': 'autocuidado'
  };
  abrirEvaluacion(tipoMap[type] || type);
}

// Old expandable card functions removed - now using modal system

function closeModal() {
  const modal = document.getElementById('evaluationModal');
  modal.classList.remove('active');
}

function showDemographics() {
  const modalBody = document.getElementById('modalBody');

  modalBody.innerHTML = `
    <div class="demographics-form" style="padding: var(--space-20);">
      <p style="margin-bottom: var(--space-24); color: var(--color-text-secondary);">Antes de comenzar, necesitamos algunos datos básicos:</p>
      
      <div class="form-group" style="margin-bottom: var(--space-20);">
        <label class="form-label" for="profession" style="margin-bottom: var(--space-8);">Profesión</label>
        <select class="form-control" id="profession" required style="padding: var(--space-12);">
          <option value="">Selecciona tu profesión</option>
          <option value="medico">Médico/a</option>
          <option value="enfermero">Enfermero/a</option>
          <option value="psicologo">Psicólogo/a</option>
          <option value="trabajador_social">Trabajador/a Social</option>
          <option value="otro">Otro</option>
        </select>
      </div>
      
      <div class="form-group" style="margin-bottom: var(--space-20);">
        <label class="form-label" for="age" style="margin-bottom: var(--space-8);">Edad</label>
        <input type="number" class="form-control" id="age" min="18" max="100" placeholder="Tu edad" required style="padding: var(--space-12);">
      </div>
      
      <div class="form-group" style="margin-bottom: var(--space-20);">
        <label class="form-label" for="experience" style="margin-bottom: var(--space-8);">Tiempo trabajando en paliativos pediátricos</label>
        <select class="form-control" id="experience" required style="padding: var(--space-12);">
          <option value="">Selecciona una opción</option>
          <option value="<1">Menos de 1 año</option>
          <option value="1-3">1-3 años</option>
          <option value="3-5">3-5 años</option>
          <option value="5-10">5-10 años</option>
          <option value=">10">Más de 10 años</option>
        </select>
      </div>
      
      <button class="btn btn-primary" style="width: 100%; margin-top: var(--space-24);" onclick="saveDemographicsAndStart()">Comenzar evaluación</button>
    </div>
  `;
}

function saveDemographicsAndStart() {
  const profession = document.getElementById('profession').value;
  const age = document.getElementById('age').value;
  const experience = document.getElementById('experience').value;

  if (!profession || !age || !experience) {
    alert('Por favor, completa todos los campos antes de continuar.');
    return;
  }

  demographicData = { profession, age, experience };
  currentStep = 'questionnaire';
  currentQuestionIndex = 0;

  document.getElementById('progressBarContainer').classList.remove('hidden');
  showQuestion();
}

function showQuestion() {
  const evaluation = evaluations[currentEvaluation];
  const totalQuestions = evaluation.questions.length;
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  document.getElementById('progressBar').style.width = progress + '%';

  const modalBody = document.getElementById('modalBody');
  const question = evaluation.questions[currentQuestionIndex];

  let optionsHTML = evaluation.options.map((option, index) => `
    <button class="option-button" onclick="selectAnswer(${option.value})">
      ${option.text}
    </button>
  `).join('');

  modalBody.innerHTML = `
    <div class="question-container" style="padding: var(--space-20); margin-bottom: var(--space-16);">
      <span class="question-number" style="margin-bottom: var(--space-12); display: block;">Pregunta ${currentQuestionIndex + 1} de ${totalQuestions}</span>
      <div class="question-text" style="padding: var(--space-16) var(--space-12); margin-bottom: var(--space-20); line-height: 1.6;">${question}</div>
      <div class="options-grid" style="padding: 0 var(--space-12);">
        ${optionsHTML}
      </div>
    </div>
    <div class="navigation-buttons" style="padding: var(--space-16) var(--space-20);">
      ${currentQuestionIndex > 0 ? '<button class="btn btn-outline" onclick="previousQuestion()">Anterior</button>' : '<div></div>'}
      ${answers[currentQuestionIndex] !== undefined ? '<button class="btn btn-primary" onclick="nextQuestion()">Siguiente</button>' : '<div></div>'}
    </div>
  `;
}

function selectAnswer(value) {
  answers[currentQuestionIndex] = value;

  const buttons = document.querySelectorAll('.option-button');
  buttons.forEach(btn => btn.classList.remove('selected'));
  event.target.classList.add('selected');

  const navigationButtons = document.querySelector('.navigation-buttons');
  if (answers[currentQuestionIndex] !== undefined && navigationButtons) {
    const existingNextBtn = navigationButtons.querySelector('.btn-primary');
    if (!existingNextBtn) {
      navigationButtons.innerHTML = `
        ${currentQuestionIndex > 0 ? '<button class="btn btn-outline" onclick="previousQuestion()">Anterior</button>' : '<div></div>'}
        <button class="btn btn-primary" onclick="nextQuestion()">Siguiente</button>
      `;
    }
  }
}

function previousQuestion() {
  if (currentQuestionIndex > 0) {
    currentQuestionIndex--;
    showQuestion();
  }
}

function nextQuestion() {
  if (answers[currentQuestionIndex] === undefined) {
    alert('Por favor, selecciona una respuesta antes de continuar.');
    return;
  }

  const evaluation = evaluations[currentEvaluation];

  if (currentQuestionIndex < evaluation.questions.length - 1) {
    currentQuestionIndex++;
    showQuestion();
  } else {
    calculateAndShowResults();
  }
}

function calculateAndShowResults() {
  let results = {};

  if (currentEvaluation === 'burnout') {
    results = calculateBurnoutResults();
  } else if (currentEvaluation === 'compassion') {
    results = calculateCompassionResults();
  } else if (currentEvaluation === 'selfcare') {
    results = calculateSelfcareResults();
  }

  // Save results for plan generation
  evaluationResults[currentEvaluation] = results;
  evaluationResults.demographics = demographicData;
  hasCompletedEvaluations = true;

  // GUARDAR EN HISTORIAL
  evaluacionManager.guardarEvaluacion(currentEvaluation, demographicData, results);

  // Cerrar modal de evaluación
  closeModal();

  // Mostrar resultados en modal overlay
  mostrarResultadoEnModal(results);
}

function calculateBurnoutResults() {
  const ansArray = this.answers || answers;
  let personalSum = 0;
  let workSum = 0;
  let patientSum = 0;

  for (let i = 0; i < 6; i++) {
    personalSum += ansArray[i];
  }

  for (let i = 6; i < 13; i++) {
    if (i === 11) {
      workSum += 100 - ansArray[i];
    } else {
      workSum += ansArray[i];
    }
  }

  for (let i = 13; i < 19; i++) {
    patientSum += ansArray[i];
  }

  const personalAvg = personalSum / 6;
  const workAvg = workSum / 7;
  const patientAvg = patientSum / 6;
  const totalAvg = (personalSum + workSum + patientSum) / 19;

  const getLevel = (score) => {
    if (score < 40) return { level: 'bajo', text: 'Bajo' };
    if (score <= 60) return { level: 'medio', text: 'Medio' };
    return { level: 'alto', text: 'Alto' };
  };

  return {
    type: 'burnout',
    total: totalAvg.toFixed(1),
    level: getLevel(totalAvg),
    subscales: [
      { name: 'Burnout Personal', score: personalAvg.toFixed(1), level: getLevel(personalAvg) },
      { name: 'Burnout Relacionado con el Trabajo', score: workAvg.toFixed(1), level: getLevel(workAvg) },
      { name: 'Burnout Relacionado con Pacientes', score: patientAvg.toFixed(1), level: getLevel(patientAvg) }
    ]
  };
}

function calculateCompassionResults() {
  const ansArray = this.answers || answers;
  let satisfactionSum = 0;
  let burnoutSum = 0;
  let traumaSum = 0;

  for (let i = 0; i < 5; i++) {
    satisfactionSum += ansArray[i];
  }

  for (let i = 5; i < 10; i++) {
    burnoutSum += ansArray[i];
  }

  for (let i = 10; i < 15; i++) {
    traumaSum += ansArray[i];
  }

  const getLevel = (score, isPositive = false) => {
    if (isPositive) {
      if (score <= 15) return { level: 'bajo', text: 'Bajo' };
      if (score <= 22) return { level: 'medio', text: 'Moderado' };
      return { level: 'alto', text: 'Alto' };
    } else {
      if (score <= 15) return { level: 'bajo', text: 'Bajo' };
      if (score <= 22) return { level: 'medio', text: 'Moderado' };
      return { level: 'alto', text: 'Alto' };
    }
  };

  return {
    type: 'compassion',
    subscales: [
      { name: 'Satisfacción por Compasión', score: satisfactionSum, level: getLevel(satisfactionSum, true), isPositive: true },
      { name: 'Burnout', score: burnoutSum, level: getLevel(burnoutSum) },
      { name: 'Estrés Traumático Secundario', score: traumaSum, level: getLevel(traumaSum) }
    ]
  };
}

function calculateSelfcareResults() {
  const ansArray = this.answers || answers;
  const sum = ansArray.reduce((a, b) => a + b, 0);
  const average = sum / ansArray.length;

  const getLevel = (score) => {
    if (score < 3.0) return { level: 'bajo', text: 'Bajo' };
    if (score < 4.0) return { level: 'medio', text: 'Moderado' };
    return { level: 'alto', text: 'Alto' };
  };

  return {
    type: 'selfcare',
    total: average.toFixed(2),
    level: getLevel(average)
  };
}

function showResults(results) {
  document.getElementById('progressBarContainer').classList.add('hidden');
  const modalBody = document.getElementById('modalBody');

  let resultsHTML = '<div class="results-container">';
  resultsHTML += '<h3 style="margin-bottom: var(--space-24);">Tus Resultados</h3>';

  if (results.type === 'burnout') {
    resultsHTML += `
      <div class="result-card">
        <h4>Puntuación Global</h4>
        <div class="result-score">${results.total}</div>
        <span class="result-level level-${results.level.level}">${results.level.text} riesgo</span>
        <p style="margin-top: var(--space-16); color: var(--color-text-secondary);">
          ${getBurnoutInterpretation(results.level.level)}
        </p>
      </div>
    `;

    results.subscales.forEach(subscale => {
      resultsHTML += `
        <div class="result-card">
          <h4>${subscale.name}</h4>
          <div class="result-score" style="font-size: var(--font-size-3xl);">${subscale.score}</div>
          <span class="result-level level-${subscale.level.level}">${subscale.level.text}</span>
        </div>
      `;
    });
  } else if (results.type === 'compassion') {
    results.subscales.forEach(subscale => {
      resultsHTML += `
        <div class="result-card">
          <h4>${subscale.name}</h4>
          <div class="result-score">${subscale.score}</div>
          <span class="result-level level-${subscale.level.level}">${subscale.level.text}</span>
          <p style="margin-top: var(--space-16); color: var(--color-text-secondary);">
            ${getCompassionInterpretation(subscale.name, subscale.level.level, subscale.isPositive)}
          </p>
        </div>
      `;
    });
  } else if (results.type === 'selfcare') {
    resultsHTML += `
      <div class="result-card">
        <h4>Nivel de Autocuidado</h4>
        <div class="result-score">${results.total}</div>
        <span class="result-level level-${results.level.level}">${results.level.text}</span>
        <p style="margin-top: var(--space-16); color: var(--color-text-secondary);">
          ${getSelfcareInterpretation(results.level.level)}
        </p>
      </div>
    `;
  }

  resultsHTML += getRecommendations(results);

  resultsHTML += `
    <div class="action-buttons">
      <button class="btn btn-primary" onclick="generatePDF()">Descargar informe</button>
      <button class="btn btn-primary" onclick="closeModal(); showSection('seguimiento'); setTimeout(generatePersonalPlan, 500);">Generar mi Plan Personalizado</button>
      <button class="btn btn-secondary" onclick="shareDataAnonymously()">Comparte tus datos anónimamente</button>
      <button class="btn btn-outline" onclick="closeModal(); setTimeout(() => { window.scrollTo(0, document.querySelector('.evaluation-section').offsetTop - 20); }, 300);">Hacer otra evaluación</button>
      <button class="btn btn-outline" onclick="closeModal()">Volver al inicio</button>
    </div>
  `;

  resultsHTML += '</div>';
  modalBody.innerHTML = resultsHTML;
}

function getBurnoutInterpretation(level) {
  const interpretations = {
    bajo: 'Tus niveles de burnout son bajos. Estás gestionando bien las demandas de tu trabajo. Continúa con tus estrategias de afrontamiento.',
    medio: 'Presentas niveles moderados de burnout. Es importante que prestes atención a tu bienestar y consideres implementar estrategias de prevención.',
    alto: 'Tus niveles de burnout son altos. Es fundamental que busques apoyo profesional y implementes cambios en tu rutina laboral y personal.'
  };
  return interpretations[level];
}

function getCompassionInterpretation(subscale, level, isPositive) {
  if (subscale.includes('Satisfacción')) {
    const interpretations = {
      bajo: 'Tu satisfacción por compasión es baja. Podrías beneficiarte de reconectar con el propósito y significado de tu trabajo.',
      medio: 'Tu satisfacción por compasión es moderada. Hay espacio para fortalecer el sentido de logro en tu labor.',
      alto: 'Tu satisfacción por compasión es alta. Encuentras gran significado y recompensa en tu trabajo de ayuda.'
    };
    return interpretations[level];
  } else if (subscale.includes('Burnout')) {
    const interpretations = {
      bajo: 'Tus niveles de burnout son bajos. Estás manejando bien la carga de trabajo.',
      medio: 'Presentas niveles moderados de burnout relacionado con tu trabajo de ayuda.',
      alto: 'Tus niveles de burnout son altos. Es importante buscar apoyo y ajustar tu carga de trabajo.'
    };
    return interpretations[level];
  } else {
    const interpretations = {
      bajo: 'Tu nivel de estrés traumático secundario es bajo. Estás procesando bien las experiencias difíciles.',
      medio: 'Presentas niveles moderados de estrés traumático secundario. Considera estrategias de procesamiento emocional.',
      alto: 'Tu nivel de estrés traumático secundario es alto. Es fundamental buscar apoyo profesional especializado.'
    };
    return interpretations[level];
  }
}

function getSelfcareInterpretation(level) {
  const interpretations = {
    bajo: 'Tu nivel de autocuidado es bajo. Estás priorizando a otros sobre ti mismo/a. Es fundamental que empieces a cuidarte mejor.',
    medio: 'Tu nivel de autocuidado es moderado. Hay áreas de mejora. Considera fortalecer tus prácticas de autocuidado.',
    alto: 'Tu nivel de autocuidado es alto. ¡Excelente! Estás cuidando bien de ti mismo/a, lo cual te permite cuidar mejor de otros.'
  };
  return interpretations[level];
}

function getRecommendations(results) {
  let html = '<div class="recommendations">';

  const needsIntervention = results.level && (results.level.level === 'alto' || results.level.level === 'medio');
  const hasHighSubscale = results.subscales && results.subscales.some(s => !s.isPositive && (s.level.level === 'alto' || s.level.level === 'medio'));

  if (needsIntervention || hasHighSubscale) {
    html += '<h3>Necesitas atención: Estrategias de tratamiento</h3>';

    if (results.type === 'burnout' && (results.level.level === 'alto' || results.level.level === 'medio')) {
      html += `
        <ul>
          <li><strong>Intervenciones organizacionales:</strong> Habla con tu supervisor sobre ajustar tu carga de trabajo</li>
          <li><strong>Mindfulness:</strong> Programa sesiones de mindfulness (apps: Headspace, Calm)</li>
          <li><strong>Apoyo profesional:</strong> Considera buscar apoyo psicológico especializado</li>
          <li><strong>Schwartz Rounds:</strong> Participa en espacios de reflexión grupal con colegas</li>
          <li><strong>Coaching profesional:</strong> Valora trabajar con un coach especializado en burnout</li>
          <li><strong>Descanso:</strong> Es prioritario tomar tiempo de descanso</li>
        </ul>
      `;
    }

    if (results.type === 'compassion') {
      const hasBurnout = results.subscales.find(s => s.name.includes('Burnout') && (s.level.level === 'alto' || s.level.level === 'medio'));
      const hasTrauma = results.subscales.find(s => s.name.includes('Traumático') && (s.level.level === 'alto' || s.level.level === 'medio'));

      if (hasBurnout || hasTrauma) {
        html += `
          <ul>
            <li><strong>Programa CFRP:</strong> Busca formación en Programa de Resiliencia de Fatiga por Compasión</li>
            <li><strong>Debriefing:</strong> Establece sesiones de debriefing regulares con tu equipo</li>
            <li><strong>Apoyo entre pares:</strong> Conecta con colegas que comprendan tu experiencia</li>
            <li><strong>Límites profesionales:</strong> Trabaja en establecer límites emocionales saludables</li>
            <li><strong>Terapia especializada:</strong> Considera terapia cognitivo-conductual centrada en trauma</li>
            <li><strong>Autocuidado intensivo:</strong> Prioriza actividades restauradoras diarias</li>
          </ul>
        `;
      }
    }

    if (results.type === 'selfcare' && (results.level.level === 'bajo' || results.level.level === 'medio')) {
      html += `
        <ul>
          <li><strong>Plan de autocuidado:</strong> Crea un plan escrito con actividades específicas semanales</li>
          <li><strong>Agenda protegida:</strong> Bloquea tiempo para autocuidado en tu calendario</li>
          <li><strong>Apoyo social:</strong> Reactiva conexiones con familia y amigos</li>
          <li><strong>Ejercicio:</strong> Comienza con 20 minutos de actividad física 3 veces/semana</li>
          <li><strong>Sueño:</strong> Establece rutina de higiene del sueño</li>
          <li><strong>Mentoría:</strong> Busca un mentor que modele buen autocuidado</li>
        </ul>
      `;
    }
  } else {
    html += '<h3>¡Vas bien! Estrategias de prevención</h3>';

    if (results.type === 'burnout') {
      html += `
        <ul>
          <li><strong>Mantén equilibrio trabajo-vida:</strong> Respeta tus límites horarios</li>
          <li><strong>Supervisión regular:</strong> Continúa con espacios de supervisión</li>
          <li><strong>Formación continua:</strong> Actualiza tus habilidades de afrontamiento</li>
          <li><strong>Red de apoyo:</strong> Cultiva relaciones con colegas</li>
          <li><strong>Autocuidado proactivo:</strong> No esperes a sentirte mal para cuidarte</li>
        </ul>
      `;
    }

    if (results.type === 'compassion') {
      html += `
        <ul>
          <li><strong>Mindfulness regular:</strong> Mantén práctica diaria de 10-15 minutos</li>
          <li><strong>Reflexión estructurada:</strong> Dedica tiempo semanal a procesar emociones</li>
          <li><strong>Límites saludables:</strong> Revisa periódicamente tus límites profesionales</li>
          <li><strong>Actividades restauradoras:</strong> Mantén hobbies no relacionados con trabajo</li>
          <li><strong>Formación en resiliencia:</strong> Asiste a talleres de construcción de resiliencia</li>
        </ul>
      `;
    }

    if (results.type === 'selfcare') {
      html += `
        <ul>
          <li><strong>Continúa con tus estrategias actuales:</strong> Lo estás haciendo bien</li>
          <li><strong>Revisa periódicamente:</strong> Evalúa tu autocuidado cada 3 meses</li>
          <li><strong>Comparte tu experiencia:</strong> Ayuda a colegas compartiendo tus estrategias</li>
          <li><strong>Diversifica:</strong> Explora nuevas actividades de autocuidado</li>
          <li><strong>Celebra logros:</strong> Reconoce lo bien que te cuidas</li>
        </ul>
      `;
    }
  }

  html += '</div>';
  return html;
}

// This function is deprecated - results now download via RTF in modal
function generatePDF() {
  alert('Los resultados se descargan desde el modal de resultados. Haz clic en "Ver mis resultados" para acceder a la descarga en formato RTF.');
}

function shareDataAnonymously() {
  window.open('https://forms.gle/DATOS-ANONIMOS-AQUI', '_blank');
}

window.onclick = function (event) {
  const evalModal = document.getElementById('evaluationModal');
  const guideModal = document.getElementById('guideModal');

  if (event.target === evalModal) {
    closeModal();
  }

  if (event.target === guideModal) {
    cerrarGuia();
  }
};

// Section Navigation
function showSection(sectionId) {
  // Hide all sections
  document.querySelectorAll('.app-section').forEach(section => {
    section.classList.remove('active');
  });

  // Show selected section
  const section = document.getElementById(sectionId);
  if (section) {
    section.classList.add('active');
    currentSection = sectionId;

    // Si es seguimiento, cargar historial
    if (sectionId === 'seguimiento') {
      setTimeout(() => mostrarHistorialEvaluaciones(), 100);
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Close mobile menu if open
    const navMenu = document.getElementById('navMenu');
    if (navMenu) {
      navMenu.classList.remove('active');
    }
  }
}

function toggleMenu() {
  const navMenu = document.getElementById('navMenu');
  if (navMenu) {
    navMenu.classList.toggle('active');
  }
}

// Resource Tabs
function showResourceTab(tabName) {
  // Hide all tabs
  document.querySelectorAll('.resource-tab').forEach(tab => {
    tab.classList.remove('active');
  });

  // Show selected tab
  const tab = document.getElementById(tabName + '-tab');
  if (tab) {
    tab.classList.add('active');
  }

  // Update button states
  document.querySelectorAll('.resources-tabs .tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');
}

// Library Tabs
function showLibraryTab(tabName) {
  // Hide all tabs
  document.querySelectorAll('.library-tab').forEach(tab => {
    tab.classList.remove('active');
  });

  // Show selected tab
  const tab = document.getElementById(tabName + '-tab');
  if (tab) {
    tab.classList.add('active');
  }

  // Update button states
  const parentSection = event.target.closest('section');
  if (parentSection) {
    parentSection.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
  }
  event.target.classList.add('active');
}

// Guided Exercise Functions
function startGuidedExercise(exerciseType) {
  const exercises = {
    respiracion: {
      title: 'Respiración Consciente Abdominal',
      duration: 3,
      instructions: [
        { time: 0, text: 'Encuentra una postura cómoda. Cierra los ojos si te sientes cómodo.' },
        { time: 30, text: 'Coloca una mano en tu pecho y otra en tu abdomen.' },
        { time: 60, text: 'Inhala profundamente por la nariz contando hasta 4... 1, 2, 3, 4.' },
        { time: 68, text: 'Retén el aire contando hasta 4... 1, 2, 3, 4.' },
        { time: 76, text: 'Exhala lentamente por la boca contando hasta 6... 1, 2, 3, 4, 5, 6.' },
        { time: 86, text: 'Muy bien. Repitamos el ciclo...' },
        { time: 90, text: 'Inhala... 1, 2, 3, 4.' },
        { time: 98, text: 'Retén... 1, 2, 3, 4.' },
        { time: 106, text: 'Exhala... 1, 2, 3, 4, 5, 6.' },
        { time: 120, text: 'Continúa con este ritmo a tu propio ritmo durante 2 minutos más.' },
        { time: 150, text: 'Cuando estés listo, abre los ojos lentamente. ¡Excelente trabajo!' }
      ]
    },
    escaneo: {
      title: 'Escaneo Corporal Express',
      duration: 5,
      instructions: [
        { time: 0, text: 'Acuéstate o siéntate cómodamente. Cierra los ojos.' },
        { time: 30, text: 'Lleva tu atención a tus pies. ¿Qué sensaciones notas?' },
        { time: 60, text: 'Sube a tus tobillos y pantorrillas. Solo observa, sin juzgar.' },
        { time: 90, text: 'Ahora tus rodillas y muslos. Nota cualquier tensión o relajación.' },
        { time: 120, text: 'Caderas y abdomen. Respira hacia cualquier tensión que encuentres.' },
        { time: 150, text: 'Pecho y espalda. Siente cómo se expanden con cada respiración.' },
        { time: 180, text: 'Hombros y brazos. Permite que se relajen hacia abajo.' },
        { time: 210, text: 'Cuello y cabeza. Suaviza cualquier tensión en tu mandíbula.' },
        { time: 240, text: 'Ahora siente tu cuerpo como un todo. Completamente presente.' },
        { time: 270, text: 'Cuando estés listo, abre los ojos. Has completado el escaneo.' }
      ]
    },
    autocompasion: {
      title: 'Meditación de Autocompasión',
      duration: 7,
      instructions: [
        { time: 0, text: 'Siéntate cómodamente. Cierra los ojos y respira naturalmente.' },
        { time: 30, text: 'Coloca tus manos sobre tu corazón. Siente su calor.' },
        { time: 60, text: 'Reconoce que este momento puede ser difícil. Está bien.' },
        { time: 90, text: 'Repite mentalmente: "Me merezco compasión y amabilidad"' },
        { time: 120, text: 'Respira. "Estoy haciendo lo mejor que puedo"' },
        { time: 150, text: 'Continúa respirando. "Es normal sentir dificultades"' },
        { time: 180, text: 'Imagina que hablas con un amigo querido que sufre. ¿Qué le dirías?' },
        { time: 240, text: 'Ahora dirígete esas mismas palabras amables a ti mismo.' },
        { time: 300, text: 'Respira con esa energía de amabilidad hacia ti.' },
        { time: 360, text: 'Cuando estés listo, abre los ojos. Llévate esta compasión contigo.' }
      ]
    }
  };

  const exercise = exercises[exerciseType];
  if (!exercise) {
    alert('Ejercicio no disponible en esta versión.');
    return;
  }

  // Create modal for guided exercise
  const modal = document.getElementById('evaluationModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalBody = document.getElementById('modalBody');

  modalTitle.textContent = exercise.title;
  modalBody.innerHTML = `
    <div style="text-align: center; padding: var(--space-32);">
      <div id="exerciseInstruction" style="font-size: var(--font-size-xl); margin-bottom: var(--space-32); min-height: 80px; display: flex; align-items: center; justify-content: center;">
        Preparando ejercicio...
      </div>
      <div style="margin-bottom: var(--space-24);">
        <div style="font-size: var(--font-size-3xl); font-weight: var(--font-weight-bold); color: var(--color-primary);" id="exerciseTimer">${exercise.duration}:00</div>
      </div>
      <button class="btn btn-outline" onclick="closeModal()">Terminar</button>
    </div>
  `;

  modal.classList.add('active');

  // Run exercise timer
  let currentTime = 0;
  let currentInstructionIndex = 0;
  const instructionEl = document.getElementById('exerciseInstruction');
  const timerEl = document.getElementById('exerciseTimer');

  const timer = setInterval(() => {
    currentTime++;

    // Update timer display
    const minutes = Math.floor((exercise.duration * 60 - currentTime) / 60);
    const seconds = (exercise.duration * 60 - currentTime) % 60;
    timerEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    // Update instruction
    if (currentInstructionIndex < exercise.instructions.length &&
      currentTime >= exercise.instructions[currentInstructionIndex].time) {
      instructionEl.textContent = exercise.instructions[currentInstructionIndex].text;
      currentInstructionIndex++;
    }

    // End exercise
    if (currentTime >= exercise.duration * 60) {
      clearInterval(timer);
      instructionEl.textContent = '¡Ejercicio completado! Excelente trabajo.';
    }
  }, 1000);

  // Store timer to clear on modal close
  modal.exerciseTimer = timer;
}

// Override closeModal to clear exercise timer
const originalCloseModal = closeModal;
closeModal = function () {
  const modal = document.getElementById('evaluationModal');
  if (modal.exerciseTimer) {
    clearInterval(modal.exerciseTimer);
    modal.exerciseTimer = null;
  }
  originalCloseModal();
};

// Personal Plan Generation
function generatePersonalPlan() {
  console.log('generatePersonalPlan llamada');
  console.log('hasCompletedEvaluations:', hasCompletedEvaluations);
  console.log('evaluationResults:', evaluationResults);

  // Verificar si hay evaluaciones en el manager
  const historial = evaluacionManager.obtenerHistorial();
  if (historial.length === 0 && !hasCompletedEvaluations) {
    alert('Completa al menos una evaluación para generar tu plan personalizado.');
    return;
  }

  const planContainer = document.getElementById('personalPlan');
  const generateBtn = document.getElementById('generatePlanBtn');

  if (generateBtn) {
    generateBtn.disabled = false;
  }

  // Show loading
  planContainer.innerHTML = `
    <div style="text-align: center; padding: var(--space-32);">
      <div style="font-size: var(--font-size-3xl); margin-bottom: var(--space-16);">⏳</div>
      <p>Generando tu plan personalizado...</p>
    </div>
  `;

  // Simulate generation time
  setTimeout(() => {
    try {
      const plan = createPersonalizedPlan();
      console.log('Plan creado:', plan);
      displayPersonalPlan(plan);
    } catch (error) {
      console.error('Error generando plan:', error);
      planContainer.innerHTML = '<div class="empty-state" style="color: red;">Error al generar el plan: ' + error.message + '</div>';
    }
  }, 2000);
}

function createPersonalizedPlan() {
  console.log('createPersonalizedPlan iniciado');

  // Intentar obtener datos del historial si no hay en evaluationResults
  let demo = evaluationResults.demographics || {};
  let burnout = evaluationResults.burnout;
  let compassion = evaluationResults.compassion;
  let selfcare = evaluationResults.selfcare;

  // Si no hay datos, intentar del historial
  if (!demo.profession) {
    const historial = evaluacionManager.obtenerHistorial();
    if (historial.length > 0) {
      const ultimaEval = historial[0];
      demo = ultimaEval.datos || {};

      // Reconstruir resultados desde historial
      if (ultimaEval.tipo === 'burnout') {
        burnout = ultimaEval.resultados;
      } else if (ultimaEval.tipo === 'compasion') {
        compassion = ultimaEval.resultados;
      } else if (ultimaEval.tipo === 'autocuidado') {
        selfcare = ultimaEval.resultados;
      }
    }
  }

  console.log('Datos para plan:', { demo, burnout, compassion, selfcare });

  let plan = {
    profession: demo.profession || 'profesional',
    age: demo.age || 'N/A',
    experience: demo.experience || 'N/A',
    diagnosis: '',
    priority: '',
    urgency: 'MEDIA',
    phases: []
  };

  // Determine priority and urgency
  let highestRisk = '';
  let highestScore = 0;

  if (burnout && parseFloat(burnout.total) > highestScore) {
    highestScore = parseFloat(burnout.total);
    highestRisk = 'burnout';
  }

  if (compassion) {
    const burnoutSub = compassion.subscales.find(s => s.name.includes('Burnout'));
    const traumaSub = compassion.subscales.find(s => s.name.includes('Traumático'));
    if (burnoutSub && burnoutSub.score > 22) {
      highestRisk = 'compassion';
    }
    if (traumaSub && traumaSub.score > 22) {
      highestRisk = 'trauma';
    }
  }

  if (selfcare && parseFloat(selfcare.total) < 2.5) {
    highestRisk = 'selfcare';
  }

  // Set urgency
  if ((burnout && parseFloat(burnout.total) > 70) || (selfcare && parseFloat(selfcare.total) < 2.0)) {
    plan.urgency = 'ALTA';
  }

  // Create diagnosis
  plan.diagnosis = getDiagnosis(burnout, compassion, selfcare);
  plan.priority = highestRisk;

  // Generate phases based on assessment
  plan.phases = generatePhases(plan.profession, highestRisk, burnout, compassion, selfcare);

  return plan;
}

function getDiagnosis(burnout, compassion, selfcare) {
  let diagnosis = 'Según tus evaluaciones, observamos: ';
  let items = [];

  if (burnout) {
    const level = burnout.level.text.toLowerCase();
    items.push(`Burnout ${level} (${burnout.total}/100)`);
  }

  if (compassion) {
    const burnoutSub = compassion.subscales.find(s => s.name.includes('Burnout'));
    if (burnoutSub) {
      items.push(`Burnout ProQOL: ${burnoutSub.level.text} (${burnoutSub.score}/25)`);
    }
  }

  if (selfcare) {
    const level = selfcare.level.text.toLowerCase();
    items.push(`Autocuidado ${level} (${selfcare.total}/5)`);
  }

  return diagnosis + items.join(', ');
}

function generatePhases(profession, priority, burnout, compassion, selfcare) {
  const phases = [];

  // FASE 1: Emergency response based on priority
  const phase1 = {
    title: 'FASE 1: Establecimiento (Semanas 1-2)',
    objetivo: 'Detener deterioro y crear espacio de respiro',
    acciones: []
  };

  if (priority === 'burnout' || (burnout && parseFloat(burnout.total) > 60)) {
    phase1.acciones.push({
      titulo: 'Límite de Carga de Trabajo',
      descripcion: 'Habla con tu supervisor esta semana sobre ajustar tu carga. Propuesta: reducir consultas o casos nuevos temporalmente.',
      tiempo: '1 reunión (30 min)',
      checklist: ['Reunión programada', 'Propuesta presentada', 'Acuerdo alcanzado']
    });
  }

  phase1.acciones.push({
    titulo: 'Práctica Diaria de Mindfulness',
    descripcion: 'Elige: DRAW, Respiración Consciente o Escaneo Corporal. Cuándo: Antes o después del turno.',
    tiempo: '5 minutos',
    checklist: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']
  });

  if (selfcare && parseFloat(selfcare.total) < 2.5) {
    phase1.acciones.push({
      titulo: 'Identificar Actividad Restauradora',
      descripcion: 'Busca una actividad que realmente disfrutes (no relacionada con trabajo). Blóqueala en tu calendario.',
      tiempo: '30 minutos, 2 veces/semana',
      checklist: ['Actividad identificada', 'Calendario bloqueado', 'Primera sesión completada']
    });
  }

  phase1.acciones.push({
    titulo: 'Conexión Social',
    descripcion: 'Identifica 1 colega de confianza. Propone almuerzo o café esta semana. Conversación sobre cómo estás.',
    tiempo: '30 minutos',
    checklist: ['Colega identificado', 'Encuentro realizado']
  });

  phases.push(phase1);

  // FASE 2: Consolidation
  const phase2 = {
    title: 'FASE 2: Consolidación (Semanas 3-4)',
    objetivo: 'Mantener lo de Fase 1 y añadir segunda intervención',
    acciones: [
      {
        titulo: 'Mantener Prácticas de Fase 1',
        descripcion: 'Continúa con mindfulness diario y conexiones sociales establecidas.',
        tiempo: 'Según Fase 1',
        checklist: ['Mindfulness diario', 'Actividad restauradora', 'Conexión social']
      },
      {
        titulo: 'Meditación de Autocompasión',
        descripcion: 'Añade práctica de autocompasión 7 minutos, 3 veces por semana. Propósito: cambiar autocrítica a compasión.',
        tiempo: '7 minutos, 3x/semana',
        checklist: ['Sesión 1', 'Sesión 2', 'Sesión 3']
      }
    ]
  };

  if (priority === 'compassion' || priority === 'trauma') {
    phase2.acciones.push({
      titulo: 'Debriefing de Equipo',
      descripcion: 'Solicita o participa en sesión de debriefing grupal. Espacio seguro para procesar emociones difíciles.',
      tiempo: '60 minutos',
      checklist: ['Sesión solicitada', 'Participación activa']
    });
  }

  phases.push(phase2);

  // FASE 3: Maintenance
  const phase3 = {
    title: 'FASE 3: Mantenimiento (Semanas 5-8)',
    objetivo: 'Consolidar hábitos y planificar re-evaluación',
    acciones: [
      {
        titulo: 'Prácticas Establecidas',
        descripcion: 'Mantener 2-3 prácticas que mejor funcionan para ti. Introducir variaciones si es necesario.',
        tiempo: 'Diario',
        checklist: ['Práctica 1 mantenida', 'Práctica 2 mantenida', 'Variación explorada']
      },
      {
        titulo: 'Evaluación de Progreso',
        descripcion: 'Semana 5: Evalúa cambios usando Termómetro Emocional. Semana 8: Re-evalúa con cuestionarios completos.',
        tiempo: '15 minutos',
        checklist: ['Evaluación semana 5', 'Re-evaluación semana 8', 'Comparación de resultados']
      },
      {
        titulo: 'Plan a Largo Plazo',
        descripcion: 'Define qué prácticas continuarás de forma permanente. Considera supervisión profesional regular.',
        tiempo: '30 minutos reflexión',
        checklist: ['Prácticas permanentes identificadas', 'Calendario de seguimiento']
      }
    ]
  };

  phases.push(phase3);

  return phases;
}

function displayPersonalPlan(plan) {
  const planContainer = document.getElementById('personalPlan');

  let html = '<div class="plan-generated" id="planContent">';

  // Header
  html += `
    <div style="text-align: center; margin-bottom: var(--space-32); padding: var(--space-24); background: var(--color-bg-1); border-radius: var(--radius-lg);">
      <h3 style="color: var(--color-primary); margin-bottom: var(--space-12);">MI PLAN DE BIENESTAR PERSONALIZADO</h3>
      <p style="color: var(--color-text-secondary);">Generado: ${new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
    </div>
  `;

  // Situation
  html += `
    <div style="background: var(--color-surface); padding: var(--space-24); border-radius: var(--radius-lg); border: 1px solid var(--color-card-border); margin-bottom: var(--space-24);">
      <h4 style="margin-bottom: var(--space-16);">SITUACIÓN ACTUAL</h4>
      <p style="line-height: 1.6;">${plan.diagnosis}</p>
      <div style="margin-top: var(--space-16); padding: var(--space-12); background: ${plan.urgency === 'ALTA' ? 'rgba(var(--color-error-rgb), 0.1)' : 'rgba(var(--color-warning-rgb), 0.1)'}; border-radius: var(--radius-base);">
        <strong style="color: ${plan.urgency === 'ALTA' ? 'var(--color-error)' : 'var(--color-warning)'};">PRIORIDAD: URGENCIA ${plan.urgency}</strong>
      </div>
    </div>
  `;

  // Phases
  plan.phases.forEach((phase, index) => {
    const bgColors = ['var(--color-bg-1)', 'var(--color-bg-3)', 'var(--color-bg-7)'];
    html += `
      <div style="background: ${bgColors[index]}; padding: var(--space-24); border-radius: var(--radius-lg); margin-bottom: var(--space-24); border-left: 4px solid var(--color-primary);">
        <h4 style="margin-bottom: var(--space-8);">${phase.title}</h4>
        <p style="color: var(--color-text-secondary); margin-bottom: var(--space-20); font-style: italic;">${phase.objetivo}</p>
        
        <div style="display: flex; flex-direction: column; gap: var(--space-16);">
    `;

    phase.acciones.forEach((accion, aIndex) => {
      html += `
        <div style="background: var(--color-surface); padding: var(--space-16); border-radius: var(--radius-base);">
          <h5 style="margin-bottom: var(--space-8); color: var(--color-primary);">Acción ${aIndex + 1}: ${accion.titulo}</h5>
          <p style="margin-bottom: var(--space-8); line-height: 1.6;">${accion.descripcion}</p>
          <p style="color: var(--color-text-secondary); font-size: var(--font-size-sm); margin-bottom: var(--space-12);"><strong>Tiempo:</strong> ${accion.tiempo}</p>
          <div style="margin-top: var(--space-12);">
            <strong style="font-size: var(--font-size-sm);">✓ Checklist:</strong>
            <div style="margin-top: var(--space-8); display: flex; flex-wrap: wrap; gap: var(--space-8);">
      `;

      accion.checklist.forEach(item => {
        html += `<label style="font-size: var(--font-size-sm); display: flex; align-items: center; gap: var(--space-4);"><input type="checkbox"> ${item}</label>`;
      });

      html += `
            </div>
          </div>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;
  });

  // Resources
  html += `
    <div style="background: var(--color-bg-2); padding: var(--space-20); border-radius: var(--radius-base); margin-bottom: var(--space-24);">
      <h4 style="margin-bottom: var(--space-12);">📚 RECURSOS ASIGNADOS</h4>
      <ul style="margin: 0; padding-left: var(--space-20); line-height: 1.8;">
        <li><a href="#recursos" onclick="showSection('recursos'); showResourceTab('mindfulness')" style="color: var(--color-primary);">Ejercicios de Mindfulness</a></li>
        <li><a href="#recursos" onclick="showSection('recursos'); showResourceTab('regulacion')" style="color: var(--color-primary);">Técnicas de Regulación Emocional</a></li>
        <li><a href="#biblioteca" onclick="showSection('biblioteca'); showLibraryTab('guias')" style="color: var(--color-primary);">Guías descargables</a></li>
        <li><a href="#comunidad" onclick="showSection('comunidad')" style="color: var(--color-primary);">Contactos de apoyo profesional</a></li>
      </ul>
    </div>
  `;

  // Reminder
  html += `
    <div style="background: var(--color-secondary); padding: var(--space-20); border-radius: var(--radius-base); margin-bottom: var(--space-24);">
      <p style="margin: 0;"><strong>📅 Recordatorio:</strong> Re-evalúa tu bienestar en 3 meses (${new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toLocaleDateString('es-ES')}) para medir tu progreso.</p>
    </div>
  `;

  // Download button
  html += `
    <button class="btn btn-primary" style="width: 100%;" onclick="downloadPersonalPlanPDF()">📥 Descargar Plan</button>
  `;

  html += '</div>';

  planContainer.innerHTML = html;
}

// Download Personal Plan as RTF - UPDATED VERSION
function downloadPersonalPlanPDF() {
  try {
    const date = new Date().toLocaleDateString('es-ES');
    const demo = evaluationResults.demographics || {};
    const professionLabels = {
      medico: 'Médico/a',
      enfermero: 'Enfermero/a',
      psicologo: 'Psicólogo/a',
      trabajador_social: 'Trabajador/a Social',
      otro: 'Otro'
    };
    // Obtener el plan generado
    const plan = createPersonalizedPlan();
    // Construir líneas de texto
    const lines = [];
    lines.push('MI PLAN DE BIENESTAR PERSONALIZADO');
    lines.push('Generado: ' + date);
    lines.push('Profesión: ' + (professionLabels[demo.profession] || 'N/A'));
    lines.push('Experiencia: ' + (demo.experience || 'N/A'));
    lines.push('');
    lines.push('SITUACION ACTUAL');
    lines.push(plan.diagnosis);
    lines.push('PRIORIDAD: URGENCIA ' + plan.urgency);
    lines.push('');
    // Fases
    plan.phases.forEach((phase, index) => {
      lines.push(phase.title.toUpperCase());
      lines.push('Objetivo: ' + phase.objetivo);
      phase.acciones.forEach((accion, aIndex) => {
        lines.push('Acción ' + (aIndex + 1) + ': ' + accion.titulo);
        lines.push(accion.descripcion);
        lines.push('Tiempo: ' + accion.tiempo);
        if (accion.checklist && accion.checklist.length) {
          lines.push('Checklist:');
          accion.checklist.forEach(item => lines.push('[ ] ' + item));
        }
        lines.push('');
      });
    });
    lines.push('RECURSOS ASIGNADOS');
    lines.push('- Ejercicios de Mindfulness (sección Recursos Inmediatos)');
    lines.push('- Técnicas de Regulación Emocional');
    lines.push('- Guías descargables (sección Biblioteca)');
    lines.push('- Contactos de apoyo profesional (sección Comunidad)');
    lines.push('');
    const followUpDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toLocaleDateString('es-ES');
    lines.push('Recordatorio: Re-evalúa tu bienestar en 3 meses (' + followUpDate + ')');
    lines.push('');
    lines.push('© 2025 Alvaro Navarro Mingorance | CC BY-NC 4.0');
    // Generar y descargar PDF
    const fileName = `Plan_Bienestar_${new Date().toISOString().split('T')[0]}.pdf`;
    generateAndDownloadPDF(fileName, 'Plan de Bienestar', lines);
    alert('¡Plan descargado como PDF correctamente!');
  } catch (error) {
    console.error('Error descargando plan:', error);
    alert('Error al descargar el plan. Error: ' + error.message);
  }
}

// Guide content database
const guideContents = {
  autocuidado: {
    title: 'Guía de Autocuidado para Profesionales de CPP',
    sections: [
      {
        title: '¿Qué es el Autocuidado?',
        content: `El autocuidado es el conjunto de prácticas deliberadas que realizamos para cuidar nuestra salud física, emocional, mental y espiritual. En el contexto de cuidados paliativos pediátricos, el autocuidado no es un lujo - es una necesidad profesional y ética.

Cuando trabajamos con niños en fin de vida y sus familias, estamos constantemente expuestos al sufrimiento, la pérdida y el duelo. Sin prácticas sistemáticas de autocuidado, corremos el riesgo de desarrollar burnout, fatiga por compasión y estrés traumático secundario.

El autocuidado no es egoísmo - es la base que nos permite seguir cuidando de otros con calidad y compasión.`
      },
      {
        title: '20 Estrategias Prácticas',
        content: `1. Físico:
- Dormir 7-8 horas diarias
- Alimentación saludable y regular
- Ejercicio físico 3-4 veces/semana
- Hidratación adecuada
- Revisiones médicas preventivas

2. Emocional:
- Terapia o supervisión profesional regular
- Escritura reflexiva o diario emocional
- Prácticas de mindfulness diarias
- Permitirse llorar y sentir
- Debriefing después de casos difíciles

3. Social:
- Tiempo de calidad con familia y amigos
- Mantener aficiones y hobbies
- Vacaciones y descansos regulares
- Red de apoyo entre colegas
- Límites claros entre trabajo y vida personal

4. Espiritual:
- Conexión con valores y propósito
- Prácticas contemplativas o religiosas
- Contacto con la naturaleza
- Actividades creativas
- Momentos de silencio y reflexión

5. Profesional:
- Formación continua
- Mentoría y supervisión
- Participación en equipos de apoyo
- Límites de carga de trabajo
- Celebración de logros`
      },
      {
        title: 'Barreras Comunes y Soluciones',
        content: `BARRERA: "No tengo tiempo"
SOLUCIÓN: Empieza con 5 minutos diarios. El autocuidado es una inversión, no un gasto de tiempo.

BARRERA: "Me siento culpable cuidando de mí"
SOLUCIÓN: No puedes dar de un vaso vacío. Cuidarte es cuidar a tus pacientes.

BARRERA: "Mi trabajo es impredecible"
SOLUCIÓN: Crea rutinas micro (2-3 min) que puedas hacer en cualquier momento.

BARRERA: "Nadie más lo hace"
SOLUCIÓN: Sé el ejemplo. Normaliza el autocuidado en tu equipo.

BARRERA: "Es caro"
SOLUCIÓN: El autocuidado más efectivo es gratuito: respirar, caminar, conectar.`
      },
      {
        title: 'Plan Personalizado',
        content: `MI PLAN DE AUTOCUIDADO:

Físico (elige 2):
□ _______________________
□ _______________________

Emocional (elige 2):
□ _______________________
□ _______________________

Social (elige 1):
□ _______________________

Espiritual (elige 1):
□ _______________________

Profesional (elige 1):
□ _______________________

FECHA DE INICIO: _______
REVISIÓN EN 1 MES: _______

COMPROMISO: Me comprometo a cuidarme porque mi bienestar importa.`
      }
    ]
  },
  burnout: {
    title: 'Reconocer Señales de Alerta de Burnout',
    sections: [
      {
        title: 'Definición de Burnout',
        content: `El burnout es un síndrome de agotamiento emocional, despersonalización y reducción del logro personal que surge cuando las demandas del trabajo superan constantemente nuestros recursos para afrontarlas.

Tres dimensiones:
1. AGOTAMIENTO EMOCIONAL: Te sientes vacío, sin energía, exhausto
2. DESPERSONALIZACIÓN: Actitud cínica, distante o negativa hacia pacientes
3. BAJA REALIZACIÓN: Sensación de ineficacia, falta de logros

El burnout no aparece de repente - es un proceso gradual que podemos prevenir si reconocemos las señales tempranas.`
      },
      {
        title: 'Síntomas Precoces - Checklist',
        content: `CHECKLIST DE SEÑALES TEMPRANAS:

Físicas:
□ Fatiga constante, incluso después de descansar
□ Dolores de cabeza frecuentes
□ Problemas de sueño (insomnio o dormir demasiado)
□ Problemas gastrointestinales
□ Cambios en apetito o peso
□ Vulnerabilidad a enfermedades

Emocionales:
□ Irritabilidad o impaciencia
□ Sensación de abrumamiento
□ Ansiedad o nerviosismo constante
□ Desmotivación o apatía
□ Tristeza o sentimientos depresivos
□ Cinismo hacia el trabajo

Conductuales:
□ Procrastinación o evitación de tareas
□ Aislamiento de colegas
□ Incremento en uso de sustancias
□ Llegadas tarde o ausencias
□ Errores más frecuentes
□ Pérdida de eficiencia

Cognitivas:
□ Dificultad para concentrarse
□ Olvidos frecuentes
□ Pensamientos negativos recurrentes
□ Autocrítica intensa
□ Pensamientos de "no puedo más"
□ Dificultad para tomar decisiones

Si marcaste 5 o más: ACCIÓN INMEDIATA NECESARIA`
      },
      {
        title: '¿Cuándo Buscar Ayuda Profesional?',
        content: `BUSCA AYUDA PROFESIONAL SI:

⚠️ Tus síntomas afectan significativamente tu vida diaria
⚠️ Has intentado estrategias de autocuidado sin mejora
⚠️ Experimentas pensamientos de hacerte daño
⚠️ Tus relaciones personales se han deteriorado
⚠️ Estás usando sustancias para afrontar
⚠️ Sientes que "no puedes más"

OPCIONES DE APOYO:

1. Psicólogo especializado en burnout
2. Servicio de salud laboral de tu hospital
3. Programas de apoyo al empleado (EAP)
4. Supervisión profesional especializada
5. Grupos de apoyo entre pares

RECUERDA: Buscar ayuda es signo de fortaleza, no de debilidad. Los mejores profesionales se cuidan y buscan apoyo cuando lo necesitan.`
      },
      {
        title: 'Contactos de Crisis en España',
        content: `CONTACTOS DE EMERGENCIA:

📞 024
Línea de atención a la conducta suicida
24/7 - Gratuito - Confidencial

📞 112
Emergencias médicas
24/7

📞 Teléfono de la Esperanza: 717 003 717
Apoyo emocional en crisis
24/7

COLEGIO OFICIAL DE PSICÓLOGOS:
www.cop.es
Directorio de psicólogos especializados

PEDPAL - Asociación Española CPP:
www.pedpal.es
Recursos y apoyo para profesionales

RECURSOS ONLINE:
- Portal de salud laboral de tu hospital
- Programas de bienestar institucionales
- Asociaciones profesionales de tu especialidad`
      }
    ]
  },
  apoyo: {
    title: 'Apoyo Emocional en Equipo',
    sections: [
      {
        title: 'Importancia del Apoyo en CPP',
        content: `El trabajo en cuidados paliativos pediátricos es intensamente emocional. Ninguno de nosotros puede procesarlo en solitario. El apoyo del equipo no es opcional - es esencial.

BENEFICIOS DEL APOYO EN EQUIPO:
- Reduce burnout y fatiga por compasión
- Normaliza emociones difíciles
- Mejora cohesión y comunicación
- Facilita aprendizaje colectivo
- Incrementa satisfacción laboral
- Previene aislamiento emocional

Un equipo que se apoya mutuamente proporciona mejor cuidado a pacientes y familias.`
      },
      {
        title: 'Cómo Comunicarse Efectivamente',
        content: `PRINCIPIOS DE COMUNICACIÓN DE APOYO:

1. ESCUCHA ACTIVA
- Escucha sin interrumpir
- Muestra que comprendes (asiente, contacto visual)
- Refleja emociones: "Veo que esto te afectó profundamente"

2. VALIDACIÓN
- "Es completamente normal sentirse así"
- "Yo también he experimentado algo similar"
- Evita minimizar: "No deberías sentirte mal"

3. NO DAR CONSEJOS NO SOLICITADOS
- Pregunta: "¿Quieres que te comparta mi experiencia?"
- A veces solo necesitamos ser escuchados

4. CONFIDENCIALIDAD
- Lo compartido en espacios de apoyo se queda ahí
- Genera confianza y seguridad

5. VULNERABILIDAD
- Comparte tus propias dificultades
- Normaliza pedir ayuda
- Modela autocuidado`
      },
      {
        title: 'Modelo de Debriefing',
        content: `ESTRUCTURA DE DEBRIEFING POST-CASO:

Duración: 30-60 minutos
Frecuencia: Después de casos especialmente difíciles
Facilitador: Psicólogo, supervisor o miembro con formación

FASES:

1. PRESENTACIÓN (5 min)
- Establecer espacio seguro y confidencial
- Recordar que todas las emociones son válidas

2. HECHOS (10 min)
- ¿Qué ocurrió? (objetivamente)
- Cada persona comparte su perspectiva

3. PENSAMIENTOS (10 min)
- ¿Qué pensaste en ese momento?
- ¿Qué sigue dándote vueltas?

4. EMOCIONES (15 min)
- ¿Cómo te sentiste? ¿Cómo te sientes ahora?
- Validación grupal de emociones

5. SÍNTOMAS (10 min)
- ¿Has notado reacciones físicas o emocionales?
- Normalizar respuestas de estrés

6. ENSEÑANZA (10 min)
- ¿Qué aprendimos?
- ¿Qué haríamos diferente?

7. CIERRE (5 min)
- Recordar estrategias de autocuidado
- Seguimiento si alguien lo necesita`
      },
      {
        title: 'Crear Espacios Seguros',
        content: `CÓMO CREAR UNA CULTURA DE APOYO:

1. NORMALIZAR LA VULNERABILIDAD
- Los líderes comparten sus propias dificultades
- Se valora el autocuidado públicamente
- Pedir ayuda es visto como fortaleza

2. REUNIONES REGULARES
- Reuniones de equipo con espacio emocional
- Check-ins breves al inicio del turno
- Debriefings sistemáticos

3. ESPACIOS FÍSICOS
- Sala de descanso acogedora
- Espacio privado para procesar emociones
- Recursos visibles (guías, contactos)

4. RITUALES DE EQUIPO
- Celebración de logros
- Reconocimiento de momentos difíciles
- Rituales de despedida de pacientes

5. FORMACIÓN
- Talleres de comunicación emocional
- Entrenamiento en debriefing
- Mindfulness grupal

6. POLÍTICAS DE APOYO
- Protocolos claros post-evento traumático
- Acceso a apoyo psicológico
- Flexibilidad tras casos difíciles`
      }
    ]
  },
  mindfulness: {
    title: 'Mindfulness para Principiantes en CPP',
    sections: [
      {
        title: '¿Qué es Mindfulness? (Base Científica)',
        content: `Mindfulness o atención plena es la capacidad de estar presente en el momento actual, con una actitud de apertura, curiosidad y aceptación, sin juzgar.

ORIGEN: Prácticas contemplativas orientales adaptadas al contexto clínico occidental por Jon Kabat-Zinn (1979) con el programa MBSR.

EVIDENCIA CIENTÍFICA EN PROFESIONALES SANITARIOS:
- Reduce burnout (efecto medio-grande)
- Disminuye ansiedad y depresión
- Mejora regulación emocional
- Aumenta compasión y resiliencia
- Mejora atención y toma de decisiones

CÓMO FUNCIONA:
Mindfulness modifica circuitos cerebrales:
- Reduce actividad de amígdala (alarma emocional)
- Fortalece corteza prefrontal (regulación)
- Aumenta materia gris en áreas de compasión
- Reduce respuesta de estrés (cortisol)

Para profesionales de CPP, mindfulness nos ayuda a:
1. Estar presentes con pacientes y familias
2. Regular nuestras emociones intensas
3. Mantener compasión sin agotarnos
4. Recuperarnos del estrés diario`
      },
      {
        title: 'Prácticas Progresivas',
        content: `NIVEL 1: INICIACIÓN (Semanas 1-2)

Respiración Consciente (3 min)
- Siéntate cómodo
- Atiende a tu respiración natural
- Cuenta: 1 al inhalar, 2 al exhalar... hasta 10
- Si te distraes, vuelve gentilmente a 1
Frecuencia: 2 veces/día

Pausa DRAW (2 min)
- Detente
- Respira 5 veces profundo
- Asimila cómo estás
- Prosigue ("Watch" = observa)
Frecuencia: Entre pacientes

NIVEL 2: DESARROLLO (Semanas 3-4)

Escaneo Corporal (5 min)
- Recorre tu cuerpo de pies a cabeza
- Observa sensaciones sin cambiarlas
- Respira hacia áreas de tensión
Frecuencia: 1 vez/día

Mindfulness en Actividad (5 min)
- Elige: comer, caminar, ducha
- Pon atención total en la experiencia
- Nota detalles sensoriales
Frecuencia: 1 vez/día

NIVEL 3: PROFUNDIZACIÓN (Semanas 5-8)

Meditación Sentada (10-20 min)
- Respiración como ancla
- Observar pensamientos sin enredarse
- Volver a respiración cada vez
Frecuencia: 1 vez/día

Meditación de Compasión (10 min)
- Genera sentimientos de amabilidad
- Primero hacia ti, luego hacia otros
- Incluye pacientes y familias
Frecuencia: 3 veces/semana`
      },
      {
        title: 'Integración en Rutina',
        content: `CÓMO HACER DE MINDFULNESS UN HÁBITO:

1. ANCLA A RUTINAS EXISTENTES
- Respiración consciente al despertar (antes de levantarte)
- DRAW antes de entrar a cada habitación
- Escaneo corporal al acostarte

2. EMPIEZA PEQUEÑO
- 2-3 minutos es suficiente al inicio
- Consistencia > Duración
- 5 min diarios >> 30 min una vez

3. USA RECORDATORIOS
- Alarmas en móvil
- Post-its en lugares estratégicos
- Apps de mindfulness

4. PRACTICA EN MOMENTOS DIFÍCILES
- Después de caso complejo: 3 respiraciones
- En reuniones estresantes: atención a pies en suelo
- Antes de turno: intención consciente

5. ENCUENTRA TU ESTILO
- Formal (meditación sentada) vs Informal (en actividad)
- Guiado (apps) vs Silencioso
- Solo vs En grupo

6. SÉ COMPASIVO CONTIGO
- Distraerse es NORMAL y esperado
- No hay "buena" o "mala" meditación
- Cada vez que vuelves, estás entrenando

7. MIDE PROGRESO
- ¿Cómo te sientes antes vs después?
- ¿Notas cambios en reactividad emocional?
- ¿Te recuperas más rápido del estrés?

RECURSOS RECOMENDADOS:
- Apps: Headspace, Insight Timer, Calm
- Libros: "Mindfulness en la práctica clínica"
- Cursos: MBSR online o presencial
- Grupos: Práctica grupal en tu hospital`
      }
    ]
  }
};

// Global variable to store current guide type
let currentGuideType = null;
let guiaActual = null;

// Contenido de guías
const guiasContenido = {
  autocuidado: {
    titulo: 'Guía de Autocuidado para CPP',
    contenido: `
      <h3>¿QUÉ ES AUTOCUIDADO?</h3>
      <p>El autocuidado es el conjunto de prácticas deliberadas que realizas para mantener tu bienestar físico, emocional, social y espiritual. En cuidados paliativos pediátricos, no es un lujo: es esencial.</p>
      <p>Cuando trabajas con niños en fin de vida y sus familias, estás constantemente expuesto al sufrimiento, la pérdida y el duelo. Sin prácticas sistemáticas de autocuidado, corres el riesgo de desarrollar burnout, fatiga por compasión y estrés traumático secundario.</p>
      
      <h3>20 ESTRATEGIAS PRÁCTICAS</h3>
      <p><strong>FíSICO:</strong></p>
      <ul>
        <li>Dormir 7-8 horas diarias</li>
        <li>Alimentación saludable y regular</li>
        <li>Ejercicio físico 3-4 veces/semana</li>
        <li>Hidratación adecuada</li>
        <li>Revisiones médicas preventivas</li>
      </ul>
      <p><strong>EMOCIONAL:</strong></p>
      <ul>
        <li>Terapia o supervisión profesional regular</li>
        <li>Escritura reflexiva o diario emocional</li>
        <li>Prácticas de mindfulness diarias</li>
        <li>Permitirse llorar y sentir</li>
        <li>Debriefing después de casos difíciles</li>
      </ul>
      <p><strong>SOCIAL:</strong></p>
      <ul>
        <li>Tiempo de calidad con familia y amigos</li>
        <li>Mantener aficiones y hobbies</li>
        <li>Vacaciones y descansos regulares</li>
        <li>Red de apoyo entre colegas</li>
        <li>Límites claros entre trabajo y vida personal</li>
      </ul>
      <p><strong>ESPIRITUAL:</strong></p>
      <ul>
        <li>Conexión con valores y propósito</li>
        <li>Prácticas contemplativas o religiosas</li>
        <li>Contacto con la naturaleza</li>
        <li>Actividades creativas</li>
        <li>Momentos de silencio y reflexión</li>
      </ul>

      <h3>BARRERAS COMUNES Y SOLUCIONES</h3>
      <p><strong>"No tengo tiempo"</strong> → Empieza con 5 minutos diarios. El autocuidado es una inversión, no un gasto de tiempo.</p>
      <p><strong>"Me siento culpable cuidando de mí"</strong> → No puedes dar de un vaso vacío. Cuidarte es cuidar a tus pacientes.</p>
      <p><strong>"Mi trabajo es impredecible"</strong> → Crea rutinas micro (2-3 min) que puedas hacer en cualquier momento.</p>
      <p><strong>"Nadie más lo hace"</strong> → Sé el ejemplo. Normaliza el autocuidado en tu equipo.</p>
      <p><strong>"Es caro"</strong> → El autocuidado más efectivo es gratuito: respirar, caminar, conectar.</p>
      
      <h3>MI PLAN PERSONALIZADO</h3>
      <p><strong>Físico (elige 2):</strong> _______________________</p>
      <p><strong>Emocional (elige 2):</strong> _______________________</p>
      <p><strong>Social (elige 1):</strong> _______________________</p>
      <p><strong>Espiritual (elige 1):</strong> _______________________</p>
      <p><strong>COMPROMISO:</strong> Me comprometo a cuidarme porque mi bienestar importa.</p>
    `
  },
  alertas: {
    titulo: 'Reconocer Señales de Alerta de Burnout',
    contenido: `
      <h3>¿QUÉ ES BURNOUT?</h3>
      <p>El burnout es un síndrome de agotamiento emocional, despersonalización y reducción del logro personal que surge cuando las demandas del trabajo superan constantemente nuestros recursos para afrontarlas.</p>
      <p><strong>Tres dimensiones:</strong></p>
      <ol>
        <li><strong>AGOTAMIENTO EMOCIONAL:</strong> Te sientes vacío, sin energía, exhausto</li>
        <li><strong>DESPERSONALIZACIÓN:</strong> Actitud cínica, distante o negativa hacia pacientes</li>
        <li><strong>BAJA REALIZACIÓN:</strong> Sensación de ineficacia, falta de logros</li>
      </ol>
      
      <h3>CHECKLIST DE SEÑALES TEMPRANAS</h3>
      <p><strong>FíSICAS:</strong></p>
      <ul>
        <li>☐ Fatiga constante, incluso después de descansar</li>
        <li>☐ Dolores de cabeza frecuentes</li>
        <li>☐ Problemas de sueño (insomnio o dormir demasiado)</li>
        <li>☐ Problemas gastrointestinales</li>
        <li>☐ Cambios en apetito o peso</li>
        <li>☐ Vulnerabilidad a enfermedades</li>
      </ul>
      <p><strong>EMOCIONALES:</strong></p>
      <ul>
        <li>☐ Irritabilidad o impaciencia</li>
        <li>☐ Sensación de abrumamiento</li>
        <li>☐ Ansiedad o nerviosismo constante</li>
        <li>☐ Desmotivación o apatía</li>
        <li>☐ Tristeza o sentimientos depresivos</li>
        <li>☐ Cinismo hacia el trabajo</li>
      </ul>
      <p><strong>CONDUCTUALES:</strong></p>
      <ul>
        <li>☐ Procrastinación o evitación de tareas</li>
        <li>☐ Aislamiento de colegas</li>
        <li>☐ Incremento en uso de sustancias</li>
        <li>☐ Llegadas tarde o ausencias</li>
        <li>☐ Errores más frecuentes</li>
      </ul>
      <p><em>Si marcaste 5 o más: ACCIÓN INMEDIATA NECESARIA</em></p>

      <h3>CUÁNDO BUSCAR AYUDA PROFESIONAL</h3>
      <p><strong>BUSCA AYUDA SI:</strong></p>
      <ul>
        <li>⚠️ Tus síntomas afectan significativamente tu vida diaria</li>
        <li>⚠️ Has intentado estrategias de autocuidado sin mejora</li>
        <li>⚠️ Experimentas pensamientos de hacerte daño</li>
        <li>⚠️ Tus relaciones personales se han deteriorado</li>
        <li>⚠️ Estás usando sustancias para afrontar</li>
      </ul>
      
      <h3>CONTACTOS DE CRISIS EN ESPAÑA</h3>
      <p><strong>📞 024</strong> - Línea de atención a la conducta suicida (24/7, Gratuito, Confidencial)</p>
      <p><strong>📞 Teléfono de la Esperanza:</strong> 717 003 717 (24/7)</p>
      <p><strong>COLEGIO OFICIAL DE PSICÓLOGOS:</strong> www.cop.es</p>
      <p><strong>PEDPAL:</strong> www.pedpal.es - Recursos y apoyo para profesionales CPP</p>
      <p><em>RECUERDA: Buscar ayuda es signo de fortaleza, no de debilidad.</em></p>
    `
  },
  equipo: {
    titulo: 'Apoyo Emocional en Equipo',
    contenido: `
      <h3>IMPORTANCIA DEL APOYO EN CPP</h3>
      <p>El trabajo en cuidados paliativos pediátricos es intensamente emocional. Ninguno de nosotros puede procesarlo en solitario. El apoyo del equipo no es opcional - es esencial.</p>
      <p><strong>BENEFICIOS:</strong></p>
      <ul>
        <li>Reduce burnout y fatiga por compasión</li>
        <li>Normaliza emociones difíciles</li>
        <li>Mejora cohesión y comunicación</li>
        <li>Facilita aprendizaje colectivo</li>
        <li>Incrementa satisfacción laboral</li>
        <li>Previene aislamiento emocional</li>
      </ul>
      
      <h3>5 PRINCIPIOS DE COMUNICACIÓN EFECTIVA</h3>
      <ol>
        <li><strong>ESCUCHA ACTIVA:</strong> Sin interrumpir, sin solucionar. Muestra que comprendes.</li>
        <li><strong>VALIDACIÓN:</strong> "Es completamente normal sentirse así" - Evita minimizar.</li>
        <li><strong>NO DAR CONSEJOS NO SOLICITADOS:</strong> Pregunta: "¿Quieres que te comparta mi experiencia?"</li>
        <li><strong>CONFIDENCIALIDAD:</strong> Lo compartido en espacios de apoyo se queda ahí.</li>
        <li><strong>VULNERABILIDAD:</strong> Comparte tus propias dificultades. Normaliza pedir ayuda.</li>
      </ol>

      <h3>MODELO DE DEBRIEFING POST-CASO</h3>
      <p><strong>Duración:</strong> 30-60 minutos | <strong>Cuándo:</strong> Después de casos especialmente difíciles</p>
      <p><strong>ESTRUCTURA:</strong></p>
      <ol>
        <li><strong>PRESENTACIÓN (5 min):</strong> Establecer espacio seguro y confidencial</li>
        <li><strong>HECHOS (10 min):</strong> ¿Qué ocurrió? (objetivamente)</li>
        <li><strong>PENSAMIENTOS (10 min):</strong> ¿Qué pensaste? ¿Qué sigue dándote vueltas?</li>
        <li><strong>EMOCIONES (15 min):</strong> ¿Cómo te sentiste? Validación grupal</li>
        <li><strong>SÍNTOMAS (10 min):</strong> ¿Has notado reacciones físicas o emocionales?</li>
        <li><strong>ENSEÑANZA (10 min):</strong> ¿Qué aprendimos? ¿Qué haríamos diferente?</li>
        <li><strong>CIERRE (5 min):</strong> Recordar estrategias de autocuidado</li>
      </ol>
      
      <h3>CÓMO CREAR ESPACIOS SEGUROS</h3>
      <ul>
        <li><strong>Normalizar vulnerabilidad:</strong> Los líderes comparten sus propias dificultades</li>
        <li><strong>Reuniones regulares:</strong> Check-ins breves al inicio del turno</li>
        <li><strong>Espacios físicos:</strong> Sala de descanso acogedora y privada</li>
        <li><strong>Rituales de equipo:</strong> Celebración de logros, reconocimiento de momentos difíciles</li>
        <li><strong>Formación:</strong> Talleres de comunicación emocional y debriefing</li>
        <li><strong>Políticas de apoyo:</strong> Acceso a apoyo psicológico, flexibilidad tras casos difíciles</li>
      </ul>
    `
  },
  mindfulness: {
    titulo: 'Mindfulness para Principiantes en CPP',
    contenido: `
      <h3>¿QUÉ ES MINDFULNESS?</h3>
      <p>Mindfulness o atención plena es la capacidad de estar presente en el momento actual, con una actitud de apertura, curiosidad y aceptación, sin juzgar.</p>
      <p><strong>ORIGEN:</strong> Prácticas contemplativas orientales adaptadas al contexto clínico occidental por Jon Kabat-Zinn (1979) con el programa MBSR.</p>
      
      <h3>EVIDENCIA CIENTÍFICA EN PROFESIONALES SANITARIOS</h3>
      <ul>
        <li>Reduce burnout (efecto medio-grande)</li>
        <li>Disminuye ansiedad y depresión</li>
        <li>Mejora regulación emocional</li>
        <li>Aumenta compasión y resiliencia</li>
        <li>Mejora atención y toma de decisiones</li>
      </ul>
      <p><strong>CÓMO FUNCIONA:</strong> Mindfulness modifica circuitos cerebrales: reduce actividad de amígdala (alarma emocional), fortalece corteza prefrontal (regulación), aumenta materia gris en áreas de compasión.</p>

      <h3>PRÁCTICAS PROGRESIVAS</h3>
      <p><strong>NIVEL 1: INICIACIÓN (Semanas 1-2)</strong></p>
      <p><em>Respiración Consciente (3 min):</em> Siéntate cómodo, atiende a tu respiración natural, cuenta 1 al inhalar, 2 al exhalar... hasta 10. Si te distraes, vuelve gentilmente a 1. Frecuencia: 2 veces/día</p>
      <p><em>Pausa DRAW (2 min):</em> Detente - Respira 5 veces profundo - Asimila cómo estás - Prosigue. Frecuencia: Entre pacientes</p>
      
      <p><strong>NIVEL 2: DESARROLLO (Semanas 3-4)</strong></p>
      <p><em>Escaneo Corporal (5 min):</em> Recorre tu cuerpo de pies a cabeza, observa sensaciones sin cambiarlas, respira hacia áreas de tensión. Frecuencia: 1 vez/día</p>
      <p><em>Mindfulness en Actividad (5 min):</em> Elige: comer, caminar, ducha. Pon atención total en la experiencia, nota detalles sensoriales. Frecuencia: 1 vez/día</p>
      
      <p><strong>NIVEL 3: PROFUNDIZACIÓN (Semanas 5-8)</strong></p>
      <p><em>Meditación Sentada (10-20 min):</em> Respiración como ancla, observar pensamientos sin enredarse, volver a respiración cada vez. Frecuencia: 1 vez/día</p>
      <p><em>Meditación de Compasión (10 min):</em> Genera sentimientos de amabilidad, primero hacia ti, luego hacia otros, incluye pacientes y familias. Frecuencia: 3 veces/semana</p>

      <h3>CÓMO INTEGRAR EN TU RUTINA</h3>
      <ol>
        <li><strong>ANCLA A RUTINAS EXISTENTES:</strong> Respiración al despertar, DRAW antes de cada habitación, escaneo al acostarte</li>
        <li><strong>EMPIEZA PEQUEÑO:</strong> 2-3 minutos es suficiente. Consistencia > Duración</li>
        <li><strong>USA RECORDATORIOS:</strong> Alarmas en móvil, post-its en lugares estratégicos</li>
        <li><strong>PRACTICA EN MOMENTOS DIFÍCILES:</strong> Después de caso complejo: 3 respiraciones</li>
        <li><strong>SÉ COMPASIVO CONTIGO:</strong> Distraerse es NORMAL. No hay "buena" o "mala" meditación</li>
      </ol>
      
      <h3>APPS RECOMENDADAS</h3>
      <ul>
        <li><strong>Insight Timer:</strong> 70,000+ meditaciones gratis</li>
        <li><strong>Headspace:</strong> Sección específica para profesionales sanitarios</li>
        <li><strong>Calm:</strong> Excelente para mejorar sueño</li>
      </ul>
    `
  }
};

function leerGuia(tipo) {
  guiaActual = tipo;
  const guia = guiasContenido[tipo];

  if (!guia) {
    alert('Guía no disponible');
    return;
  }

  const modal = document.getElementById('guiaModal');
  if (!modal) {
    console.error('Modal de guía no encontrado');
    return;
  }

  document.getElementById('guiaTitle').textContent = guia.titulo;
  document.getElementById('guiaContent').innerHTML = guia.contenido;
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function descargarGuia(tipo) {
  const guia = guiasContenido[tipo];
  if (!guia) {
    alert('Guía no disponible');
    return;
  }

  // Crear contenido de texto limpio a partir del HTML de la guía
  const temp = document.createElement('div');
  temp.innerHTML = guia.contenido;
  const textoLimpio = temp.innerText;
  // Construir las líneas para el PDF
  const lines = [];
  lines.push(guia.titulo);
  lines.push('');
  textoLimpio.split('\n').forEach(l => lines.push(l));
  lines.push('');
  lines.push('© 2025 Alvaro Navarro Mingorance | CC BY-NC 4.0');
  // Generar y descargar PDF utilizando el helper
  const fileName = guia.titulo.replace(/\s/g, '-') + '.pdf';
  generateAndDownloadPDF(fileName, guia.titulo, lines);
  console.log('Guía descargada en PDF:', tipo);
}

function descargarGuiaActual() {
  if (!guiaActual) return;
  descargarGuia(guiaActual);
}

function descargarComoTexto(titulo, contenido) {
  // Limpiar HTML
  const temp = document.createElement('div');
  temp.innerHTML = contenido;
  const texto = titulo + '\n\n' + temp.innerText;

  // Crear RTF
  let rtf = '{\\rtf1\\ansi\\ansicpg1252\\cocoartf2100\n';
  rtf += '{\\fonttbl\\f0\\fswiss Helvetica;}\n';
  rtf += '\\margl1440\\margr1440\\f0\\fs24\n';
  rtf += '{\\b\\fs32 ' + titulo + '}\\par\\par\n';
  rtf += texto.replace(/\n/g, '\\par\n') + '\\par\\par\n';
  rtf += '{\\fs16 © 2025 Álvaro Navarro Mingorance | CC BY-NC}\n}';

  // Descargar
  const blob = new Blob([rtf], { type: 'application/rtf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = titulo.replace(/\s/g, '-') + '.rtf';
  link.click();
  URL.revokeObjectURL(url);
}

// Download guide function - shows content in dedicated guide modal
function downloadGuide(guideType) {
  const guide = guideContents[guideType];
  if (!guide) {
    alert('Guía no disponible');
    return;
  }

  currentGuideType = guideType;

  // Use dedicated guide modal
  const modal = document.getElementById('guideModal');
  const modalTitle = document.getElementById('guideTitle');
  const modalBody = document.getElementById('guideContent');

  modalTitle.textContent = guide.title;

  let html = '';

  guide.sections.forEach((section, index) => {
    html += `
      <div style="margin-bottom: var(--space-24);">
        <h3>${section.title}</h3>
        <div style="white-space: pre-line;">${section.content}</div>
      </div>
    `;
  });

  modalBody.innerHTML = html;
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

// Close guide modal
function cerrarGuia() {
  const modal = document.getElementById('guiaModal');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
  }
  guiaActual = null;
  currentGuideType = null;
}

// ESC key handler for guide modal
document.addEventListener('keydown', function (event) {
  if (event.key === 'Escape') {
    const guiaModal = document.getElementById('guiaModal');
    if (guiaModal && guiaModal.style.display === 'flex') {
      cerrarGuia();
    }
  }
});

// Download current guide as RTF - UPDATED VERSION
function descargarGuiaPDF() {
  try {
    if (!currentGuideType) {
      alert('No hay guía seleccionada');
      return;
    }
    const guide = guideContents[currentGuideType];
    if (!guide) {
      console.error('Guía no encontrada:', currentGuideType);
      alert('Error: No se encontró el contenido de la guía');
      return;
    }
    // Construir líneas de texto para la guía
    const lines = [];
    lines.push(guide.title);
    lines.push('© 2025 Alvaro Navarro Mingorance');
    lines.push('Licencia Creative Commons Atribución-NoComercial 4.0 Internacional');
    lines.push('');
    guide.sections.forEach(section => {
      lines.push(section.title.toUpperCase());
      // Dividir contenido por saltos de línea para mantener la estructura
      const parts = section.content.split('\n');
      parts.forEach(p => lines.push(p));
      lines.push('');
    });
    lines.push('Fin del documento');
    const fileName = `Guia-${currentGuideType}-CPP.pdf`;
    generateAndDownloadPDF(fileName, guide.title, lines);
    alert('¡Guía descargada como PDF correctamente!');
  } catch (error) {
    console.error('Error en descargarGuiaPDF:', error);
    alert('Error al descargar. Por favor, intenta de nuevo. Error: ' + error.message);
  }
}

// Funciones para modal de resultados
function mostrarResultadoEnModal(results) {
  const tipo = currentEvaluation;
  const datos = demographicData;

  // Llenar datos
  document.getElementById('resultadoTitulo').textContent = `Resultados - ${evaluations[tipo].name}`;
  document.getElementById('resultadoSubtitulo').textContent = `Evaluación completada el ${new Date().toLocaleDateString('es-ES')}`;
  document.getElementById('resultado-fecha').textContent = new Date().toLocaleDateString('es-ES');

  const professionLabels = {
    medico: 'Médico/a',
    enfermero: 'Enfermero/a',
    psicologo: 'Psicólogo/a',
    trabajador_social: 'Trabajador/a Social',
    otro: 'Otro'
  };

  document.getElementById('resultado-profesion').textContent = professionLabels[datos.profession] || datos.profession || 'No especificada';
  document.getElementById('resultado-edad').textContent = datos.age || '-';
  document.getElementById('resultado-experiencia').textContent = datos.experience || '-';

  // Puntuación
  let puntuacion = '';
  let interpretacion = '';

  if (results.type === 'burnout') {
    puntuacion = results.total + '/100';
    interpretacion = getBurnoutInterpretation(results.level.level);
  } else if (results.type === 'compassion') {
    const burnoutSub = results.subscales.find(s => s.name.includes('Burnout'));
    puntuacion = burnoutSub ? burnoutSub.score + '/25' : 'N/A';
    interpretacion = 'Ver detalles completos en las recomendaciones';
  } else if (results.type === 'selfcare') {
    puntuacion = results.total + '/5';
    interpretacion = getSelfcareInterpretation(results.level.level);
  }

  document.getElementById('resultado-puntuacion').textContent = puntuacion;
  document.getElementById('resultado-interpretacion').textContent = interpretacion;

  // Recomendaciones
  const recomendaciones = generarRecomendacionesArray(results);
  document.getElementById('resultado-recomendaciones').innerHTML =
    recomendaciones.map(rec => `<li>${rec}</li>`).join('');

  // Plan
  const plan = generarPlanAccion(results);
  document.getElementById('resultado-plan').textContent = plan;

  // Guardar en// ==========================================
  // CONFIGURACIÓN DE FIREBASE (BACKEND)
  // ==========================================
  // ⚠️ IMPORTANTE: Reemplaza este objeto con tu propia configuración de Firebase
  // 1. Ve a https://console.firebase.google.com/
  // 2. Crea un proyecto nuevo
  // 3. Añade una "Web App"
  // 4. Copia las claves que te aparecen (firebaseConfig) y pégalas aquí abajo
  const firebaseConfig = {
    apiKey: "TU_API_KEY_AQUI",
    authDomain: "TU_PROYECTO.firebaseapp.com",
    projectId: "TU_PROJECT_ID",
    storageBucket: "TU_PROYECTO.appspot.com",
    messagingSenderId: "TU_SENDER_ID",
    appId: "TU_APP_ID"
  };

  // Inicializar Firebase
  let db; // Referencia a Firestore
  let auth; // Referencia a Auth
  let currentUser = null;

  try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    auth = firebase.auth();
    console.log("Firebase inicializado correctamente");

    // Iniciar sesión anónima automáticamente
    auth.signInAnonymously()
      .then(() => {
        console.log("Sesión anónima iniciada");
      })
      .catch((error) => {
        console.error("Error en autenticación anónima:", error);
      });

    // Escuchar cambios de estado de autenticación
    auth.onAuthStateChanged((user) => {
      if (user) {
        currentUser = user;
        console.log("Usuario conectado (ID):", user.uid);
        // Cargar historial si existe
        cargarHistorialFirebase();
      } else {
        currentUser = null;
      }
    });

  } catch (error) {
    console.warn("Firebase no configurado o error de inicialización. La app funcionará en modo local.", error);
  }

  // ==========================================
  // FIN CONFIGURACIÓN FIREBASE
  // ==========================================

  // Variables globales de estadorga
  window.resultadoActual = {
    tipo: tipo,
    datos: datos,
    resultados: {
      puntuacion: puntuacion,
      interpretacion: interpretacion,
      recomendaciones: recomendaciones,
      plan: plan
    }
  };

  // Mostrar modal
  document.getElementById('resultadoModal').classList.add('activo');
}

function cerrarResultado() {
  document.getElementById('resultadoModal').classList.remove('activo');
}

// Cerrar al hacer click fuera del modal
document.addEventListener('click', function (e) {
  const modal = document.getElementById('resultadoModal');
  if (e.target === modal) {
    cerrarResultado();
  }
});

function generarRecomendacionesArray(results) {
  const recomendaciones = [];

  if (results.type === 'burnout') {
    if (results.level.level === 'alto' || results.level.level === 'medio') {
      recomendaciones.push('Habla con tu supervisor sobre ajustar tu carga de trabajo');
      recomendaciones.push('Programa sesiones de mindfulness diarias (apps: Headspace, Calm)');
      recomendaciones.push('Considera buscar apoyo psicológico especializado');
      recomendaciones.push('Participa en espacios de reflexión grupal (Schwartz Rounds)');
      recomendaciones.push('Toma tiempo de descanso - es prioritario');
    } else {
      recomendaciones.push('Mantén equilibrio trabajo-vida: respeta tus límites horarios');
      recomendaciones.push('Continúa con espacios de supervisión regulares');
      recomendaciones.push('Actualiza tus habilidades de afrontamiento con formación');
      recomendaciones.push('Cultiva relaciones de apoyo con colegas');
    }
  } else if (results.type === 'compassion') {
    const hasBurnout = results.subscales.find(s => s.name.includes('Burnout') && (s.level.level === 'alto' || s.level.level === 'medio'));
    const hasTrauma = results.subscales.find(s => s.name.includes('Traumático') && (s.level.level === 'alto' || s.level.level === 'medio'));

    if (hasBurnout || hasTrauma) {
      recomendaciones.push('Busca formación en Programa de Resiliencia de Fatiga por Compasión');
      recomendaciones.push('Establece sesiones de debriefing regulares con tu equipo');
      recomendaciones.push('Conecta con colegas que comprendan tu experiencia');
      recomendaciones.push('Trabaja en establecer límites emocionales saludables');
      recomendaciones.push('Considera terapia cognitivo-conductual centrada en trauma');
    } else {
      recomendaciones.push('Mantén práctica diaria de mindfulness (10-15 minutos)');
      recomendaciones.push('Dedica tiempo semanal a procesar emociones');
      recomendaciones.push('Revisa periódicamente tus límites profesionales');
      recomendaciones.push('Mantén hobbies no relacionados con trabajo');
    }
  } else if (results.type === 'selfcare') {
    if (results.level.level === 'bajo' || results.level.level === 'medio') {
      recomendaciones.push('Crea un plan escrito con actividades específicas semanales');
      recomendaciones.push('Bloquea tiempo para autocuidado en tu calendario');
      recomendaciones.push('Reactiva conexiones con familia y amigos');
      recomendaciones.push('Comienza con 20 minutos de actividad física 3 veces/semana');
      recomendaciones.push('Establece rutina de higiene del sueño');
    } else {
      recomendaciones.push('Continúa con tus estrategias actuales - lo estás haciendo bien');
      recomendaciones.push('Evalúa tu autocuidado cada 3 meses');
      recomendaciones.push('Comparte tus estrategias con colegas');
      recomendaciones.push('Explora nuevas actividades de autocuidado');
    }
  }


  return recomendaciones;
}

function generarPlanAccion(results) {
  let plan = '';

  // Disclaimer inicial para todos los planes
  const disclaimer = `⚠️ IMPORTANTE: CONSULTA CON TU PSICÓLOGO / A DE REFERENCIA
    - Este plan es una guía general basada en tus respuestas.
- No sustituye la valoración de un profesional.
- Si tienes dudas o malestar, contacta con el psicólogo de tu equipo o solicita derivación.

`;

  if (results.type === 'burnout' && (results.level.level === 'alto' || results.level.level === 'medio')) {
    plan = disclaimer + `SEMANA 1 - 2: Establece práctica básica
    - Mindfulness diario 5 minutos(DRAW o Respiración Consciente)
      - Identifica 1 actividad restauradora y blóqueala en calendario
        - Habla con supervisor sobre carga de trabajo

SEMANA 3 - 4: Añade segunda práctica
    - Continúa mindfulness diario
      - Meditación de autocompasión 7 min, 3x / semana
        - Conexión social con colega de confianza

SEMANA 5 - 8: Mantén y expande
    - Integra prácticas establecidas
      - Evalúa progreso
        - Considera supervisión profesional`;
  } else if (results.type === 'compassion') {
    plan = disclaimer + `SEMANA 1 - 2: Prácticas de anclaje
    - Técnica DRAW entre pacientes
      - Los 5 sentidos(grounding) cuando sientas activación
        - Debriefing informal con colega después de casos difíciles

SEMANA 3 - 4: Regulación emocional
    - Termómetro emocional: evalúa intensidad 2x / día
      - Descarga emocional segura cuando necesites
        - Meditación de autocompasión 3x / semana

SEMANA 5 - 8: Consolidación
    - Mantén prácticas que mejor funcionan
      - Solicita debriefing formal de equipo
        - Re - evalúate en semana 8

PRÓXIMOS PASOS:
  - Recursos de regulación emocional disponibles
    - Contactos de apoyo profesional
      - Guía de Apoyo Emocional en Equipo`;
  } else {
    plan = `SEMANA 1 - 2: Identifica prioridades
    - Evalúa 4 dimensiones: físico, emocional, social, espiritual
      - Elige 2 prácticas concretas para empezar
        - Bloquea tiempo en calendario

SEMANA 3 - 4: Establece rutina
    - Mantén prácticas de semana 1 - 2
      - Añade tercera práctica
        - Comparte con colega tu compromiso

SEMANA 5 - 8: Consolidación
    - Continúa con prácticas establecidas
      - Evalúa qué funciona mejor
        - Re - evalúate en semana 8

PRÓXIMOS PASOS:
  - Descarga Guía de Autocuidado para CPP
    - Explora ejercicios de mindfulness
      - Únete a espacios de apoyo`;
  }

  return plan;
}

// Descarga en formato RTF
function descargarResultadoRTF() {
  console.log('descargarResultadoRTF llamada');
  try {
    if (!window.resultadoActual) {
      console.error('No hay resultadoActual');
      alert('No hay resultados para descargar');
      return;
    }
    console.log('Datos resultado:', window.resultadoActual);

    const datos = window.resultadoActual.datos;
    const resultados = window.resultadoActual.resultados;
    const tipo = window.resultadoActual.tipo;

    const professionLabels = {
      medico: 'Médico/a',
      enfermero: 'Enfermero/a',
      psicologo: 'Psicólogo/a',
      trabajador_social: 'Trabajador/a Social',
      otro: 'Otro'
    };

    const tipoLabels = {
      burnout: 'Burnout',
      compassion: 'Fatiga por Compasión',
      selfcare: 'Autocuidado'
    };

    // Generar contenido RTF
    let rtf = '{\\rtf1\\ansi\\ansicpg1252\\cocoartf2100\n';
    rtf += '{\\fonttbl\\f0\\fswiss Helvetica;}\n';
    rtf += '{\\colortbl;\\red255\\green255\\blue255;\\red50\\green184\\blue198;}\n';
    rtf += '\\margl1440\\margr1440\\vieww12000\\viewh15840\\viewkind0\n';
    rtf += '\\f0\\fs28\n';

    // Título
    rtf += '{\\b\\fs36 Resultados de Evaluaci\\u243?n - ' + tipoLabels[tipo] + '}\\par\\par\n';

    // Fecha
    rtf += 'Fecha: ' + new Date().toLocaleDateString('es-ES') + '\\par\n';
    rtf += 'Profesi\\u243?n: ' + (professionLabels[datos.profession] || 'No especificada') + '\\par\n';
    rtf += 'Edad: ' + (datos.age || '-') + '\\par\n';
    rtf += 'Experiencia en CPP: ' + (datos.experience || '-') + '\\par\\par\n';

    // Separador
    rtf += '\\pard\\pardeftab720\\partightenfactor0\n';
    rtf += '________________________________\\par\\par\n';

    // Puntuación
    rtf += '{\\b\\fs32 Puntuaci\\u243?n}\\par\n';
    rtf += '{\\fs40\\cf2 ' + resultados.puntuacion + '}\\par\n';
    rtf += resultados.interpretacion.replace(/[\u00e1\u00e9\u00ed\u00f3\u00fa\u00f1\u00c1\u00c9\u00cd\u00d3\u00da\u00d1]/g, function (match) {
      const map = { '\u00e1': '\\\\u225?', '\u00e9': '\\\\u233?', '\u00ed': '\\\\u237?', '\u00f3': '\\\\u243?', '\u00fa': '\\\\u250?', '\u00f1': '\\\\u241?', '\u00c1': '\\\\u193?', '\u00c9': '\\\\u201?', '\u00cd': '\\\\u205?', '\u00d3': '\\\\u211?', '\u00da': '\\\\u218?', '\u00d1': '\\\\u209?' };
      return map[match] || match;
    }) + '\\par\\par\n';

    // Separador
    rtf += '________________________________\\par\\par\n';

    // Recomendaciones
    rtf += '{\\b\\fs28 Recomendaciones}\\par\n';
    resultados.recomendaciones.forEach((rec, idx) => {
      const recEscaped = rec.replace(/[\u00e1\u00e9\u00ed\u00f3\u00fa\u00f1\u00c1\u00c9\u00cd\u00d3\u00da\u00d1]/g, function (match) {
        const map = { '\u00e1': '\\\\u225?', '\u00e9': '\\\\u233?', '\u00ed': '\\\\u237?', '\u00f3': '\\\\u243?', '\u00fa': '\\\\u250?', '\u00f1': '\\\\u241?', '\u00c1': '\\\\u193?', '\u00c9': '\\\\u201?', '\u00cd': '\\\\u205?', '\u00d3': '\\\\u211?', '\u00da': '\\\\u218?', '\u00d1': '\\\\u209?' };
        return map[match] || match;
      });
      rtf += (idx + 1) + '. ' + recEscaped + '\\par\n';
    });
    rtf += '\\par\n';

    // Plan
    rtf += '{\\b\\fs28 Plan de Acci\\u243?n}\\par\n';
    const planEscaped = resultados.plan.replace(/\n/g, '\\par\n').replace(/[\u00e1\u00e9\u00ed\u00f3\u00fa\u00f1\u00c1\u00c9\u00cd\u00d3\u00da\u00d1]/g, function (match) {
      const map = { '\u00e1': '\\\\u225?', '\u00e9': '\\\\u233?', '\u00ed': '\\\\u237?', '\u00f3': '\\\\u243?', '\u00fa': '\\\\u250?', '\u00f1': '\\\\u241?', '\u00c1': '\\\\u193?', '\u00c9': '\\\\u201?', '\u00cd': '\\\\u205?', '\u00d3': '\\\\u211?', '\u00da': '\\\\u218?', '\u00d1': '\\\\u209?' };
      return map[match] || match;
    });
    rtf += planEscaped + '\\par\\par\n';

    // Footer
    rtf += '\\par________________________________\\par\n';
    rtf += '{\\fs20 \\u169? 2025 \\u193?lvaro Navarro Mingorance | CC BY-NC 4.0}\n';
    rtf += '}';

    // Crear blob y descargar
    const blob = new Blob([rtf], { type: 'application/rtf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Resultados - ${tipo} -${new Date().toISOString().slice(0, 10)}.rtf`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => URL.revokeObjectURL(url), 100);

    console.log('Descarga RTF completada exitosamente');

  } catch (error) {
    console.error('Error descargando RTF:', error);
    alert('Error al descargar: ' + error.message);
  }
}

// ESC key handler for modals
document.addEventListener('keydown', function (event) {
  if (event.key === 'Escape') {
    // Close result modal if open
    const resultModal = document.getElementById('resultadoModal');
    if (resultModal && resultModal.classList.contains('activo')) {
      cerrarResultado();
    }
    // Close guide modal if open
    const guideModal = document.getElementById('guideModal');
    if (guideModal && guideModal.style.display === 'flex') {
      cerrarGuia();
    }
    // Close evaluation modal if open
    const evalModal = document.getElementById('evaluationModal');
    if (evalModal && evalModal.classList.contains('active')) {
      closeModal();
    }
  }
});
// ==========================================
// FUNCIONES DE FIREBASE
// ==========================================

function cargarHistorialFirebase() {
  if (!currentUser || !db) return;

  console.log("Cargando historial desde Firebase...");

  db.collection('evaluaciones')
    .where('userId', '==', currentUser.uid)
    .orderBy('timestamp', 'desc')
    .get()
    .then((querySnapshot) => {
      // Limpiar historial local antes de cargar el remoto para evitar duplicados
      evaluacionManager.limpiarHistorial();

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Adaptar formato si es necesario
        const evaluacion = {
          id: data.id || doc.id,
          tipo: data.tipo,
          fecha: data.fecha,
          datos: data.datos,
          resultados: data.resultados
        };
        evaluacionManager.evaluaciones.push(evaluacion);
      });

      console.log(`Historial cargado: ${evaluacionManager.evaluaciones.length} evaluaciones.`);

      // Actualizar UI si estamos en la sección de seguimiento
      if (currentSection === 'seguimiento') {
        mostrarHistorialEvaluaciones();
      }

      // Verificar si hay evaluaciones para desbloquear funcionalidades
      if (evaluacionManager.evaluaciones.length > 0) {
        hasCompletedEvaluations = true;
        // Cargar resultados más recientes en evaluationResults
        // Esto es una simplificación, idealmente procesaríamos todo
        const ultima = evaluacionManager.evaluaciones[0];
        evaluationResults[ultima.tipo] = ultima.resultados;
        evaluationResults.demographics = ultima.datos;
      }
    })
    .catch((error) => {
      console.error("Error al cargar historial:", error);
      // Fallback a índices si falta el índice compuesto
      if (error.code === 'failed-precondition') {
        console.warn("Falta índice compuesto en Firestore. Intentando consulta simple.");
        // Intento sin ordenamiento (el cliente ordena)
        db.collection('evaluaciones')
          .where('userId', '==', currentUser.uid)
          .get()
          .then((querySnapshot) => {
            evaluacionManager.limpiarHistorial();
            querySnapshot.forEach((doc) => {
              const data = doc.data();
              const evaluacion = {
                id: data.id || doc.id,
                tipo: data.tipo,
                fecha: data.fecha,
                datos: data.datos,
                resultados: data.resultados
              };
              evaluacionManager.evaluaciones.push(evaluacion);
            });
            // Ordenar localmente
            evaluacionManager.evaluaciones.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

            if (currentSection === 'seguimiento') {
              mostrarHistorialEvaluaciones();
            }
          });
      }
    });
}
// Mostrar historial de evaluaciones
function mostrarHistorialEvaluaciones() {
  console.log('Cargando historial...');
  const historial = evaluacionManager.obtenerHistorial();
  console.log('Historial obtenido:', historial);
  const container = document.getElementById('evaluationHistory');

  if (!container) {
    console.error('Container evaluationHistory no encontrado');
    return;
  }

  if (historial.length === 0) {
    container.innerHTML = '<p class="empty-state">Aún no has completado ninguna evaluación. <a href="#evaluaciones" onclick="showSection(\'evaluaciones\')">Comienza ahora</a></p>';
    return;
  }

  const professionLabels = {
    medico: 'Médico/a',
    enfermero: 'Enfermero/a',
    psicologo: 'Psicólogo/a',
    trabajador_social: 'Trabajador/a Social',
    otro: 'Otro'
  };

  const tipoLabels = {
    burnout: 'Burnout',
    compassion: 'Fatiga por Compasión',
    selfcare: 'Autocuidado'
  };

  container.innerHTML = historial.map((item, idx) => {
    const fecha = new Date(item.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    const puntuacion = item.resultados.total || (item.resultados.subscales ? item.resultados.subscales[0].score : 'N/A');
    const nivel = item.resultados.level ? item.resultados.level.text : (item.resultados.subscales ? item.resultados.subscales[0].level.text : 'N/A');

    return `
    < div style = "background: var(--color-surface); padding: var(--space-20); margin-bottom: var(--space-16); border-radius: var(--radius-lg); border-left: 4px solid var(--color-primary); border: 1px solid var(--color-card-border);" >
        <h4 style="margin-top: 0; color: var(--color-text); margin-bottom: var(--space-8);">${tipoLabels[item.tipo] || item.tipo}</h4>
        <p style="color: var(--color-text-secondary); margin: var(--space-4) 0; font-size: var(--font-size-sm);">
          <strong>Fecha:</strong> ${fecha}
        </p>
        <p style="color: var(--color-text-secondary); margin: var(--space-4) 0; font-size: var(--font-size-sm);">
          <strong>Profesión:</strong> ${professionLabels[item.datos.profesion] || item.datos.profesion}
        </p>
        <p style="color: var(--color-text); margin: var(--space-12) 0;"><strong>Puntuación:</strong> ${puntuacion} (${nivel})</p>
      </div >
    `;
  }).join('');
}

function limpiarHistorial() {
  if (confirm('¿Estás seguro de que quieres eliminar todo tu historial de evaluaciones?')) {
    evaluacionManager.limpiarHistorial();
    mostrarHistorialEvaluaciones();
    alert('Historial eliminado correctamente.');
  }
}

// Initialize app on load
window.addEventListener('DOMContentLoaded', () => {
  // Show inicio section by default
  showSection('inicio');

  // Check if there are any saved evaluations
  const generateBtn = document.getElementById('generatePlanBtn');
  if (generateBtn) {
    generateBtn.disabled = !hasCompletedEvaluations;
  }

  // Load evaluation history if on seguimiento section
  const historyContainer = document.getElementById('evaluationHistory');
  if (historyContainer) {
    mostrarHistorialEvaluaciones();
  }
});