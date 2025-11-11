function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  Object.entries(props).forEach(([k, v]) => {
    if (k === "className") node.className = v;
    else if (k === "text") node.textContent = v;
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v);
  });
  children.flat().forEach(ch => {
    if (ch == null) return;
    if (typeof ch === "string") node.appendChild(document.createTextNode(ch));
    else node.appendChild(ch);
  });
  return node;
}

(function attachCss() {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "style.css";
  document.head.appendChild(link);
})();

let tasks = [];
const STORAGE_KEY = "todo-list-v1";
let booted = false;

const app = el("div", { className: "app" });

const header = el("header", { className: "topbar" },
  el("h1", { text: "ToDo-лист" })
);

const titleInput = el("input", { type: "text", placeholder: "Новая задача", required: "true" });
const dateInput  = el("input", { type: "date" });
const addBtn     = el("button", { type: "button", className: "btn btn-primary", text: "Добавить" });

const addForm = el("form", { className: "add-form" },
  el("label", {}, titleInput),
  el("label", {}, dateInput),
  addBtn
);

const searchInput = el("input", { type: "search", placeholder: "Поиск по названию" });
const filterSel   = el("select", {},
  el("option", { value: "all",   text: "Все" }),
  el("option", { value: "open",  text: "Невыполненные" }),
  el("option", { value: "done",  text: "Выполненные" }),
);
const sortSel = el("select", {},
  el("option", { value: "manual",       text: "Ручной порядок" }),
  el("option", { value: "created-asc",  text: "Сначала старые" }),
  el("option", { value: "created-desc", text: "Сначала новые" }),
  el("option", { value: "date-asc",     text: "По дате ↑" }),
  el("option", { value: "date-desc",    text: "По дате ↓" }),
);
sortSel.value = "manual";

const controls = el("section", { className: "controls" },
  el("div", { className: "controls-row" }, searchInput, filterSel, sortSel)
);

const list = el("ul", { className: "task-list" });

app.append(header, addForm, controls, list);
document.body.appendChild(app);

function newId() {
  return String(Date.now()) + "-" + Math.random().toString(16).slice(2);
}

function createTask(title, dateStr) {
  return {
    id: newId(),
    title: title.trim(),
    date: dateStr || "",
    done: false,
    createdAt: Date.now(),
    order: tasks.length
  };
}

function taskItemView(task) {
  const li = el("li", { className: "task-item", draggable: "true", "data-id": task.id });

  const left = el("div", { className: "t-left" });
  const cb   = el("input", { type: "checkbox", draggable: "false" });
  cb.checked = task.done;

  const title = el("span", { className: "t-title", text: task.title });
  const date  = el("time", { className: "t-date", datetime: task.date, text: task.date ? task.date : "" });

  const right = el("div", { className: "t-right" });
  const editBtn = el("button", { className: "btn btn-ghost", text: "Ред.", draggable: "false" }); 
  const delBtn  = el("button", { className: "btn btn-danger", text: "Удалить", draggable: "false" }); 

  const textBox = el("div", { className: "t-text" }, title, date);
  left.append(cb, textBox);
  right.append(editBtn, delBtn);
  if (task.done) li.classList.add("is-done");
  li.append(left, right);
  return li;
}


function clearNode(node) { while (node.firstChild) node.removeChild(node.firstChild); }

function render() {
  clearNode(list);
  getFilteredSortedTasks().forEach(t => list.appendChild(taskItemView(t)));
  if (booted) saveTasks();
}

addForm.addEventListener("submit", (e) => e.preventDefault());
addBtn.addEventListener("click", () => {
  const t = titleInput.value.trim();
  if (!t) return;
  tasks.push(createTask(t, dateInput.value));
  titleInput.value = "";
  dateInput.value = "";
  render();
});

render();

list.addEventListener("click", (e) => {
  const li = e.target.closest("li.task-item");
  if (!li) return;
  const id = li.getAttribute("data-id");
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  if (e.target.matches("button.btn-danger")) {
    tasks = tasks.filter(t => t.id !== id);
    render();
  }
  if (e.target.matches("input[type=checkbox]")) {
    task.done = e.target.checked;
    render();
  }
});

list.addEventListener("click", (e) => {
  const li = e.target.closest("li.task-item");
  if (!li) return;
  const id = li.getAttribute("data-id");
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  if (e.target.matches("button.btn-ghost")) {
    const titleSpan = li.querySelector(".t-title");
    const dateEl    = li.querySelector(".t-date");

    const titleInputEdit = el("input", { type: "text" });
    titleInputEdit.value = task.title;

    const dateInputEdit = el("input", { type: "date" });
    dateInputEdit.value = task.date || "";

    const saveBtn = el("button", { className: "btn btn-primary", text: "Сохранить" });
    const cancelBtn = el("button", { className: "btn btn-ghost", text: "Отмена" });

    const textBox = titleSpan.parentElement;
    clearNode(textBox);
    textBox.append(titleInputEdit, dateInputEdit);

    const right = li.querySelector(".t-right");
    clearNode(right);
    right.append(saveBtn, cancelBtn);

    saveBtn.addEventListener("click", () => {
      task.title = titleInputEdit.value.trim() || task.title;
      task.date  = dateInputEdit.value || "";
      render();
    });
    cancelBtn.addEventListener("click", render);
  }
});

function getFilteredSortedTasks() {
  const q = searchInput.value.trim().toLowerCase();
  const filter = filterSel.value;
  const sort = sortSel.value;

  let arr = tasks.filter(t => (q ? t.title.toLowerCase().includes(q) : true));
  if (filter === "open") arr = arr.filter(t => !t.done);
  if (filter === "done") arr = arr.filter(t =>  t.done);

  const byDate    = (a, b) => (a.date || "").localeCompare(b.date || "");
  const byCreated = (a, b) => a.createdAt - b.createdAt;
  const byManual  = (a, b) => (a.order ?? 0) - (b.order ?? 0);

  if (sort === "manual")        arr.sort(byManual);
  else if (sort === "created-asc")  arr.sort(byCreated);
  else if (sort === "created-desc") arr.sort((a,b)=>byCreated(b,a));
  else if (sort === "date-asc")     arr.sort(byDate);
  else if (sort === "date-desc")    arr.sort((a,b)=>byDate(b,a));

  return arr;
}


[searchInput, filterSel, sortSel].forEach(ctrl => {
  ctrl.addEventListener("input", render);
  ctrl.addEventListener("change", render);
});

function saveTasks() {
  try {
    const plain = tasks.map(t => ({
      id: t.id, title: t.title, date: t.date, done: !!t.done,
      createdAt: Number(t.createdAt) || Date.now(),
      order: Number(t.order) || 0
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plain));
  } catch (e) {
    console.warn("Не удалось сохранить задачи:", e);
  }
}

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) { tasks = []; return; }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) { tasks = []; return; }
    tasks = parsed.map((t, i) => ({
      id: String(t.id || `${Date.now()}-${i}`),
      title: String(t.title || "").trim(),
      date: t.date ? String(t.date) : "",
      done: !!t.done,
      createdAt: Number(t.createdAt) || Date.now(),
      order: Number(t.order ?? i)
    }));
  } catch (e) {
    console.warn("Не удалось загрузить задачи:", e);
    tasks = [];
  }
}


let dragId = null;

list.addEventListener("dragstart", (e) => {
  const li = e.target.closest("li.task-item");
  if (!li) return;
  dragId = li.dataset.id;
  e.dataTransfer.effectAllowed = "move";
  e.dataTransfer.setData("text/plain", dragId);
  li.classList.add("dragging");
});

list.addEventListener("dragend", (e) => {
  const li = e.target.closest("li.task-item");
  if (li) li.classList.remove("dragging");
  dragId = null;
});

list.addEventListener("dragover", (e) => {
  e.preventDefault();

  const dragging = list.querySelector(".dragging");
  if (!dragging) return;

  const y = e.clientY;
  const siblings = [...list.querySelectorAll("li.task-item:not(.dragging)")];

  let anchor = null;
  for (const li of siblings) {
    const r = li.getBoundingClientRect();
    const mid = r.top + r.height / 2;
    if (y < mid) { anchor = li; break; }
  }

  if (anchor) {
    list.insertBefore(dragging, anchor);
  } else {
    list.appendChild(dragging);
  }
});

list.addEventListener("drop", (e) => {
  e.preventDefault();
  const ids = [...list.querySelectorAll("li.task-item")].map(li => li.dataset.id);
  tasks = ids.map(id => tasks.find(t => t.id === id));
  tasks.forEach((t, i) => t.order = i);
  sortSel.value = "manual";
  render();                               
});

titleInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") { e.preventDefault(); addBtn.click(); }
});

window.addEventListener("load", () => titleInput.focus());


loadTasks(); 
render();
booted = true;

window.addEventListener("beforeunload", saveTasks);