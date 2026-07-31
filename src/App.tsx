import "./App.css";
import Sidebar from "./components/Sidebar";
import GraphView from "./components/GraphView";
import useStoredMods from "./hooks/useStoredMods";

function App() {
  const {mods, addMods, removeMods, toggleComplete, refreshMod} = useStoredMods();
  return ( <div className="app">
    <Sidebar mods={mods} onAdd={addMods} onRemove={removeMods} 
          onToggle={toggleComplete} onRefresh={refreshMod} />
      <GraphView mods={mods} onToggle={toggleComplete}/>
    </div>
  );
}

export default App;
