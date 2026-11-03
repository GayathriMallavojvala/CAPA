// Descriptions of observed morphology. Unknown or overlapping families require review.
const symptoms = {
  Scratches: /\b(?:scoring|score marks?|lengthwise scor(?:e|es)|narrow scor(?:e|es)|scored lines?|(?:thin|narrow|fine) (?:parallel |longitudinal |lengthwise )?(?:grooves?|lines?|marks?) (?:running |along |across |on ))/i,
  Crazing: /(?:network|web|interconnected|mesh).{0,45}(?:hairline|fine|cracks)|(?:fine|hairline) cracks.{0,35}(?:network|web|mesh)/i,
  Inclusion: /(?:embedded|trapped).{0,30}(?:particle|foreign material)|(?:foreign|nonmetallic|non-metallic) particle.{0,30}(?:inside|embedded|trapped)/i,
  Patches: /\b(?:blotchy|blotches|patchy discoloration)\b/i,
  Pitted_Surface: /\b(?:pits|tiny pits|small (?:recessed )?(?:cavities|pits)|pinprick depressions)\b/i,
  'Rolled-in_Scale': /(?:oxide|scale).{0,35}(?:pressed|rolled|embedded).{0,25}(?:strip|surface|steel)/i,
  Crescent_Gap: /crescent.{0,30}(?:missing|notch|cutout)|semicircular notch/i,
  Waist_Folding: /waist.{0,30}(?:folded|folding|fold)/i,
  Weld_Line_Defect: /(?:seam|joint).{0,25}(?:open|split)|(?:split|opening).{0,25}weld/i,
  Water_Oil_Spot: /(?:oily|water|oil).{0,16}(?:stains?|droplet marks?)|droplet.{0,20}(?:stains?|residue)/i
};
function identify(text, taxonomy) {
  const found = new Map();
  for (const part of text.split(/[.;!?\n]|\b(?:but|however)\b/i)) {
    const clause = part.trim();
    if (!clause || /\b(?:no|not|without|possible|possibly|suspected|maybe|yesterday|previous|historical|training|check for|inspect for|look for|awaiting|ruled out)\b/i.test(clause)) continue;
    for (const [id, term] of Object.entries(taxonomy)) {
      if (new RegExp('\\b(?:'+term+')\\b','i').test(clause) || symptoms[id]?.test(clause)) found.set(id, clause);
    }
  }
  return [...found].map(([id,quote])=>({id,quote}));
}
if(typeof module!=='undefined') module.exports=identify;
