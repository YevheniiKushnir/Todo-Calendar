import { initCalendar } from "./main.js";

document.addEventListener("DOMContentLoaded", init);

function init() {
  event.preventDefault();
  event.stopPropagation();
  const accountBtn = document.querySelector("#account");
  const exitBtn = document.querySelector("#logout");
  const signInBtn = document.querySelector("#SignIn");
  const signUpBtn = document.querySelector("#SignUp");
  const backBtn = document.querySelector("#backBtn");
  const loginForm = document.querySelector("#signin");
  const userName = loginForm.querySelector('[name="user"]');
  const password = loginForm.querySelector('[name="password"]');
  const showPass = loginForm.querySelector('[type="checkbox"]');
  const submitBtn = loginForm.querySelector('[type="submit"]');

  accountBtn.addEventListener("click", openLoginForm);
  exitBtn.addEventListener("click", handleLogout);
  backBtn.addEventListener("click", closeLoginForm);
  signUpBtn.addEventListener("click", () => switchActive(signUpBtn, signInBtn));
  signInBtn.addEventListener("click", () => switchActive(signInBtn, signUpBtn));

  showPass.addEventListener("change", () => {
    password.type = showPass.checked ? "text" : "password";
  });

  addCheck(userName, "input", checkUserName, submitBtn);
  addCheck(password, "input", checkPassword, submitBtn);

  loginForm.addEventListener("submit", handleLogin);

  setUserName();
}

function switchActive(el1, el2) {
  el1.classList.add("active");
  el2.classList.remove("active");
  displayForgetPassword();
  clearAllInputs();
}

function displayForgetPassword() {
  const p = document.querySelector(".loginForm__forgotPass");
  p.style.visibility = document
    .querySelector("#SignIn")
    .classList.contains("active")
    ? "visible"
    : "hidden";
}

function handleLogin(e) {
  e.preventDefault();
  if (!checkFullField()) {
    showAlert("Fill all fields!");
    return;
  }

  const username = document.querySelector('[name="user"]').value;
  const pass = document.querySelector('[name="password"]').value;

  document.querySelector("#SignIn").classList.contains("active")
    ? loginUser(username, pass)
    : registerUser(username, pass);
}

function checkUserName(input) {
  return (
    input.value.length >= 2 &&
    input.value.length <= 24 &&
    /^[a-zA-Zа-яА-ЯёЁ]+$/.test(input.value)
  );
}

function checkPassword(input) {
  return /^.{5,26}$/.test(input.value);
}

function addCheck(input, name, check, submitBtn) {
  input.addEventListener(name, () => {
    input.parentElement.classList.toggle("correct", check(input));

    const allFieldsValid = checkFullField();
    submitBtn.classList.toggle("done", allFieldsValid);
    submitBtn.disabled = !allFieldsValid;
  });
}

function checkFullField() {
  return (
    checkUserName(document.querySelector('[name="user"]')) &&
    checkPassword(document.querySelector('[name="password"]'))
  );
}

function clearAllInputs() {
  document.querySelectorAll("#signin input").forEach((input) => {
    input.value = "";
    input.parentElement.classList.remove("correct");
  });

  document.querySelector('[name="password"]').type = "password";
  document.querySelector('[type="checkbox"]').checked = false;

  const submitBtn = document.querySelector('[type="submit"]');
  submitBtn.classList.remove("done");
  submitBtn.disabled = true;
}

function registerUser(username, password) {
  let users = getUsers();

  if (users.some((user) => user.username === username)) {
    showAlert("This user already exists!");
    return;
  }

  const newUser = { username, password, todos: [] };
  users.push(newUser);
  saveUsers(users);

  showAlert("User registered and logged in!");
  loginUser(username, password);
}

function loginUser(username, password) {
  let users = getUsers();
  let user = users.find(
    (user) => user.username === username && user.password === password
  );

  if (user) {
    showAlert("Login successful!");
    closeLoginForm();
    setCurrentUser(user);
    setUserName();
    initCalendar();
  } else {
    showAlert("Incorrect username or password!");
  }
}

function getUsers() {
  return JSON.parse(localStorage.getItem("users")) || [];
}

function saveUsers(users) {
  localStorage.setItem("users", JSON.stringify(users));
}

export function getCurrentUser() {
  return JSON.parse(localStorage.getItem("currentUser")) || null;
}

export function setCurrentUser(user) {
  localStorage.setItem("currentUser", JSON.stringify(user));
}

function removeCurrentUser() {
  localStorage.removeItem("currentUser");
}

function openLoginForm() {
  if (getCurrentUser()) {
    return;
  }

  const content = document.querySelector(".loginForm__content");

  document
    .querySelector(".loginForm__wrapper")
    .classList.add("loginForm__wrapper--open");
  document.body.classList.add("no-scroll");

  document.querySelector("#SignIn").classList.add("active");
  document.querySelector("#SignUp").classList.remove("active");

  if (window.matchMedia("(max-width: 1023px)").matches) {
    content.addEventListener("touchstart", (e) => {
      content.dataset.startY = e.touches[0].clientY;
    });

    content.addEventListener("touchend", (e) => {
      let startY = Number(content.dataset.startY);
      let endY = e.changedTouches[0].clientY;
      if (isNaN(startY)) return;

      let diffY = startY - endY;

      if (diffY > 50) {
        closeLoginForm();
      }
    });
  }

  displayForgetPassword();
  clearAllInputs();
}

function closeLoginForm() {
  document
    .querySelector(".loginForm__wrapper")
    .classList.remove("loginForm__wrapper--open");
  document.body.classList.remove("no-scroll");
}

function showAlert(message) {
  const alertBox = document.querySelector(".custom-alert");
  alertBox.querySelector("p").textContent = message;
  alertBox.style.display = "flex";

  setTimeout(() => (alertBox.style.display = "none"), 3000);
}

function setUserName() {
  const user = getCurrentUser();
  if (!user) {
    return;
  }
  const accountName = document.querySelector(".calendar__account-name");
  const accountMenu = document.querySelector(".calendar__account-menu");

  accountName.textContent = user.username;
  document.querySelector("#account").style.display = "none";

  accountName.addEventListener("click", () =>
    accountMenu.classList.toggle("calendar__account-menu--open")
  );
  document.addEventListener("click", closeMenuOnOutsideClick);
}

function closeMenuOnOutsideClick(e) {
  const accountMenu = document.querySelector(".calendar__account-menu");
  const accountName = document.querySelector(".calendar__account-name");

  if (!accountName.contains(e.target)) {
    accountMenu.classList.remove("calendar__account-menu--open");
  }
}

function handleLogout() {
  const users = getUsers();
  const currentUser = getCurrentUser();

  users.forEach((user) => {
    if (user.username === currentUser.username) {
      user.todos = currentUser.todos;
    }
  });

  saveUsers(users);
  removeCurrentUser();
  location.reload();
}
