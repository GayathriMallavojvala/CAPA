// Match observed defect descriptions to supported defect families.
const symptoms = {
  Scratches:
    /\b(?:scoring|score marks?|lengthwise scor(?:e|es)|narrow scor(?:e|es)|scored lines?|(?:thin|narrow|fine) (?:parallel |longitudinal |lengthwise )?(?:grooves?|lines?|marks?) (?:running |along |across |on ))/i,

  Crazing:
    /(?:network|web|interconnected|mesh).{0,45}(?:hairline|fine|cracks)|(?:fine|hairline) cracks.{0,35}(?:network|web|mesh)/i,

  Inclusion:
    /(?:embedded|trapped).{0,30}(?:particle|foreign material)|(?:foreign|nonmetallic|non-metallic) particle.{0,30}(?:inside|embedded|trapped)/i,

  Patches:
    /\b(?:blotchy|blotches|patchy discoloration)\b/i,

  Pitted_Surface:
    /\b(?:pits|tiny pits|small (?:recessed )?(?:cavities|pits)|pinprick depressions)\b/i,

  "Rolled-in_Scale":
    /(?:oxide|scale).{0,35}(?:pressed|rolled|embedded).{0,25}(?:strip|surface|steel)/i,

  Crescent_Gap:
    /crescent.{0,30}(?:missing|notch|cutout)|semicircular notch/i,

  Waist_Folding:
    /waist.{0,30}(?:folded|folding|fold)/i,

  Weld_Line_Defect:
    /(?:seam|joint).{0,25}(?:open|split)|(?:split|opening).{0,25}weld/i,

  Water_Oil_Spot:
    /(?:oily|water|oil).{0,16}(?:stains?|droplet marks?)|droplet.{0,20}(?:stains?|residue)/i
};

function normalizeObservation(text) {
  return String(text)
    .toLowerCase()
    .replace(/\bsurfsce\b|\bsurfac\b|\bsurfce\b/g, "surface")
    .replace(/\bcraks\b|\bcracs\b|\bcrakses\b|\bcrackes\b/g, "cracks")
    .replace(/\bcrazng\b|\bcrazzing\b/g, "crazing");
}

function observationClauses(text) {
  return normalizeObservation(text)
    .split(/[.;!?\n]|\b(?:but|however)\b/i)
    .map(clause => clause.trim())
    .filter(Boolean);
}

function isObservedClause(clause) {
  return !/\b(?:no|not|without|possible|possibly|suspected|maybe|yesterday|previous|historical|training|check for|inspect for|look for|awaiting|ruled out)\b/i.test(
    clause
  );
}

function identify(text, taxonomy) {
  const found = new Map();

  for (const clause of observationClauses(text)) {
    if (!isObservedClause(clause)) continue;

    for (const [id, term] of Object.entries(taxonomy)) {
      const namedMatch = new RegExp(
        "\\b(?:" + term + ")\\b",
        "i"
      ).test(clause);

      if (namedMatch || symptoms[id]?.test(clause)) {
        found.set(id, clause);
      }
    }
  }

  return [...found].map(([id, quote]) => ({ id, quote }));
}

function interpretObservation(text, taxonomy) {
  const matches = identify(text, taxonomy);
  const observed = observationClauses(text).filter(isObservedClause);

  const hasCrack = observed.some(clause =>
    /\bcracks?\b/.test(clause)
  );

  if (
    hasCrack &&
    (
      matches.length === 0 ||
      matches.every(match => match.id === "Crazing")
    )
  ) {
    const network = observed.some(clause =>
      /(?:network|web|mesh|interconnected|intersecting|spider).{0,70}cracks?|cracks?.{0,70}(?:network|web|mesh|interconnected|intersecting|spider)/i.test(
        clause
      )
    );

    if (network && !text.includes("?")) {
      return {
        decision: "draft",
        family: "Crazing",
        basis: "Reported network of surface cracks"
      };
    }

    return {
      decision: "crack_question",
      family: null
    };
  }

  if (matches.length === 1 && !text.includes("?")) {
    return {
      decision: "draft",
      family: matches[0].id,
      basis: "Matched observation"
    };
  }

  return {
    decision: "clarify",
    family: null
  };
}

if (typeof module !== "undefined") {
  module.exports = identify;
  module.exports.interpretObservation = interpretObservation;
}
