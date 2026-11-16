// web/src/features/form/copy.ts
// Form texts in Spanish (Guatemala, "usted") and their English version.
import type { Lang } from "../../lib/urlState";

const ES = {
  back: "← Mapa",
  step: "Paso 2 de 3",
  title: "Cuéntenos de su siembra",
  // Local season names, with when they are planted (docs/spec.md, season calendar).
  primeraTitle: "¿Qué siembra en primera (siembra de mayo)?",
  postreraTitle: "¿Y en postrera (siembra de agosto a septiembre)?",
  prioritiesTitle: "¿Qué es lo más importante para usted?",
  scaleHint: "1 = poco importante · 5 = muy importante",
  // What each criterion scores (docs/spec.md, Scoring v1), in plain words.
  info: {
    open: "¿Qué significa cada prioridad?",
    lines: [
      "💧 Ahorrar agua: cultivos que necesitan poca agua.",
      "🟫 Cuidar suelo: cultivos que abonan la tierra y la cubren; dejarla sin cultivo mucho tiempo la daña.",
      "💰 Ganar más: cultivos con mejor venta en el mercado.",
      "🛡 Menos riesgo: cultivos que aguantan la sequía y la canícula.",
    ],
    howUsed: "Toque 5 en lo que más le importa. Con esto ordenamos las opciones.",
    close: "Cerrar",
  },
  priorities: {
    water: "Ahorrar agua",
    soil: "Cuidar suelo",
    income: "Ganar más",
    risk: "Menos riesgo",
  },
  irrigationTitle: "¿Tiene riego?",
  yes: "Sí",
  no: "No",
  submit: "Comparar opciones →",
  catalogError: "No pudimos cargar los cultivos.",
  retry: "Intentar de nuevo",
  loading: "Cargando los cultivos…",
};

// Primera and postrera are local season names, so English keeps them in brackets.
const EN: typeof ES = {
  back: "← Map",
  step: "Step 2 of 3",
  title: "Tell us about your planting",
  primeraTitle: "What do you plant in the first season (primera, planted in May)?",
  postreraTitle: "And in the second season (postrera, planted in August to September)?",
  prioritiesTitle: "What matters most to you?",
  scaleHint: "1 = not important · 5 = very important",
  info: {
    open: "What does each priority mean?",
    lines: [
      "💧 Save water: crops that need little water.",
      "🟫 Care for the soil: crops that feed and cover the soil; leaving it bare for long harms it.",
      "💰 Earn more: crops that sell better at the market.",
      "🛡 Less risk: crops that withstand drought and the canícula.",
    ],
    howUsed: "Tap 5 on what matters most to you. We use this to rank the options.",
    close: "Close",
  },
  priorities: {
    water: "Save water",
    soil: "Care for the soil",
    income: "Earn more",
    risk: "Less risk",
  },
  irrigationTitle: "Do you have irrigation?",
  yes: "Yes",
  no: "No",
  submit: "Compare options →",
  catalogError: "We could not load the crops.",
  retry: "Try again",
  loading: "Loading the crops…",
};

export function formCopy(lang: Lang): typeof ES {
  return lang === "en" ? EN : ES;
}
