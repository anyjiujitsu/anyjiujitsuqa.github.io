import { loadCSV } from "./data.js";
import { state } from "./state.js";
import { applyFilters } from "./filters.js";
import { renderGroups } from "./render.js";

let allRows = [];

async function init(){
  const status = document.getElementById("status");
  const root = document.getElementById("groupsRoot");

  // Search elements (must exist in index.html)
  const searchInput = document.getElementById("searchInput");
  const searchClear = document.getElementById("searchClear");

  function render(){
    const filtered = applyFilters(allRows, state);
    renderGroups(root, filtered);
    status.textContent = `${filtered.length} gyms`;
  }

  try{
    status.textContent = "Loading…";
    allRows = await loadCSV("data/directory.csv");

    // ✅ Wire search -> state -> render
    if (searchInput) {
      searchInput.addEventListener("input", () => {
        state.search = searchInput.value || "";
        render();
      });
    }

    if (searchClear) {
      searchClear.addEventListener("click", () => {
        if (!searchInput) return;
        searchInput.value = "";
        state.search = "";
        searchInput.focus();
        render();
      });
    }

    // initial render
    render();

  } catch(err){
    console.error(err);
    status.textContent = "Failed to load data";
  }
}

init();
