import fs from "fs/promises";
import path from "path";
import os from "os";
import readline from "readline";

const CONFIG_PATH = path.join(os.homedir(), ".apnagitconfig.json");
const DEFAULT_API_URL = process.env.API_URL || "http://localhost:3000";

// Helper to ask question in terminal
export function promptQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans.trim());
    });
  });
}

// Get stored CLI auth session
export async function getCliAuth() {
  try {
    const data = await fs.readFile(CONFIG_PATH, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    return null;
  }
}

// Save CLI auth session
export async function saveCliAuth(session) {
  try {
    await fs.writeFile(CONFIG_PATH, JSON.stringify(session, null, 2));
  } catch (err) {
    console.error("Failed to save CLI config:", err);
  }
}

// Check if authenticated; if not, prompt interactive login
export async function ensureAuth() {
  let auth = await getCliAuth();
  if (auth && auth.token) {
    return auth;
  }

  console.log("\n🔒 You are not logged in to ApnaGit.");
  console.log("Please authenticate to continue:\n");

  await loginCli();

  auth = await getCliAuth();
  if (!auth || !auth.token) {
    console.error("❌ Authentication required. Operation cancelled.\n");
    return null;
  }
  return auth;
}

// Interactive apnagit login command
export async function loginCli(argv = {}) {
  try {
    let email = argv.email;
    let password = argv.password;
    let serverUrl = argv.server || DEFAULT_API_URL;

    console.log("\n🔑 ApnaGit Authentication");
    console.log("------------------------");

    if (!email) {
      email = await promptQuestion("Enter your email: ");
    }

    if (!password) {
      password = await promptQuestion("Enter your password: ");
    }

    if (!email || !password) {
      console.error("❌ Email and password are required.");
      return;
    }

    console.log(`Connecting to server: ${serverUrl}...`);

    const response = await fetch(`${serverUrl}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`❌ Login failed: ${data.message || "Invalid credentials"}`);
      return;
    }

    const session = {
      token: data.token,
      userId: data.userId,
      email,
      serverUrl,
      loggedInAt: new Date().toISOString(),
    };

    await saveCliAuth(session);

    console.log("\n✅ Successfully authenticated with ApnaGit!");
    console.log(`Logged in as: ${email}`);
    console.log(`Session saved in ${CONFIG_PATH}\n`);
  } catch (error) {
    console.error("❌ Login error:", error.message || error);
  }
}

// Logout command
export async function logoutCli() {
  try {
    await fs.unlink(CONFIG_PATH);
    console.log("✅ Successfully logged out from ApnaGit.");
  } catch (err) {
    console.log("Already logged out.");
  }
}

// Whoami command
export async function whoamiCli() {
  const auth = await getCliAuth();
  if (auth && auth.email) {
    console.log(`Logged in as: ${auth.email}`);
    console.log(`User ID: ${auth.userId}`);
    console.log(`Server: ${auth.serverUrl || DEFAULT_API_URL}`);
  } else {
    console.log("Not logged in. Run 'apnagit login' to authenticate.");
  }
}
