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

  function handleInput(e) {
    // If typing → skip
    if (isTyping) {
      e.preventDefault();
      skipTyping();
      return;
    }

    // ENTER key
    if (e.key === "Enter") {
      e.preventDefault();
      const cmd = e.target.value.trim();
      if (cmd) {
        commandHistory.push(cmd);
        historyIndex = commandHistory.length;
      }
      runCommand(cmd);
      e.target.value = "";
    }

    // UP / DOWN arrows
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (historyIndex > 0) {
        historyIndex--;
        e.target.value = commandHistory[historyIndex];
      }
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        historyIndex++;
        e.target.value = commandHistory[historyIndex];
      } else {
        e.target.value = "";
      }
    }
  }

  input.addEventListener("keydown", handleInput);

  // =========================
  // GLOBAL ESC KEY
  // =========================
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      e.preventDefault();
      if (isTyping) {
        skipTyping();
        return;
      }
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
    setTimeout(showMenu, 3000);
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
  // MENU FUNCTIONS
  // =========================
  function showMenu() {
    currentSubject = null;
    removeEssayInputs();
    typeText(`
PORTFOLIO TERMINAL

Commands:

${Object.keys(essays).join("\n")}

help
`);
    input.focus();
  }

  function showSubjectMenu(subject) {
    currentSubject = subject;
    removeEssayInputs();
    const list = essays[subject].join("\n- ");
    typeText(`
${subject.toUpperCase()} ESSAYS

Type one of the following:

- ${list}

Type 'help' to return
`);
  }

  // =========================
  // ESSAY INPUT HANDLING
  // =========================
  function createEssayInputs() {
    // Only for essays: top + bottom input
    if (!document.getElementById("topInput")) {
      const topInput = input.cloneNode(true);
      topInput.id = "topInput";
      topInput.addEventListener("keydown", handleInput);
      output.parentNode.insertBefore(topInput, output);
    }
    if (!document.getElementById("bottomInput")) {
      const bottomInput = input.cloneNode(true);
      bottomInput.id = "bottomInput";
      bottomInput.addEventListener("keydown", handleInput);
      output.parentNode.appendChild(bottomInput);
    }
  }

  function removeEssayInputs() {
    const top = document.getElementById("topInput");
    const bottom = document.getElementById("bottomInput");
    if (top) top.remove();
    if (bottom) bottom.remove();
  }

  // =========================
  // LOAD ESSAY
  // =========================
  function loadEssay(subject, essayName) {
    currentSubject = subject;
    removeEssayInputs();
    createEssayInputs();

    output.textContent = "Loading...\n";

    fetch(`essays/${subject}/${essayName}.txt`)
      .then(res => {
        if (!res.ok) throw new Error();
        return res.text();
      })
      .then(text => {
        typeText(`Type back to return\n\n${text}\n\nType back to return`, 0.125);
      })
      .catch(() => {
        typeText(`Error: file not found\n\nType back to return`);
      });
  }

  // =========================
  // COMMAND HANDLER
  // =========================
  function runCommand(cmd) {
    if (!cmd) return;
    cmd = cmd.toLowerCase().trim();

    if (isTyping) skipTyping();

    if (cmd === "help") {
      showMenu();
      return;
    }

    if (currentSubject && essays[currentSubject].includes(cmd)) {
      loadEssay(currentSubject, cmd);
    } else if (currentSubject) {
      typeText(`Invalid entry\n\nType back to return`);
    } else if (essays.hasOwnProperty(cmd)) {
      showSubjectMenu(cmd);
    } else {
      typeText(`Unknown command\n\nType help`);
    }
  }

  input.focus();

  // =========================
  // MOBILE BACK BUTTON
  // =========================
  if (/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    window.addEventListener("popstate", e => {
      if (isTyping) skipTyping();
      else showMenu();
    });
  }

});
