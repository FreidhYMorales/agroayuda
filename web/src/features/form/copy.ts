// web/src/features/form/copy.ts
// Form texts in Spanish (Guatemala, "usted") and their English version.
import type { Lang } from "../../lib/urlState";

const ES = {
  back: "← Su parcela",
  primeraTitle: "¿Qué siembra en primera?",
  postreraTitle: "¿Y en postrera?",
  prioritiesTitle: "¿Qué es lo más importante para usted?",
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
  back: "← Your plot",
  primeraTitle: "What do you plant in the first season (primera)?",
  postreraTitle: "And in the second season (postrera)?",
  prioritiesTitle: "What matters most to you?",
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
