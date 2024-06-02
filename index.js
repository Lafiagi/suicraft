#!/usr/bin/env node

import { execSync } from "child_process";
import fs from "fs";
import degit from "degit";
import os from "os";
import inquirer from "inquirer";

// Function to check and install prerequisites and Sui
const checkAndInstallSui = () => {
  const platform = os.platform();

  const installCargo = () => {
    try {
      execSync("cargo --version", { stdio: "ignore" });
      console.log("Cargo is already installed.\n");
    } catch {
      console.log("Installing Cargo...\n");
      execSync("curl https://sh.rustup.rs -sSf | sh -s -- -y", {
        stdio: "inherit",
      });
      execSync("source $HOME/.cargo/env", { stdio: "inherit" });
    }
  };

  const installPrerequisites = () => {
    if (platform === "darwin") {
      console.log("Installing prerequisites for macOS...\n");
      execSync("brew install cmake libpq curl git", { stdio: "inherit" });
      installCargo();
    } else if (platform === "linux") {
      console.log("Installing prerequisites for Linux...\n");
      execSync(
        "sudo apt-get update && sudo apt-get install -y cmake gcc libssl-dev libclang-dev libpq-dev build-essential curl git",
        { stdio: "inherit" }
      );
      installCargo();
    } else if (platform === "win32") {
      console.log("Installing prerequisites for Windows...\n");
      execSync(
        'choco install curl git cmake llvm --installargs "ADD_CMAKE_TO_PATH=System"',
        { stdio: "inherit" }
      );
      console.log(
        "Please manually install C++ build tools from https://visualstudio.microsoft.com/visual-cpp-build-tools/\n"
      );
      installCargo();
    } else {
      console.log(`Unsupported platform: ${platform}\n`);
      console.log(
        "Please follow the instructions at https://docs.sui.io/guides/developer/getting-started/sui-install\n"
      );
      return;
    }
  };

  try {
    execSync("sui --version", { stdio: "ignore" });
    console.log("Sui is installed.\n");
  } catch {
    console.log("Sui is not installed. \n Installing prerequisites...\n");
    installPrerequisites();
    console.log("\nInstalling Sui...\n");
    execSync(
      "cargo install --locked --git https://github.com/MystenLabs/sui.git --branch devnet sui",
      { stdio: "inherit" }
    );
  }
};

// Function to setup Sui Move project
const setupSuiMoveProject = async (projectName) => {
  console.log(`Setting up Sui Move project: ${projectName}\n`);
  execSync(`mkdir ${projectName}`);
  process.chdir(projectName);
  execSync(`sui move new ${projectName}`, { stdio: "inherit" });
  // Fetch boilerplate code from Sui foundation repo
  const repo = degit("github:sui-foundation/sui-move-intro-course/unit-two", {
    force: true,
  });
  await repo.clone("./examples");
};

const setupProject = (projectName) => {
  // Create project folder
  execSync(`mkdir ${projectName}`);
  process.chdir(projectName);

  // Initialize Git repository
  console.log("Initializing Git repository...\n");
  execSync("git init", { stdio: "inherit" });
};

const setupFullstackWeb = async (projectName) => {
  console.log(`Setting up Fullstack Web project: ${projectName}\n`);

  setupProject(projectName);

  // Setup smart contracts
  console.log("Setting up smart contracts...\n");
  execSync(`mkdir ${projectName}_smart_contracts`);
  process.chdir(`${projectName}_smart_contracts`);
  execSync(`sui move new ${projectName}`, { stdio: "inherit" });
  console.log("Smart contracts setup complete.\n");

  // Move back to the main project folder
  process.chdir("..");

  // Setup frontend
  console.log("Setting up frontend...\n");
  execSync(`npx create-react-app ${projectName}_frontend`, {
    stdio: "inherit",
  });
  const repo = degit("dantheman8300/enoki-example-app", { force: true });
  await repo.clone("./frontend_sample");
  console.log("Frontend setup complete.\n");
};

const setupFullstackMobile = async (projectName) => {
  console.log(`Setting up Fullstack Mobile project: ${projectName}\n`);

  setupProject(projectName);

  // Setup smart contracts
  console.log("Setting up smart contracts...\n");
  execSync(`mkdir ${projectName}_smart_contracts`);
  process.chdir(`${projectName}_smart_contracts`);
  execSync(`sui move new ${projectName}`, { stdio: "inherit" });
  console.log("Smart contracts setup complete.\n");

  // Move back to the main project folder
  process.chdir("..");

  // Setup mobile app using React Native
  console.log("Setting up mobile app...\n");
  execSync(`npx react-native init ${projectName}_mobile`, { stdio: "inherit" });
  const repo = degit("dantheman8300/enoki-example-app", { force: true });
  console.log("Fetching mobile integration sample code...\n");
  await repo.clone("./mobile_sample");
  console.log("\nMobile setup complete.\n");
};

// Function to initialize git and setup project files
const setupGitAndFiles = (projectName) => {
  console.log("\nInitializing Git repository...\n");
  execSync("git init", { stdio: "inherit" });
  fs.writeFileSync(
    "README.md",
    `# ${projectName}\n\nGenerated by create-sui-app.`
  );
  fs.writeFileSync(".gitignore", "node_modules\nbuild\n");
};

(async () => {
    let projectName = process.argv[2];

    if (!projectName) {
        const response = await inquirer.prompt([
            {
                type: "input",
                name: "projectName",
                message: "Enter the project name:",
            },
        ]);
        projectName = response.projectName;
    }

    const { projectType } = await inquirer.prompt([
        {
            type: "list",
            name: "projectType",
            message: "Select the project type:",
            choices: ["Sui Smart Contract", "Fullstack Web", "Fullstack Mobile"],
        },
    ]);

    if (projectType === "Sui Smart Contract") {
        checkAndInstallSui();
        await setupSuiMoveProject(projectName);
    } else if (projectType === "Fullstack Web") {
        await setupFullstackWeb(projectName);
    } else if (projectType === "Fullstack Mobile") {
        await setupFullstackMobile(projectName);
    }

    setupGitAndFiles(projectName);
    console.log("\nProject setup complete.\n");
})();
