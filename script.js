document.addEventListener("DOMContentLoaded", () => {

  const output = document.getElementById("output");
  const input = document.getElementById("commandInput");

  let essays = {};
  let currentSubject = null;

  // =========================
  // TYPING SYSTEM
  // =========================
  let typingTimeout = null;
  let isTyping = false;
  let fullText = "";

  function typeText(text, speed = 10, container = output) {
    if (typingTimeout) clearTimeout(typingTimeout);

    isTyping = true;
    fullText = text;
    container.textContent = "";
    let i = 0;

    function type() {
      if (i < text.length) {
        container.textContent += text.charAt(i);
        i++;
        typingTimeout = setTimeout(type, speed);
      } else {
        isTyping = false;
      }
    }

    type();
  }

  function skipTyping() {
    if (isTyping) {
      clearTimeout(typingTimeout);
      output.textContent = fullText;
      isTyping = false;
    }
  }

  // =========================
  // COMMAND HISTORY
  // =========================
  let commandHistory = [];
  let historyIndex = -1;

  input.addEventListener("keydown", e => {
    // ENTER
    if (e.key === "Enter") {
      e.preventDefault();
      const cmd = input.value.trim();
      if (cmd) {
        commandHistory.push(cmd);
        historyIndex = commandHistory.length;
      }
      runCommand(cmd);
      input.value = "";
    }

    // UP ARROW
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (historyIndex > 0) {
        historyIndex--;
        input.value = commandHistory[historyIndex];
      }
    }

    // DOWN ARROW
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        historyIndex++;
        input.value = commandHistory[historyIndex];
      } else {
        input.value = "";
      }
    }
  });

  // =========================
  // GLOBAL ESC KEY
  // =========================
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      e.preventDefault();
      if (typingTimeout) clearTimeout(typingTimeout);
      isTyping = false;
      input.value = "";
      showMenu();
      input.focus();
    }
  });

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
  // MENUS
  // =========================
  function showMenu() {
    currentSubject = null;
    typeText(`
PORTFOLIO TERMINAL

Commands:

${Object.keys(essays).join("\n")}

help
`);
  }

  function showSubjectMenu(subject) {
    currentSubject = subject;
    const list = essays[subject].join("\n- ");
    typeText(`
${subject.toUpperCase()} ESSAYS

Type one of the following:

- ${list}

Type 'help' to return
`);
  }

  // =========================
  // LOAD ESSAY (with top & bottom input)
  // =========================
  function loadEssay(subject, essayName) {
    output.innerHTML = "";

    // Top input
    const topLine = document.createElement("div");
    topLine.className = "inputLine";
    const topPrompt = document.createElement("span");
    topPrompt.className = "prompt";
    topPrompt.textContent = ">";
    const topInput = document.createElement("input");
    topInput.className = "commandInput";
    topInput.placeholder = "Type command + ENTER";
    topLine.appendChild(topPrompt);
    topLine.appendChild(topInput);
    output.appendChild(topLine);

    // Essay text
    const essayDiv = document.createElement("div");
    essayDiv.className = "essayText";
    essayDiv.textContent = "Loading...";
    output.appendChild(essayDiv);

    fetch(`essays/${subject}/${essayName}.txt`)
      .then(res => res.ok ? res.text() : Promise.reject())
      .then(text => {
        essayDiv.textContent = text;
      })
      .catch(() => {
        essayDiv.textContent = "Error: file not found";
      });

    // Bottom input
    const bottomLine = document.createElement("div");
    bottomLine.className = "inputLine";
    const bottomPrompt = document.createElement("span");
    bottomPrompt.className = "prompt";
    bottomPrompt.textContent = ">";
    const bottomInput = document.createElement("input");
    bottomInput.className = "commandInput";
    bottomInput.placeholder = "Type command + ENTER";
    bottomLine.appendChild(bottomPrompt);
    bottomLine.appendChild(bottomInput);
    output.appendChild(bottomLine);
  }

  // =========================
  // COMMAND HANDLER
  // =========================
  function runCommand(cmd) {
    if (!cmd) return;
    cmd = cmd.toLowerCase().trim();

    if (cmd === "help") {
      showMenu();
      return;
    }

    // Inside subject
    if (currentSubject) {
      if (essays[currentSubject].includes(cmd)) {
        loadEssay(currentSubject, cmd);
      } else {
        typeText(`Invalid entry\n\nType help`);
      }
      return;
    }

    // Main menu
    if (essays.hasOwnProperty(cmd)) {
      showSubjectMenu(cmd);
    } else {
      typeText(`Unknown command\n\nType help`);
    }
  }

  input.focus();
});
