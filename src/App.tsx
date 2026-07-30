import { useState } from "react";
import "./App.css";
import Sidebar from "./components/Sidebar";
import GraphView from "./components/GraphView";


function App() {
  return (
    <div className="app">
      <Sidebar/>
      <GraphView/>
    </div>
  );
}

export default App;
