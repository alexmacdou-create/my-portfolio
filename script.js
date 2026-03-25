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

  function typeText(text, speed = 10) {
    if (typingTimeout) clearTimeout(typingTimeout);

    isTyping = true;
    fullText = text;
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
  // COMMAND HISTORY
  // =========================
  let commandHistory = [];
  let historyIndex = -1;

  input.addEventListener("keydown", e => {
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

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (historyIndex > 0) {
        historyIndex--;
        input.value = commandHistory[historyIndex];
      }
    }

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
  // LOAD ESSAY (WITH TOP & BOTTOM INPUTS)
  // =========================
  function loadEssay(subject, essayName) {
    fetch(`essays/${subject}/${essayName}.txt`)
      .then(res => {
        if (!res.ok) throw new Error();
        return res.text();
      })
      .then(text => {

        // Clear output and create top input
        output.innerHTML = '';
        createEssayInput('top');

        // Type essay text
        typeText(text + "\n", 0.125);

        // Create bottom input after text
        createEssayInput('bottom');

      })
      .catch(() => {
        typeText(`Error: file not found\n\nType help`);
      });
  }

  // =========================
  // CREATE TOP/BOTTOM INPUT FOR ESSAYS
  // =========================
  function createEssayInput(position) {
    const div = document.createElement("div");
    div.classList.add("inputLineEssay");

    const span = document.createElement("span");
    span.classList.add("prompt");
    span.textContent = ">";
    div.appendChild(span);

    const essayInput = document.createElement("input");
    essayInput.type = "text";
    essayInput.classList.add("commandInput");
    essayInput.placeholder = "Type back to return";
    div.appendChild(essayInput);

    if (position === 'top') {
      output.appendChild(div);
      output.appendChild(document.createElement("br")); // spacing
      essayInput.focus();
    } else {
      output.appendChild(document.createElement("br"));
      output.appendChild(div);
    }

    essayInput.addEventListener("keydown", e => {
      if (e.key === "Enter") {
        e.preventDefault();
        const cmd = essayInput.value.trim().toLowerCase();
        if (cmd === "back" || cmd === "help") {
          showMenu();
          input.focus();
        }
        essayInput.value = "";
      }
    });
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

    if (currentSubject) {
      if (essays[currentSubject].includes(cmd)) {
        loadEssay(currentSubject, cmd);
      } else {
        typeText(`Invalid entry\n\nType help`);
      }
      return;
    }

    if (essays.hasOwnProperty(cmd)) {
      showSubjectMenu(cmd);
    } else {
      typeText(`Unknown command\n\nType help`);
    }
  }

  input.focus();
});
