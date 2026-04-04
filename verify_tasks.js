import { normalizeText } from "./src/utils/normalization.js";
import { scrubPii } from "./src/services/privacy.service.js";
import * as detectionService from "./src/services/detections.service.js";

const testMessage = "Hеllo John Smith, your account 1234-5678-9012 is locked. Verify at http://chаse-vеrify.com";
// Note: The 'е' in Hеllo and 'а', 'е' in chаse-vеrify are Cyrillic homoglyphs.

console.log("--- 🛡️ TASK 1: HOMOGLYPH DETECTION ---");
const { normalizedText, isDeceptive } = normalizeText(testMessage);
console.log("Original:", testMessage);
console.log("Normalized:", normalizedText);
console.log("Is Deceptive?:", isDeceptive);

console.log("\n--- 🕵️ TASK 2: PII SCRUBBING ---");
const scrubbed = scrubPii(testMessage);
console.log("Scrubbed:", scrubbed);

console.log("\n--- 🚀 UNIFIED ANALYSIS RESULT ---");
const analysis = detectionService.quickHeuristics(testMessage);
console.log(JSON.stringify(analysis, null, 2));
