document.addEventListener("DOMContentLoaded", () => {

  const output = document.getElementById("output");
  const menuInputLine = document.getElementById("inputLine");
  const menuInput = document.getElementById("commandInput");

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

  function attachInputEvents(inputElement) {
    inputElement.addEventListener("keydown", e => {

      if (isTyping) {
        e.preventDefault();
        skipTyping();
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        const cmd = inputElement.value.trim();
        if (cmd) {
          commandHistory.push(cmd);
          historyIndex = commandHistory.length;
        }

        runCommand(cmd);
        inputElement.value = "";
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (historyIndex > 0) {
          historyIndex--;
          inputElement.value = commandHistory[historyIndex];
        }
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (historyIndex < commandHistory.length - 1) {
          historyIndex++;
          inputElement.value = commandHistory[historyIndex];
        } else {
          inputElement.value = "";
        }
      }

    });
  }

  attachInputEvents(menuInput); // menu input

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
      showMenu();
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
  // MENUS
  // =========================
  function showMenu() {
    currentSubject = null;

    // Show menu input, remove essay inputs if present
    menuInputLine.style.display = "flex";
    removeEssayInputs();

    typeText(`
PORTFOLIO TERMINAL

Commands:

${Object.keys(essays).join("\n")}

help
`);
  }

  function showSubjectMenu(subject) {
    currentSubject = subject;

    menuInputLine.style.display = "flex";
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
  // ESSAY INPUT HELPERS
  // =========================
  function removeEssayInputs() {
    const tops = document.querySelectorAll(".essayInputTop");
    const bottoms = document.querySelectorAll(".essayInputBottom");
    tops.forEach(el => el.remove());
    bottoms.forEach(el => el.remove());
  }

  function createEssayInputs() {
    removeEssayInputs();

    // Hide menu input
    menuInputLine.style.display = "none";

    // Top input
    const topDiv = document.createElement("div");
    topDiv.classList.add("inputLine", "essayInputTop");
    topDiv.innerHTML = `<span class="prompt">></span><input type="text" placeholder="Type command + ENTER" class="commandInput">`;
    output.parentNode.insertBefore(topDiv, output);

    // Bottom input
    const bottomDiv = document.createElement("div");
    bottomDiv.classList.add("inputLine", "essayInputBottom");
    bottomDiv.innerHTML = `<span class="prompt">></span><input type="text" placeholder="Type command + ENTER" class="commandInput">`;
    output.parentNode.appendChild(bottomDiv);

    // Attach events
    const topInput = topDiv.querySelector("input");
    const bottomInput = bottomDiv.querySelector("input");
    attachInputEvents(topInput);
    attachInputEvents(bottomInput);

    // Focus top input initially
    topInput.focus();
  }

  // =========================
  // LOAD ESSAY
  // =========================
  function loadEssay(subject, essayName) {
    removeEssayInputs();
    createEssayInputs();
    currentSubject = subject;

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

    if (currentSubject) {
      if (cmd === "back") {
        showMenu();
        return;
      }
      if (essays[currentSubject].includes(cmd)) {
        loadEssay(currentSubject, cmd);
      } else {
        typeText(`Invalid entry\n\nType back`);
      }
      return;
    }

    if (essays.hasOwnProperty(cmd)) {
      showSubjectMenu(cmd);
    } else {
      typeText(`Unknown command\n\nType help`);
    }
  }

  // =========================
  // MOBILE BACK BUTTON
  // =========================
  function mobileBackHandler(e) {
    if (e.target.tagName === "INPUT") return;
    if (isTyping) {
      skipTyping();
    } else {
      showMenu();
    }
  }

  if (/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    window.addEventListener("popstate", mobileBackHandler);
    document.addEventListener("touchstart", mobileBackHandler, { passive: true });
  }

  menuInput.focus();

});
