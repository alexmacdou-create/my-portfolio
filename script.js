document.addEventListener("DOMContentLoaded", () => {
  const output = document.getElementById("output");
  const menuInput = document.getElementById("commandInput");

  let essays = {};
  let currentSubject = null;
  let typingTimeout = null;
  let isTyping = false;

  // =========================
  // TYPING SYSTEM
  // =========================
  function typeText(text, speed = 10) {
    if (typingTimeout) clearTimeout(typingTimeout);

    isTyping = true;
    output.textContent = "";
    let i = 0;

    function type() {
      if (i < text.length) {
        output.textContent += text.charAt(i);
        i++;
        typingTimeout = setTimeout(type, speed);
      } else {
        isTyping = false;
      }
    }

    type();
  }

  // =========================
  // COMMAND HANDLER (FIXED)
  // =========================
  function runCommand(cmd) {
    if (!cmd) return;
    cmd = cmd.toLowerCase().trim();

    // Universal BACK
    if (cmd === "back") {
      showMenu();
      return;
    }

    // =========================
    // INSIDE SUBJECT
    // =========================
    if (currentSubject !== null) {
      if (essays[currentSubject].includes(cmd)) {
        loadEssay(currentSubject, cmd);
      } else {
        typeText(`Unknown command\n\nType 'back'`);
      }
      return;
    }

    // =========================
    // MAIN MENU
    // =========================
    if (essays.hasOwnProperty(cmd)) {
      showSubjectMenu(cmd);
    } else {
      typeText(`Unknown command\n\nType 'back'`);
    }
  }

  // =========================
  // LOAD ESSAY
  // =========================
  function loadEssay(subject, essayName) {
    if (typingTimeout) clearTimeout(typingTimeout);
    isTyping = false;
    output.textContent = "";

    fetch(`essays/${subject}/${essayName}.txt`)
      .then(res => {
        if (!res.ok) throw new Error();
        return res.text();
      })
      .then(text => {
        currentSubject = subject;
        displayEssay(text);
      })
      .catch(() => {
        typeText(`Error: file not found\n\nType 'back'`);
      });
  }

  // =========================
  // DISPLAY ESSAY (TOP INPUT ONLY)
  // =========================
  function displayEssay(text) {
    output.innerHTML = "";

    // Top input
    const inputLine = createEssayInput();
    output.appendChild(inputLine);

    // Essay text
    const essayText = document.createElement("pre");
    essayText.textContent = text;
    output.appendChild(essayText);

    inputLine.querySelector("input").focus();
  }

  function createEssayInput() {
    const div = document.createElement("div");
    div.classList.add("inputLineEssay");

    const span = document.createElement("span");
    span.classList.add("prompt");
    span.textContent = "> ";
    div.appendChild(span);

    const inp = document.createElement("input");
    inp.type = "text";
    inp.classList.add("commandInput");
    inp.placeholder = "Type command + ENTER";
    inp.autocomplete = "off";

    inp.addEventListener("keydown", e => {
      if (e.key === "Enter") {
        e.preventDefault();
        runCommand(inp.value);
        inp.value = "";
      }
    });

    div.appendChild(inp);
    return div;
  }

  // =========================
  // MENUS
  // =========================
  function showMenu() {
    currentSubject = null;

    typeText(`
PORTFOLIO TERMINAL

Commands:

${Object.keys(essays).join("\n")}

Type 'back' anytime to return here
`);
    menuInput.focus();
  }

  function showSubjectMenu(subject) {
    currentSubject = subject;

    const list = essays[subject].join("\n- ");

    typeText(`
${subject.toUpperCase()} ESSAYS

Type one of the following:

- ${list}

Type 'back' to return
`);
  }

  // =========================
  // BOOT SEQUENCE
  // =========================
  function bootSequence() {
    const bootText = `
Initializing system...
Loading kernel modules...
Establishing secure connection...
Decrypting archives...
Mounting drives...
Access granted.

Welcome, user.
`;
    typeText(bootText, 20);
    setTimeout(() => showMenu(), 3000);
  }

  // =========================
  // LOAD JSON INDEX
  // =========================
  fetch("essays/index.json")
    .then(res => res.json())
    .then(data => {
      essays = data;
      bootSequence();
    })
    .catch(() => {
      output.textContent = "Failed to load essays index.";
    });

  // =========================
  // ESC KEY
  // =========================
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      e.preventDefault();
      showMenu();
      menuInput.focus();
    }
  });

  // =========================
  // MENU INPUT
  // =========================
  menuInput.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      e.preventDefault();
      runCommand(menuInput.value);
      menuInput.value = "";
    }
  });

  menuInput.focus();
});
