import { useState } from "react";
import "./App.css";
import Sidebar from "./components/Sidebar";
import GraphView from "./components/GraphView";
import PresetsModal from "./components/PresetsModal";
import FoundationModal from "./components/FoundationModal";
import CourseListModal from "./components/CourseListModal";
import { CS_MATH_AND_SCIENCE_COURSES } from "./data/csMathAndScience";
import Header from "./components/Header";
import useStoredMods from "./hooks/useStoredMods";

function App() {
  const {mods, addMods, removeMods, toggleComplete, refreshMod} = useStoredMods();
  const [showPresets, setShowPresets] = useState(false);
  const [showFoundations, setShowFoundations] = useState(false);
  const [showMathAndScience, setShowMathAndScience] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="app-shell">
      <Header />
      <div className="app">
        <button
          className="sidebar-toggle"
          style={{ left: sidebarCollapsed ? "12px" : "272px" }}
          onClick={() => setSidebarCollapsed(prev => !prev)}
        >
          {sidebarCollapsed ? "☰" : "✕"}
        </button>
        <Sidebar
          mods={mods}
          onAdd={addMods}
          onRemove={removeMods}
          onToggle={toggleComplete}
          onRefresh={refreshMod}
          onOpenPresets={() => setShowPresets(true)}
          onOpenFoundations={() => setShowFoundations(true)}
          onOpenMathAndScience={() => setShowMathAndScience(true)}
          collapsed={sidebarCollapsed}
        />
        <GraphView mods={mods} onToggle={toggleComplete} onAdd={addMods} onRemove={removeMods}/>
        {showPresets && (
          <PresetsModal
            mods={mods}
            onAdd={addMods}
            onRemove={removeMods}
            onClose={() => setShowPresets(false)}
          />
        )}
        {showFoundations && (
          <FoundationModal
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
