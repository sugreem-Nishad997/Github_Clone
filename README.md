# ApnaGit

ApnaGit is a web-based repository hosting service with a command-line tool for
staging files, creating commit snapshots, and syncing them with your remote
repository.

## Live Demo

Try ApnaGit: [https://github-clone-seven-dusky.vercel.app](https://github-clone-seven-dusky.vercel.app)

## Features

- Register and verify your email address with a one-time password (OTP).
- Create public or private repositories and explore public repositories.
- Use the ApnaGit CLI to stage files, create commit snapshots, push changes to
  remote storage, and pull them back to your local project.
- Browse repository files and commit history in the web app.
- Track and discuss repository issues.
- Manage your account and view developer profiles.

## Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, React Router
- **Backend:** Node.js, Express
- **Database:** MongoDB with Mongoose
- **Storage:** AWS S3-compatible object storage for commit snapshots
- **Real-time communication:** Socket.IO
- **Authentication and email:** JSON Web Tokens (JWT), Nodemailer, email OTP
- **CLI:** Node.js, yargs

## Get started

### 1. Create and verify your account

Open the ApnaGit web app and register with your username, email address, and
password. Enter the six-digit OTP sent to your email to verify the address and
finish registration.

### 2. Create a repository

Sign in to ApnaGit, choose **Create Repository**, and create a repository. Note
its name; you will use the same name when initializing your local project.

### 3. Install the CLI

Install Node.js and npm, then install ApnaGit globally to make the `apnagit`
command available in your terminal:

```bash
npm install -g @sugreem_nishad_npm/apnagit@latest
```

If you prefer the local install command, run it from your project directory:

```bash
npm install @sugreem_nishad_npm/apnagit@latest
```

For a local install, run CLI commands with `npx` (for example,
`npx apnagit --help`) instead of invoking `apnagit` directly.

### 4. Log in and initialize your local project

In a terminal, change to the root folder of the project you want to upload. Log
in using the hosted ApnaGit API:

```bash
apnagit login --server https://github-clone-backend-rxak.onrender.com
```

Enter the same email address and password used to register. Then initialize
the local project with the repository name you created on the web:

```bash
apnagit init <repository-name>
```

Replace `<repository-name>` with the actual name, without the angle brackets.
For example:

```bash
apnagit init my-project
```

The CLI creates a `.apnaGit` folder in the current project. Run `init` from the
project root so that files are staged and committed from the correct folder.

> **Note:** `apnagit login` without `--server` connects to
> `http://localhost:3000`. Use the hosted API URL above for the ApnaGit web
> service, or pass the URL of your own running ApnaGit backend with
> `--server`.

## Everyday commands

Run these commands from your initialized project directory:

```bash
# Stage all supported project files
apnagit add .

# Or stage a specific file or directory
apnagit add path/to/file

# Save the staged files as a local commit snapshot
apnagit commit "Describe your changes"

# Upload commits and sync repository history with ApnaGit
apnagit push

# Download remote commits and restore their files locally
apnagit pull
```

`apnagit add .` excludes `.apnaGit`, `.git`, `node_modules`, `.env`, `dist`,
`build`, and `.DS_Store` from staging.

## All CLI commands

| Command | Description |
| --- | --- |
| `apnagit --help` | Show available commands and options. |
| `apnagit login` | Log in interactively. Add `--server <url>` to select the backend; `--email <email>` and `--password <password>` can also be supplied as options. |
| `apnagit logout` | Remove the saved CLI login. |
| `apnagit whoami` | Show the currently logged-in account and server. |
| `apnagit init [name]` | Initialize the current folder and optionally set its remote repository name. |
| `apnagit remote <name>` | Link the current local project to a remote repository name. |
| `apnagit add <file>` | Stage a file, directory, or all supported files with `.`. |
| `apnagit commit <message>` | Create a local snapshot from staged files. |
| `apnagit push` | Upload local commits and sync with the remote repository. |
| `apnagit pull` | Download remote commits and restore their files locally. |
| `apnagit revert <commitID>` | Restore files from a commit that exists in the local repository. |
| `apnagit start` | Start the ApnaGit REST and WebSocket server (for self-hosting/development). |

The CLI saves its login session in your home directory. Log out with
`apnagit logout` when you want to remove it.
