const path = require("path");
const fs = require("fs-extra");
const { resetHardhatContext } = require("hardhat/plugins-testing");

function useEnvironment(projectSubdir) {
  beforeEach("Loading hardhat environment", function () {
    const projectPath = path.join(__dirname, projectSubdir);
    if (!fs.existsSync(projectPath)) {
      throw new Error(`Test project folder '${projectSubdir}' not found in test/`);
    }

    // Change directory into the test fixture project
    process.chdir(projectPath);
    // Clear any require cache that might be left over
    resetHardhatContext();

    // Load a new Hardhat instance from this fixture
    this.env = require("hardhat");
  });

  afterEach("Reset hardhat context", function () {
    resetHardhatContext();
    // Move back out to the main plugin directory
    process.chdir(path.join(__dirname, "..", ".."));
  });
}

module.exports = { useEnvironment };