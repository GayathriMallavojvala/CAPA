const $ = id => document.getElementById(id);

const esc = value =>
  String(value).replace(
    /[&<>"']/g,
    character =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      })[character]
  );

const library = fetch("scenarios.json").then(response => {
  if (!response.ok) {
    throw new Error("Scenario data unavailable");
  }

  return response.json();
});

let current;
let scenario;
let description;
let history;
let record;

function table(headers, rows) {
  return (
    '<div class="scroll"><table><thead><tr>' +
    headers.map(header => "<th>" + esc(header) + "</th>").join("") +
    "</tr></thead><tbody>" +
    rows
      .map(
        row =>
          "<tr>" +
          row.map(value => "<td>" + esc(value) + "</td>").join("") +
          "</tr>"
      )
      .join("") +
    "</tbody></table></div>"
  );
}

async function generate() {
  description = $("desc").value.trim();

  if (!description) {
    $("result").innerHTML =
      "<section><p>Enter what you observed on the material.</p></section>";
    return;
  }

  const intake = interpretObservation(description, patterns);

  if (intake.decision === "crack_question") {
    current = null;

    $("result").innerHTML =
      "<section>" +
      "<h2>Surface cracking recognized</h2>" +
      "<p>Does the surface have many fine cracks joined together " +
      "like a web or network?</p>" +
      '<button id="networkYes">Yes · fine crack network</button> ' +
      '<button id="networkNo">No · isolated, long or edge cracks</button> ' +
      '<button id="networkUnsure">I am unsure</button>' +
      '<p id="crackHelp"></p>' +
      "</section>";

    $("networkYes").onclick = () => loadFamily("Crazing");

    $("networkNo").onclick = () => {
      $("crackHelp").textContent =
        "Record the crack location, direction and photographs for a " +
        "quality engineer. This prototype has no dedicated isolated-crack " +
        "or edge-crack model yet.";
    };

    $("networkUnsure").onclick = () => {
      $("crackHelp").textContent =
        "Ask an inspector to check whether the cracks form a fine " +
        "interconnected network. Your observation is preserved above.";
    };

    return;
  }

  if (intake.decision === "draft") {
    await loadFamily(intake.family);
    return;
  }

  current = null;

  $("result").innerHTML =
    "<section>" +
    "<h2>Please confirm the observation</h2>" +
    "<p>Select the observed defect if known, " +
    "or add its shape and location above.</p>" +
    '<select id="pick">' +
    '<option value="">Select a defect family…</option>' +
    Object.keys(patterns)
      .map(
        family =>
          '<option value="' +
          esc(family) +
          '">' +
          esc(family.replaceAll("_", " ")) +
          "</option>"
      )
      .join("") +
    "</select> " +
    '<button id="confirmFamily">Confirm observed defect</button>' +
    "</section>";

  $("confirmFamily").onclick = () => {
    if ($("pick").value) {
      loadFamily($("pick").value);
    }
  };
}

async function loadFamily(family) {
  try {
    const data = await library;

    scenario = data.scenarios.find(item => item.id === family);

    if (!scenario || !reports[family]) {
      throw new Error("Unsupported defect family");
    }

    current = structuredClone(reports[family]);
    history = [];
    record = createRecord();

    render();
  } catch {
    $("result").textContent =
      "Unable to load the scenario. Refresh and retry.";
  }
}

function render() {
  const remaining = scenario.tests.filter(
    test => !history.some(entry => entry.test === test.id)
  );

  const ranked = [...current.fmea].sort(
    (first, second) => second.current_weight - first.current_weight
  );

  const recordedEvidence = history
    .map(
      entry =>
        "<p>" +
        esc(entry.test) +
        " · " +
        esc(entry.outcome) +
        " · " +
        esc(entry.source) +
        "</p>"
    )
    .join("");

  const inspectionControls = remaining.length
    ? '<label for="test">Inspection</label>' +
      '<select id="test">' +
      remaining
        .map(
          test =>
            '<option value="' +
            esc(test.id) +
            '">' +
            esc(test.label) +
            "</option>"
        )
        .join("") +
      "</select>" +
      '<label for="out">Finding</label>' +
      '<select id="out"></select>' +
      '<label for="source">Inspection record or source</label>' +
      '<textarea id="source" rows="1"></textarea>' +
      '<button id="apply">Update assessment</button>'
    : "<p>All checks recorded.</p>";

  $("result").innerHTML =
    caseForms(ranked, remaining) +
    '<section class="controls">' +
    "<h2>Inspection evidence</h2>" +
    recordedEvidence +
    inspectionControls +
    "</section>";

  if (!remaining.length) return;

  function updateOutcomes() {
    const selectedTest = remaining.find(
      test => test.id === $("test").value
    );

    $("out").innerHTML = [
      ...selectedTest.outcomes,
      "inconclusive"
    ]
      .map(outcome => "<option>" + esc(outcome) + "</option>")
      .join("");
  }

  $("test").onchange = updateOutcomes;
  updateOutcomes();

  $("apply").onclick = () => {
    const source = $("source").value.trim();

    if (!source) {
      $("source").focus();
      return;
    }

    const selectedTest = remaining.find(
      test => test.id === $("test").value
    );

    const outcome = $("out").value;

    if (outcome !== "inconclusive") {
      const updatedWeights = current.fmea.map(row => {
        const likelihood =
          selectedTest.outcome_likelihoods[row.id]?.[outcome];

        return row.current_weight * likelihood;
      });

      const total = updatedWeights.reduce(
        (sum, weight) => sum + weight,
        0
      );

      if (
        !updatedWeights.every(weight => Number.isFinite(weight) && weight >= 0) ||
        !Number.isFinite(total) ||
        total <= 0
      ) {
        alert(
          "This finding cannot update the assessment because its " +
          "likelihood data is missing or invalid."
        );
        return;
      }

      current.fmea.forEach((row, index) => {
        row.current_weight = updatedWeights[index] / total;
      });
    }

    history.push({
      test: selectedTest.id,
      outcome,
      source
    });

    record.revision++;
    render();
  };
}

$("run").onclick = generate;

$("example").onclick = () => {
  $("desc").value =
    "Longitudinal scratches on a cold-rolled coil at final inspection.";

  generate();
};
