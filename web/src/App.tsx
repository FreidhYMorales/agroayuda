// web/src/App.tsx
import { Component, type ReactNode } from "react";
import { MAP_COPY } from "./features/map/copy";
import { MapScreen, type MapSelection } from "./features/map/MapScreen";
import { useDemoPlaces } from "./features/map/useDemoPlaces";
import { type SiteState, useSite } from "./features/map/useSite";
import { RisksScreen, type RisksView } from "./features/risks/RisksScreen";
import { useAppState } from "./lib/urlState";

// Top-level boundary: any crash while rendering shows a retry button instead
// of a blank page. The point and the step live in the URL, so a retry
// remounts the screens and picks them up again.
class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  retry = () => {
    this.setState({ failed: false });
  };

  render() {
    if (this.state.failed) {
      // Touch target of at least 44 px.
      return (
        <button type="button" style={{ minHeight: 44, minWidth: 44 }} onClick={this.retry}>
          {MAP_COPY.retry}
        </button>
      );
    }
    return this.props.children;
  }
}

function toRisksView(site: SiteState): RisksView {
  switch (site.status) {
    case "ready":
      return { status: "ready", risks: site.site.risks };
    case "error":
      return { status: "error" };
    default:
      // "empty" cannot happen on this step (a point is required), so it is
      // shown like loading.
      return { status: "loading" };
  }
}

function Screens() {
  const [state, setState] = useAppState();
  // One request shared by the map and the risks screen.
  const { state: site, retry } = useSite(state.lat, state.lon);
  const places = useDemoPlaces();

  // Every step after the map needs a point; without one, the map is shown.
  const hasPoint = state.lat !== undefined && state.lon !== undefined;
  const step = hasPoint ? state.step : "map";

  if (step === "risks") {
    return (
      <RisksScreen
        view={toRisksView(site)}
        onClose={() => setState({ step: "map" })}
        onRetry={retry}
        onContinue={() => setState({ step: "form" })}
      />
    );
  }

  // Placeholders until package 04 delivers FormScreen and ComparisonScreen.
  if (step === "form") return <div data-testid="form-placeholder" />;
  if (step === "results") return <div data-testid="results-placeholder" />;

  return (
    <MapScreen
      site={site}
      placeId={state.place}
      places={places}
      // The place key is always present, so a point without a place clears the old one.
      onSelectPoint={(selection: MapSelection) => setState(selection)}
      onRetry={retry}
      onViewRisks={() => setState({ step: "risks" })}
      onViewRecommendations={() => setState({ step: "form" })}
    />
  );
}

export function App() {
  return (
    <main>
      <ErrorBoundary>
        <Screens />
      </ErrorBoundary>
    </main>
  );
}
