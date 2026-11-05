import { useState } from "react";
import "./App.css";
import Sidebar from "./components/Sidebar";
import GraphView from "./components/GraphView";
import PresetsModal from "./components/PresetsModal";
import CourseListModal from "./components/CourseListModal";
import { CS_FOUNDATION_COURSES } from "./data/csFoundation";
import { CS_MATH_AND_SCIENCE_COURSES } from "./data/csMathAndScience";
import Header from "./components/Header";
import usePlanEstimate from "./hooks/usePlanEstimate";
import useStoredMods from "./hooks/useStoredMods";
import useTheme from "./hooks/useTheme";
import { PHONE_WIDTH } from "./constants";

function App() {
  const {mods, addMods, removeMods, toggleComplete} = useStoredMods();
  const plan = usePlanEstimate(mods);
  const [showPresets, setShowPresets] = useState(false);
  const [showFoundations, setShowFoundations] = useState(false);
  const [showMathAndScience, setShowMathAndScience] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => window.matchMedia(PHONE_WIDTH).matches);
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="app-shell">
      <Header theme={theme} onToggleTheme={toggleTheme} />
      <div className="app">
        <button
          className="sidebar-toggle"
          style={{ left: isSidebarCollapsed ? "12px" : "272px" }}
          onClick={() => setIsSidebarCollapsed(prev => !prev)}
          aria-label={isSidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
        >
          {isSidebarCollapsed ? "›" : "‹"}
        </button>
        <Sidebar
          mods={mods}
          onAdd={addMods}
          onRemove={removeMods}
          onToggle={toggleComplete}
          onOpenPresets={() => setShowPresets(true)}
          onOpenFoundations={() => setShowFoundations(true)}
          onOpenMathAndScience={() => setShowMathAndScience(true)}
          isCollapsed={isSidebarCollapsed}
          plan={plan}
        />
        <GraphView mods={mods} theme={theme} estimate={plan.estimate} onToggle={toggleComplete} onAdd={addMods} onRemove={removeMods}/>
        {showPresets && (
          <PresetsModal
            mods={mods}
            onAdd={addMods}
            onRemove={removeMods}
            onClose={() => setShowPresets(false)}
          />
        )}
        {showFoundations && (
          <CourseListModal
            title="CS Foundations"
            courses={CS_FOUNDATION_COURSES}
            mods={mods}
            onAdd={addMods}
            onRemove={removeMods}
            onClose={() => setShowFoundations(false)}
          />
        )}
        {showMathAndScience && (
          <CourseListModal
            title="CS Mathematics and Sciences"
            courses={CS_MATH_AND_SCIENCE_COURSES}
            mods={mods}
            onAdd={addMods}
            onRemove={removeMods}
            onClose={() => setShowMathAndScience(false)}
          />
        )}
      </div>
    </div>
  );
}

export default App;
