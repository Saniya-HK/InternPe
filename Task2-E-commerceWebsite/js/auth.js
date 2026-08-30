/* ==========================================================
   LumaCart — auth.js

   NOTE: This is a FRONTEND-ONLY DEMO. Passwords are stored in
   plain text inside localStorage purely to simulate an
   authentication flow for a static, backend-less project.
   A production application must NEVER store or compare
   passwords like this — it requires a real backend with
   properly salted + hashed passwords (e.g. bcrypt/argon2),
   HTTPS, and server-side session/token management.
   ========================================================== */

function getUsers() {
  return readStorage(STORAGE_KEYS.users, []);
}

function saveUsers(users) {
  writeStorage(STORAGE_KEYS.users, users);
}

function setFieldError(input, message) {
  const field = input.closest(".form-field");
  if (!field) return;
  const errorEl = field.querySelector(".form-error");
  field.classList.toggle("has-error", Boolean(message));
  if (errorEl) errorEl.textContent = message || "";
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* ---------- Register ---------- */
function initRegisterForm() {
  const form = document.querySelector("[data-register-form]");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const fullName = form.querySelector("[name='fullName']");
    const email = form.querySelector("[name='email']");
    const password = form.querySelector("[name='password']");
    const confirmPassword = form.querySelector("[name='confirmPassword']");

    let valid = true;

    if (!fullName.value.trim()) {
      setFieldError(fullName, "Full name is required");
      valid = false;
    } else {
      setFieldError(fullName, "");
    }

    if (!isValidEmail(email.value.trim())) {
      setFieldError(email, "Enter a valid email address");
      valid = false;
    } else if (getUsers().some((u) => u.email.toLowerCase() === email.value.trim().toLowerCase())) {
      setFieldError(email, "An account with this email already exists");
      valid = false;
    } else {
      setFieldError(email, "");
    }

    if (password.value.length < 6) {
      setFieldError(password, "Password must be at least 6 characters");
      valid = false;
    } else {
      setFieldError(password, "");
    }

    if (confirmPassword.value !== password.value || !confirmPassword.value) {
      setFieldError(confirmPassword, "Passwords do not match");
      valid = false;
    } else {
      setFieldError(confirmPassword, "");
    }

    if (!valid) return;

    const users = getUsers();
    const firstName = fullName.value.trim().split(" ")[0];
    const newUser = {
      fullName: fullName.value.trim(),
      firstName,
      email: email.value.trim(),
      password: password.value // demo only — see note above
    };
    users.push(newUser);
    saveUsers(users);
    writeStorage(STORAGE_KEYS.currentUser, {
      fullName: newUser.fullName,
      firstName: newUser.firstName,
      email: newUser.email
    });

    showToast("Successfully registered", "success");
    setTimeout(() => (window.location.href = "../index.html"), 700);
  });
}

/* ---------- Login ---------- */
function initLoginForm() {
  const form = document.querySelector("[data-login-form]");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const email = form.querySelector("[name='email']");
    const password = form.querySelector("[name='password']");
    let valid = true;

    if (!isValidEmail(email.value.trim())) {
      setFieldError(email, "Enter a valid email address");
      valid = false;
    } else {
      setFieldError(email, "");
    }

    if (!password.value) {
      setFieldError(password, "Password is required");
      valid = false;
    } else {
      setFieldError(password, "");
    }

    if (!valid) return;

    const user = getUsers().find(
      (u) => u.email.toLowerCase() === email.value.trim().toLowerCase() && u.password === password.value
    );

    if (!user) {
      setFieldError(password, "Incorrect email or password");
      return;
    }

    writeStorage(STORAGE_KEYS.currentUser, {
      fullName: user.fullName,
      firstName: user.firstName,
      email: user.email
    });

    showToast("Welcome back", "success");
    setTimeout(() => (window.location.href = "../index.html"), 700);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initRegisterForm();
  initLoginForm();
});
