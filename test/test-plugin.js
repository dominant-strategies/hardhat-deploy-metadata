const { expect } = require("chai");
const { useEnvironment } = require("./helpers");

describe("Hardhat IPFS Metadata Plugin", function () {
  // 1) Test using a project that DOES have `bytecodeHash: "ipfs"`
  describe("when using the ipfs-project fixture", function () {
    useEnvironment("ipfs-project");

    it("should attach 'deployABI.pushMetadataToIPFS' to the Hardhat environment", function () {
      // this.env is the Hardhat Runtime Environment loaded from helpers.js
      expect(this.env.deployABI).to.be.an("object");
      expect(this.env.deployABI.pushMetadataToIPFS).to.be.a("function");
    });

    it("should not throw an error for missing 'bytecodeHash'", async function () {
      // In the fixture, we set 'bytecodeHash' to 'ipfs' so it should pass.
      // Let's compile a sample contract to ensure everything runs.
      await this.env.run("compile");

      // If there's a contract named "TestContract", let's call the plugin function
      const ipfsHash = await this.env.deployABI.pushMetadataToIPFS("TestContract");

      // The plugin returns the IPFS hash from the metadata in the bytecode
      expect(ipfsHash).to.be.a("string");
      expect(ipfsHash.length).to.be.equal(46);
      console.log(`Retrieved IPFS hash: ${ipfsHash}`);
    });
  });

  // 2) Optionally, test a fixture that does NOT have 'bytecodeHash' set
  //    to ensure your plugin properly throws an error.
  describe("when using a project with no ipfs setting", function () {
    // Suppose you have another fixture called "no-ipfs-project"
    // that sets `bytecodeHash: "none"` or leaves it out.
    useEnvironment("no-ipfs-project");

    it("should throw an error if 'bytecodeHash' is not set to 'ipfs'", async function () {
      let errorThrown = false;
      try {
        await this.env.run("compile");
        await this.env.deployABI.pushMetadataToIPFS("TestContract");
      } catch (err) {
        errorThrown = true;
        expect(err.message).to.contain("You must set `bytecodeHash: 'ipfs'`");
      }
      expect(errorThrown).to.equal(true, "Expected error for missing IPFS setting");
    });
  });
});