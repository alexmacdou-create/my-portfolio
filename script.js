document.addEventListener("DOMContentLoaded", () => {

  const output = document.getElementById("output");
  const input = document.getElementById("commandInput");

  let essays = {};
  let currentSubject = null;

  // Typing control
  let typingTimeout = null;
  let isTyping = false;

  // =========================
  // TYPEWRITER FUNCTION
  // =========================
  function typeText(text, speed = 10) {
    // Cancel any ongoing typing
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

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
  // LOAD JSON INDEX
  // =========================
  fetch("essays/index.json")
    .then(response => response.json())
    .then(data => {
      essays = data;
      showMenu();
    })
    .catch(err => {
      output.textContent = "Failed to load essays index.";
      console.error(err);
    });

  // =========================
  // MAIN MENU
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

  // =========================
  // SUBJECT MENU
  // =========================
  function showSubjectMenu(subject) {
    currentSubject = subject;
    const list = essays[subject].join("\n- ");

    typeText(`
${subject.toUpperCase()} ESSAYS

Type one of the following to view the essay:

- ${list}

Type 'help' to return
`);
  }

  // =========================
  // LOAD ESSAY (NO TYPING)
  // =========================
  function loadEssay(subject, essayName) {
    // Cancel typing immediately
    if (typingTimeout) {
      clearTimeout(typingTimeout);
      isTyping = false;
    }

    output.textContent = "Loading...\n";

    const filePath = `essays/${subject}/${essayName}.txt`;

    fetch(filePath)
      .then(response => {
        if (!response.ok) throw new Error("File not found");
        return response.text();
      })
      .then(text => {
        output.textContent = text + "\n\nType help to return";
      })
      .catch(err => {
        output.textContent = `Essay not found: ${subject} ${essayName}\n\nType help`;
        console.error(err);
      });
  }

  // =========================
  // COMMAND HANDLER
  // =========================
  function runCommand(cmd) {
    if (!cmd) return;

    cmd = cmd.toLowerCase().trim();

    // Cancel typing if user interrupts
    if (isTyping && typingTimeout) {
      clearTimeout(typingTimeout);
      isTyping = false;
    }

    if (cmd === "help") {
      showMenu();
      return;
    }

    // If inside subject menu
    if (currentSubject) {
      if (essays[currentSubject].includes(cmd)) {
        loadEssay(currentSubject, cmd);
      } else {
        typeText(`Invalid essay for ${currentSubject}: ${cmd}\n\nType help to return`);
      }
      return;
    }

    // Main menu
    if (essays.hasOwnProperty(cmd)) {
      showSubjectMenu(cmd);
    } else {
      typeText(`Invalid command: ${cmd}\n\nType help to return`);
    }
  }

  // =========================
  // INPUT LISTENER
  // =========================
  input.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      e.preventDefault();
      runCommand(input.value);
      input.value = "";
    }
  });

  input.focus();

});
