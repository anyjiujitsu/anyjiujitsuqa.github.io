import { loadCSV } from "./data.js";
import { state } from "./state.js";
import { applyFilters } from "./filters.js";
import { renderGroups } from "./render.js";

let allRows = [];

async function init(){
  const status = document.getElementById("status");
  const root = document.getElementById("groupsRoot");

  try{
    status.textContent = "Loading…";

    // 🔴 THIS IS THE LINE THAT WAS LIKELY MISSING
    allRows = await loadCSV("data/directory.csv");

    const filtered = applyFilters(allRows, state);
    renderGroups(root, filtered);

    status.textContent = `${filtered.length} gyms`;
  } catch(err){
    console.error(err);
    status.textContent = "Failed to load data";
  }
}

init();
