document.addEventListener("DOMContentLoaded", () => {

  const output = document.getElementById("output");

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
    // no longer used to prevent skipping animation
  }

  // =========================
  // COMMAND HISTORY
  // =========================
  let commandHistory = [];
  let historyIndex = -1;

  function attachInputHandler(input) {
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
  }

  // =========================
  // ESC KEY FOR GLOBAL RETURN
  // =========================
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      e.preventDefault();
      inputTop?.blur();
      inputBottom?.blur();
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
  // CREATE INPUT LINE FUNCTION
  // =========================
  function createInputLine(placeholderText = "Type command + ENTER") {
    const line = document.createElement("div");
    line.classList.add("inputLine");

    const prompt = document.createElement("span");
    prompt.classList.add("prompt");
    prompt.textContent = ">";

    const input = document.createElement("input");
    input.setAttribute("type", "text");
    input.setAttribute("placeholder", placeholderText);
    input.classList.add("commandInput");
    input.autocomplete = "off";

    line.appendChild(prompt);
    line.appendChild(input);

    return { line, input };
  }

  let inputBottom = null;
  let inputTop = null; // only used for essays

  // =========================
  // MENUS
  // =========================
  function showMenu() {
    currentSubject = null;

    // Clear essay top input if it exists
    if (inputTop) {
      inputTop.parentNode.remove();
      inputTop = null;
    }

    typeText(`
PORTFOLIO TERMINAL

Commands:

${Object.keys(essays).join("\n")}

help
`);

    // Ensure single bottom input
    if (!inputBottom) {
      const inputObj = createInputLine();
      document.getElementById("terminal").appendChild(inputObj.line);
      inputBottom = inputObj.input;
      attachInputHandler(inputBottom);
    }

    inputBottom.focus();
  }

  function showSubjectMenu(subject) {
    currentSubject = subject;

    // Remove top input if exists
    if (inputTop) {
      inputTop.parentNode.remove();
      inputTop = null;
    }

    typeText(`
${subject.toUpperCase()} ESSAYS

Type one of the following:

- ${essays[subject].join("\n- ")}

Type 'help' to return
`);

    if (!inputBottom) {
      const inputObj = createInputLine();
      document.getElementById("terminal").appendChild(inputObj.line);
      inputBottom = inputObj.input;
      attachInputHandler(inputBottom);
    }

    inputBottom.focus();
  }

  // =========================
  // LOAD ESSAY
  // =========================
  function loadEssay(subject, essayName) {
    currentSubject = subject;

    // Remove any existing top input
    if (inputTop) {
      inputTop.parentNode.remove();
      inputTop = null;
    }

    // Add top input for essays
    const topObj = createInputLine();
    output.parentNode.insertBefore(topObj.line, output);
    inputTop = topObj.input;
    attachInputHandler(inputTop);

    // Add bottom input if not present
    if (!inputBottom) {
      const bottomObj = createInputLine();
      output.parentNode.appendChild(bottomObj.line);
      inputBottom = bottomObj.input;
      attachInputHandler(inputBottom);
    }

    output.textContent = "Loading...\n";

    fetch(`essays/${subject}/${essayName}.txt`)
      .then(res => {
        if (!res.ok) throw new Error();
        return res.text();
      })
      .then(text => {
        typeText("Type 'back' to return.\n\n" + text + "\n\nType 'back' to return.", 0.125);
      })
      .catch(() => {
        typeText(`Error: file not found\n\nType 'back' to return`);
      });

    // Focus top input for essays
    inputTop.focus();
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
    if (currentSubject && essays[currentSubject].includes(cmd)) {
      loadEssay(currentSubject, cmd);
      return;
    }

    // Main menu
    if (essays.hasOwnProperty(cmd)) {
      showSubjectMenu(cmd);
    } else {
      typeText(`Unknown command\n\nType help`);
    }
  }

  inputBottom?.focus();

});
