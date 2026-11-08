import { lazy, Suspense, useRef, useState } from "react";
import "./App.css";
import Sidebar from "./components/Sidebar";
import { CS_FOUNDATION_COURSES } from "./data/csFoundation";
import { CS_MATH_AND_SCIENCE_COURSES } from "./data/csMathAndScience";
import Header from "./components/Header";
import SharedPlanBanner from "./components/SharedPlanBanner";
import SidebarHandle from "./components/SidebarHandle";
import UndoToast from "./components/UndoToast";
import usePlanEstimate from "./hooks/usePlanEstimate";
import useSharedPlan from "./hooks/useSharedPlan";
import useStoredMods from "./hooks/useStoredMods";
import useTheme from "./hooks/useTheme";
import useUndoableRemoval from "./hooks/useUndoableRemoval";
import { PHONE_WIDTH } from "./constants";

const GraphView = lazy(() => import("./components/GraphView"));
const DetailsPanel = lazy(() => import("./components/DetailsPanel"));
const PresetsModal = lazy(() => import("./components/PresetsModal"));
const CourseListModal = lazy(() => import("./components/CourseListModal"));

const noEstimate = () => null;

function App() {
  const {mods, addMods, setStatus, setPlannedTerm, replaceMods} = useStoredMods();
  const removal = useUndoableRemoval(mods, replaceMods);
  const plan = usePlanEstimate(mods);
  const sharedPlan = useSharedPlan(mods.length, replaceMods);
  const [showPresets, setShowPresets] = useState(false);
  const [showFoundations, setShowFoundations] = useState(false);
  const [showMathAndScience, setShowMathAndScience] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => window.matchMedia(PHONE_WIDTH).matches);
  const { theme, toggleTheme } = useTheme();
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const previewChainRef = useRef<((code: string | null) => void) | null>(null);

  return (
    <div className="app-shell">
      <Header mods={mods} theme={theme} onToggleTheme={toggleTheme} />
      <div className="app">
        {sharedPlan.pendingCount > 0 && (
          <SharedPlanBanner
            count={sharedPlan.pendingCount}
            hasError={sharedPlan.hasError}
            onAccept={sharedPlan.accept}
            onDismiss={sharedPlan.dismiss}
          />
        )}
        <button
          className={isSidebarCollapsed ? "sidebar-toggle" : "sidebar-toggle open"}
          onClick={() => setIsSidebarCollapsed(prev => !prev)}
          aria-label={isSidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
        >
          <span className="sidebar-toggle-icon" aria-hidden="true">{isSidebarCollapsed ? "›" : "‹"}</span>
          <span className="sidebar-toggle-label">Modules</span>
        </button>
        <Sidebar
          mods={mods}
          onAdd={addMods}
          onRemove={removal.remove}
          onClear={removal.clear}
          onStatusChange={setStatus}
          onSelect={setSelectedCode}
          onHover={code => previewChainRef.current?.(code)}
          onOpenPresets={() => setShowPresets(true)}
          onOpenFoundations={() => setShowFoundations(true)}
          onOpenMathAndScience={() => setShowMathAndScience(true)}
          isCollapsed={isSidebarCollapsed}
          plan={plan}
        />
        {!isSidebarCollapsed && <SidebarHandle />}
        <Suspense fallback={<div className="graph-loading" />}>
          <GraphView mods={mods} theme={theme} longestPaths={plan.longestPaths} minSemestersOf={plan.estimate ?? noEstimate} explainSemesters={plan.explain ?? noEstimate} selectedCode={selectedCode} previewChainRef={previewChainRef} onSelect={setSelectedCode} onAdd={addMods} onRemove={removal.remove} onStatusChange={setStatus} />
        </Suspense>
        <Suspense fallback={null}>
        {selectedCode && (
          <DetailsPanel
            key={selectedCode}
            code={selectedCode}
            mods={mods}
            minSemesters={plan.estimate?.(selectedCode) ?? null}
            semestersHint={plan.explain?.(selectedCode)}
            onClose={() => setSelectedCode(null)}
            onSelect={setSelectedCode}
            onAdd={addMods}
            onRemove={removal.remove}
            onStatusChange={setStatus}
            onPlanTerm={setPlannedTerm}
          />
        )}
        {showPresets && (
          <PresetsModal
            mods={mods}
            onAdd={addMods}
            onRemove={removal.remove}
            onClose={() => setShowPresets(false)}
          />
        )}
        {showFoundations && (
          <CourseListModal
            title="CS Foundations"
            courses={CS_FOUNDATION_COURSES}
            mods={mods}
            onAdd={addMods}
            onRemove={removal.remove}
            onClose={() => setShowFoundations(false)}
          />
        )}
        {showMathAndScience && (
          <CourseListModal
            title="CS Mathematics and Sciences"
            courses={CS_MATH_AND_SCIENCE_COURSES}
            mods={mods}
            onAdd={addMods}
            onRemove={removal.remove}
            onClose={() => setShowMathAndScience(false)}
          />
        )}
        </Suspense>
        {removal.removed.length > 0 && (
          <UndoToast removed={removal.removed} onUndo={removal.undo} onDismiss={removal.dismiss} />
        )}
      </div>
    </div>
  );
}

export default App;
