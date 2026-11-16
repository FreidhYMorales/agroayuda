// web/src/features/form/copy.ts
// Form texts in Spanish (Guatemala, "usted") and their English version.
import type { Lang } from "../../lib/urlState";

const ES = {
  back: "← Mapa",
  step: "Paso 2 de 3",
  title: "Cuéntenos de su siembra",
  primeraTitle: "¿Qué siembra en primera?",
  postreraTitle: "¿Y en postrera?",
  prioritiesTitle: "¿Qué es lo más importante para usted?",
  scaleHint: "1 = poco importante · 5 = muy importante",
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
  primeraTitle: "What do you plant in the first season (primera)?",
  postreraTitle: "And in the second season (postrera)?",
  prioritiesTitle: "What matters most to you?",
  scaleHint: "1 = not important · 5 = very important",
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
