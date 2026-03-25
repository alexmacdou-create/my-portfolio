document.addEventListener("DOMContentLoaded", () => {

  const terminal = document.getElementById("terminal");
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

  function attachInputListener(el) {
    el.addEventListener("keydown", e => {
      if (isTyping) {
        e.preventDefault();
        skipTyping();
        return;
      }

      // ENTER
      if (e.key === "Enter") {
        e.preventDefault();
        const cmd = el.value.trim();
        if (cmd) {
          commandHistory.push(cmd);
          historyIndex = commandHistory.length;
        }
        runCommand(cmd);
        el.value = "";
      }

      // UP / DOWN arrows
      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (historyIndex > 0) {
          historyIndex--;
          el.value = commandHistory[historyIndex];
        }
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (historyIndex < commandHistory.length - 1) {
          historyIndex++;
          el.value = commandHistory[historyIndex];
        } else {
          el.value = "";
        }
      }
    });
  }

  attachInputListener(input);

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
      if (typingTimeout) {
        clearTimeout(typingTimeout);
        isTyping = false;
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
    setTimeout(() => {
      showMenu();
    }, 3000);
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
  // LOAD ESSAY (WITH TYPING)
  // =========================
  function loadEssay(subject, essayName) {
    if (typingTimeout) {
      clearTimeout(typingTimeout);
      isTyping = false;
    }

    output.textContent = "Loading...\n";

    fetch(`essays/${subject}/${essayName}.txt`)
      .then(res => {
        if (!res.ok) throw new Error();
        return res.text();
      })
      .then(text => {
        // Top input stays; create bottom input if needed
        ensureBottomInput();

        // Fast typing for essays
        typeText("Type back to return.\n\n" + text + "\n\nType back to return", 0.125);

        // Scroll top input into view
        input.scrollIntoView({ behavior: "smooth" });
      })
      .catch(() => {
        typeText(`Error: file not found\n\nType help`);
      });
  }

  // =========================
  // DUPLICATE INPUT AT BOTTOM
  // =========================
  function ensureBottomInput() {
    if (!document.getElementById("bottomCommandInput")) {
      const bottomLine = input.parentElement.cloneNode(true);
      bottomLine.id = "bottomInputLine";
      const bottomInput = bottomLine.querySelector("input");
      bottomInput.id = "bottomCommandInput";
      bottomInput.placeholder = "Type command + ENTER";
      attachInputListener(bottomInput);
      terminal.appendChild(bottomLine);
    }
  }

  // =========================
  // COMMAND HANDLER
  // =========================
  function runCommand(cmd) {
    if (!cmd) return;
    cmd = cmd.toLowerCase().trim();

    if (isTyping && typingTimeout) {
      clearTimeout(typingTimeout);
      isTyping = false;
    }

    if (cmd === "help") {
      showMenu();
      return;
    }

    if (currentSubject) {
      if (essays[currentSubject].includes(cmd)) {
        loadEssay(currentSubject, cmd);
      } else if (cmd === "back") {
        showMenu();
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

  // =========================
  // MOBILE BACK BUTTON
  // =========================
  if (/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    window.addEventListener("popstate", e => {
      if (isTyping) {
        skipTyping();
      } else {
        showMenu();
        input.focus();
      }
      history.pushState(null, "", location.href);
    });
    history.pushState(null, "", location.href);
  }

});
