const quoteState = {
  step: 1,
  profile: "",
  event: null,
  guests: null,
  duration: null,
  extraHours: 1,
  options: [],
  distance: null
};

initCopyLinks();
window.copyContact = copyContact;

const eventChoices = {
  "Un particulier": [
    ["Mariage", 1090],
    ["Anniversaire", 690],
    ["Soirée privée", 690],
    ["Bar-mitsva", 890],
    ["Soirée VIP", 890],
    ["Soirée orientale", 890]
  ],
  "Une société": [
    ["Cocktail entreprise", 390],
    ["Soirée corporate", 790],
    ["Séminaire", 790],
    ["Gala entreprise", 1190],
    ["Lancement de produit", 890]
  ],
  "Une association": [
    ["Petite animation", 390],
    ["Soirée associative", 690],
    ["Gala associatif", 790],
    ["Événement public", 890]
  ]
};

const labels = {
  profile: "Profil client",
  event: "Type d'événement",
  guests: "Nombre d'invités",
  duration: "Durée",
  options: "Options choisies",
  distance: "Déplacement"
};

const menuToggle = document.querySelector(".menu-toggle");
const mainNav = document.querySelector(".main-nav");
const choices = document.querySelectorAll(".choice");
const eventOptions = document.querySelector("#event-options");
const prevButton = document.querySelector("#prev-step");
const nextButton = document.querySelector("#next-step");
const progressBar = document.querySelector("#progress-bar");
const stepCurrent = document.querySelector("#step-current");
const estimateText = document.querySelector("#estimate-text");
const liveSummary = document.querySelector("#live-summary");
const finalSummary = document.querySelector("#final-summary");
const formAlert = document.querySelector("#form-alert");
const extraHoursWrap = document.querySelector("#extra-hours-wrap");
const extraHoursInput = document.querySelector("#extra-hours");
const quoteForm = document.querySelector(".quote-form");

if (menuToggle && mainNav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = mainNav.classList.toggle("open");
    document.body.classList.toggle("nav-open", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  mainNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      mainNav.classList.remove("open");
      document.body.classList.remove("nav-open");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });
}

if (quoteForm) {
  choices.forEach((choice) => choice.addEventListener("click", () => handleChoice(choice)));
  prevButton.addEventListener("click", () => setStep(quoteState.step - 1));
  nextButton.addEventListener("click", () => {
    if (canContinue()) setStep(quoteState.step + 1);
  });
  extraHoursInput.addEventListener("input", () => {
    quoteState.extraHours = Math.max(1, Number(extraHoursInput.value) || 1);
    updateQuote();
  });

  quoteForm.addEventListener("submit", (event) => {
    if (!canContinue(true)) {
      event.preventDefault();
      return;
    }

    updateHiddenFields();
  });
}

function initCopyLinks() {
  document.addEventListener("click", async (event) => {
    const link = event.target.closest(".copy-link[data-copy]");
    if (!link) return;

    event.preventDefault();
    await copyContact(link.dataset.copy, link.dataset.copyLabel || "Copié");
  });
}

async function copyContact(text, label = "Copié") {
  const copied = fallbackCopy(text) || await clipboardCopy(text);

  if (copied) {
    showCopyToast(`${label} : ${text}`);
    return true;
  }

  showCopyToast(`Copie impossible automatiquement : ${text}`);
  window.prompt("Copiez cette information :", text);
  return false;
}

function fallbackCopy(text) {
  const input = document.createElement("textarea");
  input.value = text;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.top = "0";
  input.style.left = "0";
  input.style.opacity = "0";
  document.body.appendChild(input);
  input.focus();
  input.select();
  input.setSelectionRange(0, input.value.length);
  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch (error) {
    copied = false;
  }
  input.remove();
  return copied;
}

async function clipboardCopy(text) {
  if (!navigator.clipboard) return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    return false;
  }
}

function showCopyToast(message) {
  const toast = document.querySelector("#copy-toast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(showCopyToast.timer);
  showCopyToast.timer = setTimeout(() => {
    toast.classList.remove("visible");
  }, 2200);
}

function handleChoice(button) {
  const field = button.dataset.field;
  const value = button.dataset.value;
  const price = parsePrice(button.dataset.price);

  if (button.classList.contains("multi")) {
    toggleOption(value, price, button);
    updateQuote();
    return;
  }

  document.querySelectorAll(`.choice[data-field="${field}"]`).forEach((item) => {
    item.classList.remove("selected");
  });
  button.classList.add("selected");

  if (field === "profile") {
    quoteState.profile = value;
    quoteState.event = null;
    renderEventChoices(value);
  } else {
    quoteState[field] = { value, price };
  }

  extraHoursWrap.classList.toggle(
    "visible",
    field === "duration" && value === "Heure supplémentaire"
  );

  updateQuote();
}

function renderEventChoices(profile) {
  eventOptions.innerHTML = "";
  eventChoices[profile].forEach(([name, price]) => {
    const button = document.createElement("button");
    button.className = "choice";
    button.type = "button";
    button.dataset.field = "event";
    button.dataset.value = name;
    button.dataset.price = price;
    button.innerHTML = `${name} <span>${formatPrice(price)}</span>`;
    button.addEventListener("click", () => handleChoice(button));
    eventOptions.appendChild(button);
  });
}

function toggleOption(value, price, button) {
  const index = quoteState.options.findIndex((item) => item.value === value);
  if (index >= 0) {
    quoteState.options.splice(index, 1);
    button.classList.remove("selected");
  } else {
    quoteState.options.push({ value, price });
    button.classList.add("selected");
  }
}

function setStep(step) {
  quoteState.step = Math.min(7, Math.max(1, step));
  document.querySelectorAll(".step").forEach((element) => {
    element.classList.toggle("active", Number(element.dataset.step) === quoteState.step);
  });
  prevButton.style.visibility = quoteState.step === 1 ? "hidden" : "visible";
  nextButton.style.display = quoteState.step === 7 ? "none" : "inline-flex";
  progressBar.style.width = `${(quoteState.step / 7) * 100}%`;
  stepCurrent.textContent = quoteState.step;
  formAlert.textContent = "";
  updateQuote();
}

function canContinue(isSubmit = false) {
  formAlert.textContent = "";
  const missingMessages = {
    1: "Choisissez votre profil pour continuer.",
    2: "Choisissez un type d'événement.",
    3: "Indiquez le nombre d'invités.",
    4: "Choisissez une durée.",
    6: "Renseignez le lieu, la date et le déplacement.",
    7: "Complétez vos coordonnées avant d'envoyer la demande."
  };

  const validSteps = {
    1: Boolean(quoteState.profile),
    2: Boolean(quoteState.event),
    3: Boolean(quoteState.guests),
    4: Boolean(quoteState.duration),
    5: true,
    6: requiredLocationFieldsFilled() && Boolean(quoteState.distance),
    7: quoteForm.checkValidity()
  };

  const currentStep = isSubmit ? 7 : quoteState.step;
  if (!validSteps[currentStep]) {
    formAlert.textContent = missingMessages[currentStep] || "Complétez cette étape pour continuer.";
    if (currentStep === 7) quoteForm.reportValidity();
    return false;
  }

  return true;
}

function requiredLocationFieldsFilled() {
  return ["#city", "#postal", "#event-date", "#venue-type"].every((selector) => {
    return document.querySelector(selector).value.trim() !== "";
  });
}

function updateQuote() {
  const quote = calculateTotal();
  estimateText.textContent = getEstimateLabel(quote);
  liveSummary.innerHTML = buildSummaryHtml(false);
  finalSummary.innerHTML = buildSummaryHtml(true);
  updateHiddenFields();
}

function calculateTotal() {
  let total = 0;
  let needsCustomQuote = false;

  [quoteState.event, quoteState.guests, quoteState.duration, quoteState.distance].forEach((item) => {
    if (!item) return;
    if (item.price === "quote") needsCustomQuote = true;
    if (item.price === "extra") {
      total += quoteState.extraHours * 80;
      return;
    }
    total += item.price;
  });

  quoteState.options.forEach((option) => {
    total += option.price;
  });

  return { total, needsCustomQuote };
}

function getEstimateLabel(quote) {
  if (!quoteState.profile) {
    return "Estimation en cours : choisissez votre profil pour commencer.";
  }
  if (quote.needsCustomQuote) {
    return "Votre demande nécessite un devis personnalisé.";
  }
  return `Estimation : ${formatPrice(quote.total)}`;
}

function buildSummaryHtml(isFinal) {
  const quote = calculateTotal();
  const rows = [
    [labels.profile, quoteState.profile],
    [labels.event, quoteState.event?.value],
    [labels.guests, quoteState.guests?.value],
    [labels.duration, durationLabel()],
    [labels.options, quoteState.options.length ? quoteState.options.map((item) => item.value).join(", ") : "Aucune option ajoutée"],
    ["Ville", document.querySelector("#city").value],
    ["Date", document.querySelector("#event-date").value],
    [labels.distance, quoteState.distance?.value],
    ["Total estimé", getEstimateLabel(quote)]
  ].filter(([, value]) => value);

  if (!rows.length) return "";

  if (!isFinal) {
    return rows.slice(0, 6).map(([label, value]) => `<div><span>${label}</span>${escapeHtml(value)}</div>`).join("");
  }

  return `<dl>${rows.map(([label, value]) => `<dt>${label}</dt><dd>${escapeHtml(value)}</dd>`).join("")}</dl>`;
}

function durationLabel() {
  if (!quoteState.duration) return "";
  if (quoteState.duration.price === "extra") {
    return `${quoteState.duration.value} - ${quoteState.extraHours} h`;
  }
  return quoteState.duration.value;
}

function updateHiddenFields() {
  const quote = calculateTotal();
  const totalLabel = getEstimateLabel(quote);
  setHidden("#field-profile", quoteState.profile);
  setHidden("#field-event", quoteState.event?.value || "");
  setHidden("#field-guests", quoteState.guests?.value || "");
  setHidden("#field-duration", durationLabel());
  setHidden("#field-options", quoteState.options.map((item) => item.value).join(", "));
  setHidden("#field-distance", quoteState.distance?.value || "");
  setHidden("#field-total", totalLabel);
  setHidden("#field-summary", finalSummary.textContent.trim());
}

function setHidden(selector, value) {
  document.querySelector(selector).value = value;
}

function parsePrice(value) {
  if (value === "quote" || value === "extra") return value;
  return Number(value) || 0;
}

function formatPrice(price) {
  return `${Number(price).toLocaleString("fr-FR")} €`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

if (quoteForm) setStep(1);
