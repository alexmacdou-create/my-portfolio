document.addEventListener("DOMContentLoaded", () => {

  const output = document.getElementById("output");
  const terminal = document.getElementById("terminal");
  const input = document.getElementById("commandInput");

  let essays = {};
  let currentSubject = null;

  // =========================
  // TYPING SYSTEM (UPGRADED)
  // =========================
  let typingTimeout = null;
  let isTyping = false;
  let fullText = "";

  function typeText(text, speed = 10) {
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

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
      // If typing → skip instead of processing input
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

      // UP ARROW
      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (historyIndex > 0) {
          historyIndex--;
          el.value = commandHistory[historyIndex];
        }
      }

      // DOWN ARROW
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
  // MENUS (MAIN & SUBJECT)
  // =========================
  function showMenu() {
    currentSubject = null;

    // Remove any old top input
    const oldTop = document.getElementById("essayTopInput");
    if (oldTop) oldTop.remove();

    typeText(`
PORTFOLIO TERMINAL

Commands:

${Object.keys(essays).join("\n")}

help
`);
  }

  function showSubjectMenu(subject) {
    currentSubject = subject;

    // Remove any old top input
    const oldTop = document.getElementById("essayTopInput");
    if (oldTop) oldTop.remove();

    const list = essays[subject].join("\n- ");
    typeText(`
${subject.toUpperCase()} ESSAYS

Type one of the following:

- ${list}

Type 'help' to return
`);
  }

  // =========================
  // LOAD ESSAY (WITH TOP & BOTTOM INPUT)
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

        // Remove old top/bottom inputs if present
        const oldTop = document.getElementById("essayTopInput");
        const oldBottom = document.getElementById("essayBottomInput");
        if (oldTop) oldTop.remove();
        if (oldBottom) oldBottom.remove();

        // --- Top input for essay only ---
        const topLine = document.createElement("div");
        topLine.className = "inputLine";
        topLine.id = "essayTopInput";
        const topPrompt = document.createElement("span");
        topPrompt.className = "prompt";
        topPrompt.textContent = ">";
        const topInput = document.createElement("input");
        topInput.type = "text";
        topInput.placeholder = "Type command + ENTER";
        topInput.id = "topCommandInput";
        topInput.autocomplete = "off";
        topLine.appendChild(topPrompt);
        topLine.appendChild(topInput);
        terminal.insertBefore(topLine, output);
        attachInputListener(topInput);

        // --- Essay text ---
        typeText("Type back to return.\n\n" + text + "\n\nType back to return", 0.125);

        // --- Bottom input (always present) ---
        const bottomLine = document.createElement("div");
        bottomLine.className = "inputLine";
        bottomLine.id = "essayBottomInput";
        const bottomPrompt = document.createElement("span");
        bottomPrompt.className = "prompt";
        bottomPrompt.textContent = ">";
        const bottomInput = document.createElement("input");
        bottomInput.type = "text";
        bottomInput.placeholder = "Type command + ENTER";
        bottomInput.id = "bottomCommandInput";
        bottomInput.autocomplete = "off";
        bottomLine.appendChild(bottomPrompt);
        bottomLine.appendChild(bottomInput);
        terminal.appendChild(bottomLine);
        attachInputListener(bottomInput);

        topInput.scrollIntoView({ behavior: "smooth" });
        topInput.focus();

      })
      .catch(() => {
        typeText(`Error: file not found\n\nType help`);
      });
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

    if (cmd === "back") {
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

  // =========================
  // Mobile scroll/tap safety
  // =========================
  function mobileBackHandler(e) {
    if (e.target.tagName === "INPUT") return;
    if (isTyping) {
      skipTyping();
      return;
    }
    showMenu();
    input.focus();
  }

  if (/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    document.addEventListener("touchstart", mobileBackHandler, { passive: true });
  }

});
