// utils/backup.util.js
import bcrypt from "bcrypt";
import crypto from "crypto";

// ---- Env-config with sensible defaults ----
const BACKUP_CODE_COUNT = parseInt(process.env.BACKUP_CODE_COUNT, 10) || 5;
const BACKUP_CODE_LENGTH = parseInt(process.env.BACKUP_CODE_LENGTH, 10) || 8;
const BACKUP_CODE_SALT_ROUNDS = parseInt(process.env.BACKUP_CODE_SALT_ROUNDS, 10) || 10;

// Characters chosen to avoid confusion: no O, 0, I, l
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789";

// ---- Helpers ----

// crypto-strong random string from ALPHABET
function randomString(len) {
    const bytes = crypto.randomBytes(len);
    let out = "";
    for (let i = 0; i < len; i++) {
        out += ALPHABET[bytes[i] % ALPHABET.length];
    }
    return out;
}

// For display only (do NOT hash the dashed version)
export function formatCode(raw) {
    // 8 => XXXX-XXXX ; 10 => XXXXX-XXXXX ; generic split in half
    const mid = Math.floor(raw.length / 2);
    return `${raw.slice(0, mid)}-${raw.slice(mid)}`;
}

// ---- API ----

// Returns an array of plaintext codes (save/show once to the user)
export function generateBackupCodes(count = BACKUP_CODE_COUNT) {
    return Array.from({ length: count }, () => randomString(BACKUP_CODE_LENGTH));
}

// Hash each plaintext code with bcrypt; result ready to store in DB
export async function hashBackupCodes(plainCodes) {
    return Promise.all(
        plainCodes.map(async (code) => {
            const codeHash = await bcrypt.hash(code, BACKUP_CODE_SALT_ROUNDS);
            // Your user schema expects { code: <hash>, used: false }
            // We return a neutral shape so controller can map it cleanly.
            return { codeHash, used: false };
        }),
    );
}

// Normalize user-entered code before compare (strip spaces/dashes)
function normalize(input = "") {
    return String(input).replace(/[\s-]/g, "").trim();
}

// Compare input plaintext code against stored hashed entries
// storedEntries: array like [{ code: "<bcrypt-hash>", used: false }, ...]
export async function validateBackupCode(inputCode, storedEntries = []) {
    const raw = normalize(inputCode);
    for (const entry of storedEntries) {
        if (entry.used) continue;
        // support either .code or .codeHash (depending on caller)
        const hash = entry.code ?? entry.codeHash;
        if (hash && (await bcrypt.compare(raw, hash))) {
            return entry; // matched; caller should mark used+save
        }
    }
    return null;
}
