const crypto = require("crypto");
const readline = require("readline");

const ITERATIONS = 210000;
const KEYLEN = 32;
const DIGEST = "sha256";

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("base64");
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEYLEN, DIGEST).toString("base64");
  return `pbkdf2$${ITERATIONS}$${salt}$${hash}`;
}

function readPassword(prompt) {
  return new Promise((resolve, reject) => {
    process.stdout.write(prompt);
    const stdin = process.stdin;
    if (!stdin.isTTY) {
      // Non-interactive piped input: read a single line without echo control.
      const rl = readline.createInterface({ input: stdin, output: process.stdout, terminal: false });
      rl.once("line", (answer) => {
        rl.close();
        resolve(answer);
      });
      rl.once("close", () => {
        // Already resolved via 'line' in most cases; guard against double resolve.
      });
      return;
    }
    let buf = "";
    let resolved = false;
    function finish(value) {
      if (resolved) return;
      resolved = true;
      stdin.setRawMode(false);
      stdin.pause();
      stdin.removeAllListeners("data");
      stdin.removeAllListeners("error");
      resolve(value);
    }
    stdin.on("data", (chunk) => {
      const s = chunk.toString();
      for (const ch of s) {
        const code = ch.charCodeAt(0);
        if (code === 13 || code === 10) {
          // Enter
          process.stdout.write("\n");
          finish(buf);
          return;
        }
        if (code === 127 || code === 8) {
          // Backspace / delete
          if (buf.length > 0) {
            buf = buf.slice(0, -1);
            process.stdout.write("\b \b");
          }
        } else if (code >= 32 && code < 127) {
          buf += ch;
          process.stdout.write("*");
        }
        // Ctrl+C
        if (code === 3) {
          process.stdout.write("^C\n");
          finish("");
          return;
        }
      }
    });
    stdin.on("error", (err) => {
      if (!resolved) {
        resolved = true;
        reject(err);
      }
    });
    stdin.setRawMode(true);
    stdin.resume();
  });
}

async function main() {
  const password = process.argv[2];

  let finalPassword;
  if (password) {
    // Backward-compatible: password supplied as an argument.
    finalPassword = password;
  } else {
    // Interactive mode: password is read with hidden input (no echo, not logged).
    finalPassword = await readPassword("Enter admin password: ");
    const confirm = await readPassword("Confirm admin password: ");
    if (finalPassword !== confirm) {
      console.error("Passwords do not match.");
      process.exit(1);
    }
    if (!finalPassword) {
      console.error("Password must not be empty.");
      process.exit(1);
    }
  }

  if (!finalPassword) {
    console.error('Usage: node scripts/generate-admin-hash.js "your-password"');
    process.exit(1);
  }

  process.stdout.write(hashPassword(finalPassword) + "\n");
}

main().catch((err) => {
  console.error("Hash generation failed:", err && err.message ? err.message : err);
  process.exit(1);
});
