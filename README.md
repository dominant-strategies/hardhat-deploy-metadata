In hardhat.config.js: require("@quai/hardhat-deploy-metadata")

In hardhat deploy.js script:

const { deployABI } = require("hardhat")

const ipfsHash = await deployABI.pushMetadataToIPFS("ContractName");

const factory = new quais.ContractFactory(contract.abi, contract.bytecode, wallet, ipfsHash)
