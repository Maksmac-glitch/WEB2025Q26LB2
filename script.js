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
const sortSel     = el("select", {},
  el("option", { value: "created-asc",  text: "Сначала старые" }),
  el("option", { value: "created-desc", text: "Сначала новые" }),
  el("option", { value: "date-asc",     text: "По дате ↑" }),
  el("option", { value: "date-desc",    text: "По дате ↓" }),
);

const controls = el("section", { className: "controls" },
  el("div", { className: "controls-row" }, searchInput, filterSel, sortSel)
);

const list = el("ul", { className: "task-list" });

app.append(header, addForm, controls, list);
document.body.appendChild(app);

