const addSubjectBtn = document.getElementById("addSubjectBtn");
const generatePlanBtn = document.getElementById("generatePlanBtn");
const subjectsContainer = document.getElementById("subjectsContainer");
const hoursPerDayInput = document.getElementById("hoursPerDay");
const daysToPlanInput = document.getElementById("daysToPlan");
const clearAllBtn = document.getElementById("clearAllBtn");
clearAllBtn.addEventListener("click", () => {
  hoursPerDayInput.value = "";
  daysToPlanInput.value = "";
  subjectsContainer.innerHTML = "";
  subjectsContainer.appendChild(createSubjectCard());

  const result = document.getElementById("result");
  result.innerHTML = "<p>Aquí aparecerá tu plan personalizado.</p>";

  localStorage.removeItem("studyflowData");
});

function saveData() {
  const subjectCards = document.querySelectorAll(".subject-card");
  const result = document.getElementById("result");

  const subjects = [];

  subjectCards.forEach((card) => {
    subjects.push({
      name: card.querySelector(".subject-name").value,
      examDays: card.querySelector(".subject-exam-days").value,
      difficulty: card.querySelector(".subject-difficulty").value
    });
  });

  const data = {
    hoursPerDay: hoursPerDayInput.value,
    daysToPlan: daysToPlanInput.value,
    subjects: subjects,
    generatedPlan: result.innerHTML
  };

  localStorage.setItem("studyflowData", JSON.stringify(data));
}

function createSubjectCard(subject = { name: "", examDays: "", difficulty: "facil" }) {
  const subjectCard = document.createElement("div");
  subjectCard.classList.add("subject-card");

  subjectCard.innerHTML = `
    <input type="text" class="subject-name" placeholder="Nombre de la asignatura" value="${subject.name}" />
    <input type="number" class="subject-exam-days" min="1" placeholder="Días hasta el examen" value="${subject.examDays}" />
    <select class="subject-difficulty">
      <option value="facil" ${subject.difficulty === "facil" ? "selected" : ""}>Fácil</option>
      <option value="media" ${subject.difficulty === "media" ? "selected" : ""}>Media</option>
      <option value="dificil" ${subject.difficulty === "dificil" ? "selected" : ""}>Difícil</option>
    </select>
    <button type="button" class="delete-btn">Eliminar</button>
  `;

  const deleteBtn = subjectCard.querySelector(".delete-btn");
  deleteBtn.addEventListener("click", () => {
    subjectCard.remove();
    saveData();
  });

  subjectCard.querySelector(".subject-name").addEventListener("input", saveData);
  subjectCard.querySelector(".subject-exam-days").addEventListener("input", saveData);
  subjectCard.querySelector(".subject-difficulty").addEventListener("change", saveData);

  return subjectCard;
}

function loadData() {
  const savedData = localStorage.getItem("studyflowData");
  const result = document.getElementById("result");

  if (!savedData) return;

  const data = JSON.parse(savedData);

  hoursPerDayInput.value = data.hoursPerDay || "";
  daysToPlanInput.value = data.daysToPlan || "";

  subjectsContainer.innerHTML = "";

  if (data.subjects && data.subjects.length > 0) {
    data.subjects.forEach((subject) => {
      const subjectCard = createSubjectCard(subject);
      subjectsContainer.appendChild(subjectCard);
    });
  } else {
    subjectsContainer.appendChild(createSubjectCard());
  }

  if (data.generatedPlan) {
    result.innerHTML = data.generatedPlan;
  }
}

hoursPerDayInput.addEventListener("input", saveData);
daysToPlanInput.addEventListener("input", saveData);

addSubjectBtn.addEventListener("click", () => {
  const subjectCard = createSubjectCard();
  subjectsContainer.appendChild(subjectCard);
  saveData();
});

generatePlanBtn.addEventListener("click", () => {
  const hoursPerDay = Number(hoursPerDayInput.value);
  const daysToPlan = Number(daysToPlanInput.value);
  const subjectCards = document.querySelectorAll(".subject-card");
  const result = document.getElementById("result");

  let subjects = [];
  let errors = [];

  if (!hoursPerDay || hoursPerDay <= 0) {
    errors.push("Las horas disponibles al día deben ser mayores que 0.");
  }

  if (!daysToPlan || daysToPlan <= 0) {
    errors.push("Los días a planificar deben ser mayores que 0.");
  }

  if (subjectCards.length === 0) {
    errors.push("Debes añadir al menos una asignatura.");
  }

  subjectCards.forEach((card, index) => {
    const name = card.querySelector(".subject-name").value.trim();
    const examDays = Number(card.querySelector(".subject-exam-days").value);
    const difficulty = card.querySelector(".subject-difficulty").value;

    if (!name) {
      errors.push(`La asignatura ${index + 1} no tiene nombre.`);
    }

    if (!examDays || examDays <= 0) {
      errors.push(`La asignatura ${index + 1} debe tener días hasta examen mayores que 0.`);
    }

    if (name && examDays > 0) {
      let difficultyValue = 1;
      if (difficulty === "media") difficultyValue = 2;
      if (difficulty === "dificil") difficultyValue = 3;

      subjects.push({
        name,
        examDays,
        difficulty,
        difficultyValue,
        studiedHours: 0
      });
    }
  });

  if (errors.length > 0) {
    let errorHtml = `<div class="message error-message"><h3>Revisa esto:</h3><ul>`;
    errors.forEach((error) => {
      errorHtml += `<li>${error}</li>`;
    });
    errorHtml += `</ul></div>`;
    result.innerHTML = errorHtml;
    return;
  }

  let html = `<div class="message success-message"><h3>Plan generado:</h3></div>`;

  for (let day = 1; day <= daysToPlan; day++) {
    let remainingHours = hoursPerDay;

    const availableSubjects = subjects
      .map((subject) => {
        const daysLeft = subject.examDays - (day - 1);

        if (daysLeft <= 0) {
          return null;
        }

        const priority =
          (subject.difficultyValue * 10) / daysLeft - subject.studiedHours * 0.15;

        return {
          ...subject,
          daysLeft,
          priority
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.priority - a.priority);

    html += `<div class="day-plan">`;
    html += `<h4>Día ${day}</h4>`;

    if (availableSubjects.length === 0) {
      html += `<p>No quedan asignaturas pendientes para este día.</p>`;
      html += `</div>`;
      continue;
    }

    const dailyPlan = {};
    let index = 0;

    while (remainingHours > 0 && availableSubjects.length > 0) {
      const subject = availableSubjects[index % availableSubjects.length];
      const realSubject = subjects.find((s) => s.name === subject.name);

      if (!dailyPlan[subject.name]) {
        dailyPlan[subject.name] = 0;
      }

      dailyPlan[subject.name] += 1;
      realSubject.studiedHours += 1;
      remainingHours -= 1;
      index++;
    }

    html += `<ul>`;

    for (const subjectName in dailyPlan) {
      html += `<li>${subjectName} - ${dailyPlan[subjectName]}h</li>`;
    }

    html += `</ul></div>`;
  }

  result.innerHTML = html;
saveData();
});

loadData();