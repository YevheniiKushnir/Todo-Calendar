import { getCurrentUser, setCurrentUser } from "./loginForm.js";

document.addEventListener("DOMContentLoaded", initCalendar);

let currentDate = new Date(); //full Date
let descriptionDate = ""; //need to correctly render the full description of the dates yyyy-mm-dd
const lastTabletSize = "(max-width: 1023px)"; //last px on Tablet version
const sometimeDate = "sometime"; // need to determine undated days
const weekDays = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function initCalendar() {
  const monthYear = document.querySelector(".calendar__monthYear");
  const timeFrame = document.querySelector(".calendar__timeFrame");
  const calendarGrid = document.querySelector("#calendarGrid");
  const prevWeekBtn = document.querySelector("#prevWeek");
  const nextWeekBtn = document.querySelector("#nextWeek");

  prevWeekBtn.addEventListener("click", () =>
    changeWeek(-7, monthYear, timeFrame, calendarGrid)
  );
  nextWeekBtn.addEventListener("click", () =>
    changeWeek(7, monthYear, timeFrame, calendarGrid)
  );
  if (window.matchMedia(lastTabletSize).matches) {
    calendarGrid.addEventListener("touchstart", (e) => {
      calendarGrid.dataset.startX = e.touches[0].clientX;
    });
    calendarGrid.addEventListener("touchend", (e) => {
      let startX = calendarGrid.dataset.startX;
      let endX = e.changedTouches[0].clientX;
      if (!startX) return;

      let diffX = startX - endX;
      if (Math.abs(diffX) > 50) {
        changeWeek(diffX > 0 ? 7 : -7, monthYear, timeFrame, calendarGrid);
      }
    });
  }

  themeToggle();
  renderCalendar(currentDate, monthYear, timeFrame, calendarGrid);
  renderSometimeTasks(sometimeDate);
}

function renderCalendar(date, monthYear, timeFrame, calendarGrid) {
  calendarGrid.innerHTML = "";
  let startOfWeek = getStartOfWeek(date); //full Date
  let endOfWeek = getEndOfWeek(startOfWeek); //full Date

  updateHeader(startOfWeek, endOfWeek, monthYear, timeFrame);
  createWeekDays(startOfWeek, calendarGrid);
}

function getStartOfWeek(date) {
  let start = new Date(date);
  start.setDate(start.getDate() - ((start.getDay() || 7) - 1));
  return start;
}

function getEndOfWeek(startOfWeek) {
  let end = new Date(startOfWeek);
  end.setDate(end.getDate() + 6);
  return end;
}

function changeWeek(days, monthYear, timeFrame, calendarGrid) {
  currentDate.setDate(currentDate.getDate() + days); //full Date
  renderCalendar(currentDate, monthYear, timeFrame, calendarGrid);
}

function updateHeader(startOfWeek, endOfWeek, monthYear, timeFrame) {
  monthYear.textContent = startOfWeek.toLocaleString("en-EN", {
    month: "long",
    year: "numeric",
  });

  timeFrame.textContent = `${startOfWeek.toLocaleDateString(
    "ru-RU"
  )} - ${endOfWeek.toLocaleDateString("ru-RU")}`;
}

function createWeekDays(startOfWeek, calendarGrid) {
  for (let i = 0; i < weekDays.length; i++) {
    let dayDate = new Date(startOfWeek); //full Date
    dayDate.setDate(startOfWeek.getDate() + i);

    const normalizerDateOfDay = dayDate.toISOString().split("T")[0]; //yyyy-mm-dd Standart Date in Todo

    calendarGrid.insertAdjacentHTML(
      "beforeend",
      `
      <div 
        class="day" 
        data-day="${normalizerDateOfDay}" 
        ${
          dayDate.toDateString() === new Date().toDateString()
            ? 'id="today"'
            : ""
        }
      > 
        <div class="day__title" data-day="${normalizerDateOfDay}">
          <p>
            ${dayDate.toLocaleDateString("ru-RU", {
              day: "2-digit",
              month: "2-digit",
            })}
          </p>
          <p>${weekDays[dayDate.getDay()]}</p>
        </div>
        <div class="day__task-block">
        <input 
          type="text" 
          placeholder="Add a new Task" 
          class="day__task-text day__task-text--main" 
          autocomplete="off"
          title="Press Enter to save or move focus away from the input field" 
          data-day="${normalizerDateOfDay}"
        >
        </div>
        <div class="day__content" data-day="${normalizerDateOfDay}"></div>
      </div>
      `
    );

    const input = document.querySelector(
      `.day__task-text--main[data-day="${normalizerDateOfDay}"]`
    );
    const parent = document.querySelector(
      `.day__content[data-day="${normalizerDateOfDay}"]`
    );
    const title = document.querySelector(
      `.day__title[data-day="${normalizerDateOfDay}"]`
    );

    input.addEventListener("blur", (event) =>
      createNewTask(event, normalizerDateOfDay, parent)
    );
    input.addEventListener("keydown", (event) =>
      createNewTask(event, normalizerDateOfDay, parent)
    );
    title.addEventListener("click", openDetailedDescription);
  }

  renderFromTodos();
}

function createNewTask(event, normalizerDateOfDay, parent) {
  //normalizerDateOfDay yyyy-mm-dd
  const mainInput = event.target;
  if (mainInput.value.trim() === "") {
    return;
  }
  if (
    event.type === "blur" ||
    (event.type === "keydown" && event.key === "Enter")
  ) {
    const id = generateUniqNewId(normalizerDateOfDay);

    renderTaskComponent(parent, normalizerDateOfDay, mainInput.value, id);
    addToTodos(normalizerDateOfDay, id, mainInput.value);

    mainInput.value = "";
  }
}

function renderTaskComponent(
  parent,
  dateOfDay,
  value = "",
  id,
  checked = false
) {
  //dateOfDay yyyy-mm-dd
  parent.insertAdjacentHTML(
    "beforeend",
    `<div class="day__task-block" data-dayId="${id}">
       <div class="checkbox-wrapper checkbox-wrapper--done">
         <input type="checkbox" id="${id}" ${checked ? "checked" : ""}/>
         <label for="${id}" class="check-box"></label>
       </div>
       <input type="text" name="${id}" class="day__task-text" value="${value}" autocomplete="off">
     </div>`
  );

  const checkbox = parent.querySelector(`[type="checkbox"][id="${id}"]`);
  const input = parent.querySelector(`[name='${id}']`);
  const taskElement = parent.querySelector(
    `.day__task-block[data-dayId="${id}"]`
  );

  if (!checkbox || !input || !taskElement) {
    return;
  }

  input.classList.toggle("done", checkbox.checked);

  input.addEventListener("blur", (event) =>
    updateTodos(
      event,
      dateOfDay,
      input.value,
      id,
      checkbox.checked,
      parent,
      taskElement
    )
  );
  input.addEventListener("keydown", (event) =>
    updateTodos(
      event,
      dateOfDay,
      input.value,
      id,
      checkbox.checked,
      parent,
      taskElement
    )
  );
  checkbox.addEventListener("change", (event) => {
    input.classList.toggle("done", checkbox.checked);
    updateTodos(
      event,
      dateOfDay,
      input.value,
      id,
      checkbox.checked,
      parent,
      taskElement
    );
  });
}

function generateUniqNewId(dateOfDay) {
  return `${dateOfDay}-${Date.now()}`;
}

function getTodos() {
  const currentUser = getCurrentUser();
  return currentUser?.todos || JSON.parse(localStorage.getItem("todos")) || [];
}

function setTodos(todos) {
  //the current user is saved in the all-users array when logging out of the account
  const currentUser = getCurrentUser();
  if (currentUser) {
    currentUser.todos = todos;
    setCurrentUser(currentUser);
  } else {
    localStorage.setItem("todos", JSON.stringify(todos));
  }
}

function addToTodos(dateOfDay, id, value = "", checked = false) {
  //dateOfDay yyyy-mm-dd
  let todos = getTodos();

  let day = todos.find((day) => day.date === dateOfDay);

  if (day) {
    day.content.push({ value, id, checked });
  } else {
    todos.push({
      date: dateOfDay,
      content: [{ value, id, checked }],
    });
  }

  setTodos(todos);
}

function filteredTodosWithDate() {
  const todos = getTodos();
  return todos.filter((day) => day.date !== sometimeDate);
}
function filteredTodosWithoutDate() {
  const todos = getTodos();
  return todos.find((day) => day.date === sometimeDate);
}

function updateTodos(
  event,
  dateOfDay,
  value,
  id,
  checked,
  parent,
  taskElement,
  deadline
) {
  //dateOfDay yyyy-mm-dd
  const deadlineInputs = parent.querySelectorAll(
    '.fullDescription__task-deadline input[type="date"]'
  );
  const isDeadlineInput = Array.from(deadlineInputs).includes(event.target);

  if (value.trim() === "" && !isDeadlineInput) {
    if (
      event.type === "blur" ||
      (event.type === "keydown" && event.key === "Enter")
    ) {
      removeFromTodos(dateOfDay, id, parent, taskElement);
    }
    return;
  }
  if (
    event.type === "blur" ||
    (event.type === "keydown" && event.key === "Enter") ||
    event.type === "change"
  ) {
    const todos = getTodos();
    const day = todos.find((d) => d.date === dateOfDay);
    if (day) {
      const task = day.content.find((t) => t.id === id);
      if (task) {
        task.value = value;
        task.checked = checked;
        if (typeof deadline !== "undefined") {
          task.deadline = deadline;
        }
      }
    }
    setTodos(todos);
  }
}

function removeFromTodos(dateOfDay, id, parent, taskElement) {
  //dateOfDay yyyy-mm-dd
  let todos = getTodos();

  let dayTask = todos.find((day) => day.date === dateOfDay);
  if (dayTask) {
    dayTask.content = dayTask.content.filter((task) => task.id !== id);
    if (dayTask.content.length === 0) {
      todos = todos.filter((day) => day.date !== dateOfDay);
    }
  }

  setTodos(todos);

  if (taskElement && parent.contains(taskElement)) {
    parent.removeChild(taskElement);
  }
}

function renderFromTodos() {
  const todos = filteredTodosWithDate();

  todos.forEach((day) => {
    const parent = document.querySelector(
      `.day__content[data-day="${day.date}"]`
    );

    if (parent) {
      day.content.forEach((task) => {
        renderTaskComponent(
          parent,
          day.date,
          task.value,
          task.id,
          task.checked
        );
      });
    }
  });
}

function openDetailedDescription() {
  const currentDayEl = event.currentTarget;
  const currentDate = currentDayEl.getAttribute("data-day"); //currentDate yyyy-mm-dd
  descriptionDate = currentDate;
  const day = namingTitle(currentDate);
  const nameOfDay = currentDayEl.querySelectorAll("p")[1].textContent;

  event.preventDefault();
  event.stopPropagation();

  const description = document.querySelector(".fullDescription");
  const content = description.querySelector(".fullDescription__content");

  description.classList.add("fullDescription--open");
  document.body.classList.add("no-scroll");

  content.insertAdjacentHTML(
    "beforeend",
    `
    <div class="fullDescription__header">
      <div class="fullDescription__title">
        <h2 class="fullDescription__title--date">${day}</h2>
        <h2 class="fullDescription__title--day">${nameOfDay}</h2>
      </div>
      <div class="fullDescription__newTask">
        <input
          type="text"
          placeholder="Add a new Task"
          autocomplete="off"
          title="Press Enter to save or move focus away from the input field"
          id="addNewTaskDescription"
        />
      </div>
        <div class="fullDescription__inputs">
          <label> 
            <input type="text" autocomplete="off" id="searchInput" placeholder="Search..." />
          </label>
          <label>
            <input type="date" id="searchDate"/>
          </label>
        </div>
        <div class="fullDescription__buttons">
          <button class="active" id="btn__all">All</button>
          <button id="btn__active">Active</button>
          <button id="btn__completed">Completed</button>
        </div>
    </div>
    <div class="fullDescription__tasks"></div>
    `
  );

  const btns = description.querySelectorAll(".fullDescription__buttons button");
  const searchDate = description.querySelector("#searchDate");
  const searchInput = description.querySelector("#searchInput");
  const addNewTaskInput = description.querySelector("#addNewTaskDescription");
  searchDate.value = currentDate;
  addNewTaskInput.addEventListener("blur", (event) =>
    createNewTaskInDescription()
  );
  addNewTaskInput.addEventListener("keydown", (event) =>
    createNewTaskInDescription()
  );
  btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      btns.forEach((currentBtn) => {
        if (currentBtn === event.currentTarget) {
          currentBtn.classList.add("active");
          renderDayDescriptionTask(
            descriptionDate,
            currentBtn.id,
            searchInput.value
          );
        } else {
          currentBtn.classList.remove("active");
        }
      });
    });
  });

  description.addEventListener("click", (event) => {
    if (event.target === event.currentTarget) {
      closeDetailedDescription();
    }
  });
  if (window.matchMedia(lastTabletSize).matches) {
    content.addEventListener("touchstart", (e) => {
      content.dataset.startY = e.touches[0].clientY;
    });

    content.addEventListener("touchend", (e) => {
      let startY = Number(content.dataset.startY);
      let endY = e.changedTouches[0].clientY;
      if (isNaN(startY)) return;

      let diffY = startY - endY;

      if (diffY > 200) {
        closeDetailedDescription();
      }
    });
  }
  searchDate.addEventListener("input", () => {
    if (!searchDate.value) {
      closeDetailedDescription();
    } else {
      changeDayDescription(searchDate.value);
    }
  });
  searchInput.addEventListener("input", () => {
    renderDayDescriptionTask(
      descriptionDate,
      getActiveButtonId(),
      searchInput.value.trim()
    );
  });

  renderDayDescriptionTask(currentDate);
}

function getActiveButtonId() {
  const activeBtn = document.querySelector(
    ".fullDescription__buttons button.active"
  );
  return activeBtn.id;
}

function closeDetailedDescription() {
  const description = document.querySelector(".fullDescription");
  const content = description.querySelector(".fullDescription__content");

  description.classList.remove("fullDescription--open");
  document.body.classList.remove("no-scroll");
  content.innerHTML = "";
  const monthYear = document.querySelector(".calendar__monthYear");
  const timeFrame = document.querySelector(".calendar__timeFrame");
  const calendarGrid = document.querySelector("#calendarGrid");
  renderCalendar(currentDate, monthYear, timeFrame, calendarGrid);
}

function changeDayDescription(selectedDay) {
  const dateOfDay = new Date(selectedDay); //full Date
  descriptionDate = selectedDay; //selectedDay yyyy-mm-dd
  const date = namingTitle(descriptionDate);
  const day = dateOfDay.toLocaleDateString("en-EN", { weekday: "long" });

  const description = document.querySelector(".fullDescription");
  const h2Date = description.querySelector(".fullDescription__title--date");
  const h2Day = description.querySelector(".fullDescription__title--day");

  h2Date.textContent = date;
  h2Day.textContent = day;

  document.querySelector(".fullDescription__tasks").innerHTML = "";
  resetSearchParam();
  renderDayDescriptionTask(descriptionDate);
}

function namingTitle(dateString) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    console.warn("Invalid date format, expected yyyy-mm-dd:", dateString);
    return;
  }
  const [year, month, day] = dateString.split("-"); //dateString yyyy-mm-dd

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const monthName = months[parseInt(month) - 1];

  return `${day} ${monthName} ${year}`;
}

function resetSearchParam() {
  const searchInput = document.getElementById("searchInput");
  const btns = document.querySelectorAll(".fullDescription__buttons button");

  btns.forEach((btn) => {
    if (btn.id === "btn__all") {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  searchInput.value = "";
}

function themeToggle() {
  const savedTheme = localStorage.getItem("theme") || "light";
  const themeToggle = document.querySelector(".theme-switcher input");

  document.documentElement.setAttribute("data-theme", savedTheme);
  themeToggle.checked = savedTheme === "dark";

  setTimeout(() => {
    document.documentElement.classList.add("loaded");
  }, 0);

  themeToggle.addEventListener("change", () => {
    const newTheme = themeToggle.checked ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  });
}

function renderDayDescriptionTask(
  currentDate,
  btnSort = "btn__all",
  searchValue = ""
) {
  //currentDate yyyy-mm-dd
  const todos = filteredTodosWithDate();
  const parent = document.querySelector(".fullDescription__tasks");
  parent.innerHTML = "";

  const neededDay = todos.find((todo) => todo.date === currentDate);

  if (neededDay) {
    let filteredTasks = neededDay.content;

    if (btnSort) {
      filteredTasks = sortByBtn(filteredTasks, btnSort);
    }

    if (searchValue && searchValue.trim() !== "") {
      filteredTasks = filteredTasks.filter((task) =>
        task.value.toLowerCase().includes(searchValue.toLowerCase())
      );
    }

    if (filteredTasks.length > 0) {
      renderDescriptionTasks(parent, filteredTasks, currentDate);
    } else {
      renderNoTasksMessage(parent, true);
    }
  } else {
    renderNoTasksMessage(parent);
  }
}
function sortByBtn(dayTodos, activeBtn = "btn__all") {
  return dayTodos.filter((task) => {
    switch (activeBtn) {
      case "btn__active":
        return !task.checked;
      case "btn__completed":
        return task.checked;
      default:
        return true;
    }
  });
}

function renderNoTasksMessage(parent, isSearchResult = false) {
  const message = isSearchResult
    ? "<h2 class='fullDescription__no-tasks'>No tasks found matching your criteria</h2>"
    : "<h2 class='fullDescription__no-tasks'>You have nothing planned for this day. Choose another day or add tasks!</h2>";

  parent.insertAdjacentHTML("beforeend", message);
}

function renderDescriptionTasks(parent, filteredTasks, currentDate) {
  //currentDate yyyy-mm-dd
  filteredTasks.forEach((task) => {
    renderDesctiprionTask(
      parent,
      task.id,
      task.value,
      currentDate,
      task.checked,
      task.deadline || null
    );
  });
}

function renderDesctiprionTask(
  parent,
  id,
  value,
  currentDate,
  checked = false,
  deadline = false
) {
  //currentDate yyyy-mm-dd
  if (parent.querySelector("h2.fullDescription__no-tasks")) {
    parent.innerHTML = "";
  }
  parent.insertAdjacentHTML(
    "beforeend",
    `
    <div class="fullDescription__task-block ${
      checked ? "done" : ""
    }" data-task="${id}--block">
      <textarea 
        class="fullDescription__task-text"
        data-text="${id}--text" 
        title="Move focus away from the input field to save"
      >${value}</textarea>
      <div class="fullDescription__task-deadline">
        Deadline to:
        <input id="${id}--deadlineDate" type="date" min="${currentDate}" />
      </div>
      <div class="fullDescription__task-tools">
        <div class="checkbox-wrapper checkbox-wrapper--done checkbox-wrapper--description-done checkbox-wrapper--tools">
          <input type="checkbox" id="${id}--done"  ${checked ? "checked" : ""}/>
          <label for="${id}--done" class="check-box"></label>
        </div>
        <div class="checkbox-wrapper checkbox-wrapper--remove checkbox-wrapper--description-remove checkbox-wrapper--tools">
          <input type="checkbox" id="${id}--remove" />
          <label for="${id}--remove" class="check-box"></label>
        </div>
      </div>
    </div>`
  );

  const checkboxDone = document.getElementById(`${id}--done`);
  const checkboxRemove = document.getElementById(`${id}--remove`);
  const deadlineInput = document.getElementById(`${id}--deadlineDate`);
  const taskElement = parent.querySelector(`[data-task="${id}--block"]`);
  const input = parent.querySelector(`[data-text="${id}--text"]`);
  correctSizeOfTextArea(input);

  if (deadline) {
    deadlineInput.value = deadline;
  }

  checkboxDone.addEventListener("change", (event) => {
    taskElement.classList.toggle("done", checkboxDone.checked);

    updateTodos(
      event,
      currentDate,
      input.value,
      id,
      checkboxDone.checked,
      parent,
      taskElement
    );
  });
  checkboxRemove.addEventListener("change", () => {
    removeFromTodos(currentDate, id, parent, taskElement);
  });
  input.addEventListener("blur", (event) =>
    updateTodos(
      event,
      currentDate,
      input.value,
      id,
      checkboxDone.checked,
      parent,
      taskElement
    )
  );

  deadlineInput.addEventListener("blur", (event) => {
    const selectedDate = new Date(event.target.value); //full Date
    const minDate = new Date(event.target.min); //full Date

    if (selectedDate < minDate) {
      alert(`Choose a date after  ${event.target.min}`);
      event.target.value = "";
    }
    updateTodos(
      event,
      currentDate,
      input.value,
      id,
      checkboxDone.checked,
      parent,
      taskElement,
      deadlineInput.value
    );
  });
}

function createNewTaskInDescription() {
  const dateOfDay = descriptionDate; //yyyy-mm-dd
  const id = generateUniqNewId(dateOfDay);

  const mainInput = event.target;
  if (mainInput.value.trim() === "") {
    return;
  }
  if (
    event.type === "blur" ||
    (event.type === "keydown" && event.key === "Enter")
  ) {
    addToTodos(dateOfDay, id, mainInput.value);
    renderDayDescriptionTask(descriptionDate, getActiveButtonId());
    mainInput.value = "";
  }
}

function renderSometimeTasks() {
  const todo = filteredTodosWithoutDate();
  const parent = document.querySelector(".sometime");
  parent.innerHTML = "";

  if (todo && todo.content.length > 0) {
    todo.content.forEach((task) => {
      renderSometimeTask(task.id, task.value, task.checked);
    });
  } else {
    createEmptySometimeTask();
  }
}

function renderSometimeTask(id, value = "", checked = false) {
  //sometimeDate sometime
  const parent = document.querySelector(".sometime");

  parent.insertAdjacentHTML(
    "beforeend",
    `<div class="sometime__task-block" data-day="${id}">
        <input
          type="text"
          class="sometime__task-text ${checked ? "done" : ""}"
          title="Move focus away from the input field to save"
          placeholder="Add a new Task"
          id="${id}"
          value="${value}"
        />
        <div class="sometime__task-tools">
          <div class="checkbox-wrapper checkbox-wrapper--done checkbox-wrapper--sometime-done checkbox-wrapper--tools">
            <input type="checkbox" id="${id}--done" ${
      checked ? "checked" : ""
    } />
            <label for="${id}--done" class="check-box"></label>
          </div>
          <div class="checkbox-wrapper checkbox-wrapper--remove checkbox-wrapper--sometime-remove checkbox-wrapper--tools">
            <input type="checkbox" id="${id}--remove" />
            <label for="${id}--remove" class="check-box"></label>
          </div>
        </div>
    </div>`
  );
  const input = document.getElementById(`${id}`);
  const checkboxDone = document.getElementById(`${id}--done`);
  const checkboxRemove = document.getElementById(`${id}--remove`);
  const taskElement = parent.querySelector(`[data-day="${id}"]`);

  checkboxDone.addEventListener("change", (event) => {
    if (input.value.trim() === "") {
      event.preventDefault();
      checkboxDone.checked = !checkboxDone.checked;
      return;
    }

    input.classList.toggle("done", checkboxDone.checked);
    updateTodos(
      event,
      sometimeDate,
      input.value,
      id,
      checkboxDone.checked,
      parent,
      taskElement
    );
  });
  checkboxRemove.addEventListener("change", function () {
    if (input.value.trim() !== "") {
      removeFromTodos(sometimeDate, id, parent, taskElement);
      checkEmptySometimeTask();
    }
  });
  input.addEventListener("blur", function () {
    updateTodos(
      event,
      sometimeDate,
      input.value,
      id,
      checkboxDone.checked,
      parent,
      taskElement
    );
    checkEmptySometimeTask();
  });
}

function createEmptySometimeTask() {
  //sometimeDate sometime
  const newId = generateUniqNewId(sometimeDate);
  renderSometimeTask(newId);
  addToTodos(sometimeDate, newId);
}

function checkEmptySometimeTask() {
  const parent = document.querySelector(".sometime");
  const inputs = Array.from(
    parent.querySelectorAll("input[type=text].sometime__task-text")
  );

  const alreadyEmptyInput = inputs.some((task) => task.value.trim() === "");

  if (!alreadyEmptyInput) {
    createEmptySometimeTask();
  }
}

function correctSizeOfTextArea(textarea) {
  textarea.style.height = "auto";
  textarea.style.height = `${textarea.scrollHeight}px`;

  textarea.addEventListener("input", (event) => {
    event.target.style.height = "auto";
    event.target.style.height = event.target.scrollHeight + "px";
  });
}
