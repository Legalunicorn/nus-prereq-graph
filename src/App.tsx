import { useState } from "react";
import "./App.css";
import Sidebar from "./components/Sidebar";
import GraphView from "./components/GraphView";
import PresetsModal from "./components/PresetsModal";
import Header from "./components/Header";
import useStoredMods from "./hooks/useStoredMods";

function App() {
  const {mods, addMods, removeMods, toggleComplete, refreshMod} = useStoredMods();
  const [showPresets, setShowPresets] = useState(false);
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
      </div>
    </div>
  );
}

export default App;