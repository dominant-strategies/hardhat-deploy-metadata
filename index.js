const fs = require("fs");
const path = require("path");
const { parseFullyQualifiedName } = require("hardhat/utils/contract-names");
const Hash = require('ipfs-only-hash')
const CBOR = require('cbor-x')
const bs58 = require('bs58')
const { splitAuxdata, AuxdataStyle } = require('@ethereum-sourcify/bytecode-utils');
const { arrayify } = require('@ethersproject/bytes')
const { extendEnvironment } = require("hardhat/config");
const IPFS_URL = 'https://ipfs.qu.ai/api/v0'

async function pushMetadataToIPFS(hre, contractName) {

    // Load the artifact for the specified contract
    const { artifacts } = hre; // The Hardhat 'artifacts' object
    const artifact = await artifacts.readArtifact(contractName);
    const ipfsHash = await pushMetadataToIPFSWithBytecode(hre, artifact.deployedBytecode)
    return ipfsHash
  }

  async function pushMetadataToIPFSWithBytecode(hre, bytecode) {
    const { artifacts } = hre; // The Hardhat 'artifacts' object

    let metadataSections = decodeMultipleMetadataSections(bytecode)
  
    let ipfsEntries = []
    const fqNames = await artifacts.getAllFullyQualifiedNames();
    for (let fqn of fqNames) {
      const buildInfo = await artifacts.getBuildInfo(fqn);
      const { sourceName, contractName: name } = parseFullyQualifiedName(fqn);
      const contractOutput = buildInfo.output.contracts[sourceName][name];
      if (!contractOutput) {
        throw new Error(`CompilerOutputContract not found for ${name}.`);
      }
      const hash = await Hash.of(contractOutput.metadata)
      for (let metadata of metadataSections) {
        if (hash === metadata.ipfs) {
            ipfsEntries.push({ipfs: metadata.ipfs, name, metadata: contractOutput.metadata})
        }
      }
    }
    if (ipfsEntries.length === 0) {
      throw new Error(
        "Hardhat plugin error: No IPFS hash found in bytecode metadata. You must set `bytecodeHash: 'ipfs'` in your hardhat.config.js compiler settings:\n\n" +
        "  solidity: {\n" +
        "    compilers: [\n" +
        "      {\n" +
        "        version: '0.8.19',\n" +
        "        settings: {\n" +
        "          metadata: {\n" +
        "            bytecodeHash: 'ipfs',\n" +
        "            ...\n" +
        "          }\n" +
        "        }\n" +
        "      }\n" +
        "    ]\n" +
        "  }"
        );
    }
    const { create } = await import('kubo-rpc-client')
    const client = create({
      url: IPFS_URL,
    });
    try {
      for (let data of ipfsEntries) {
        const { cid } = await client.add(data.metadata);
        await client.pin.add(cid);
        console.log('File added with CID:', cid.toString());
        console.log("Original IPFS hash found in bytecode:", data.ipfs);
        if(data.ipfs !== cid.toString()) {
          throw new Error("IPFS hash in bytecode does not match the CID of the added metadata, want " + data.ipfs + " got " + cid.toString())
        }
        const outputPath = path.join(
          hre.config.paths.root,
          "metadata",
          `${data.name}_metadata.json`
        );
        const outputDir = path.dirname(outputPath);
        fs.mkdirSync(outputDir, { recursive: true });
        fs.writeFileSync(outputPath, JSON.stringify(data.metadata, null, 2));
  
        console.log(`Metadata JSON for ${data.name} saved to ${outputPath}`);
      }
  
    } catch (error) {
      console.error('Error adding file:', error);
      return ""
    }
    return ipfsEntries[0].ipfs
  }
  
  const decodeMultipleMetadataSections = (bytecode) => {
    if (!bytecode || bytecode.length === 0) {
        throw new Error("Bytecode cannot be empty");
    }
    bytecode = ensureHexPrefix(bytecode);
  
    const metadataSections = [];
    let remainingBytecode = bytecode;
  
    while (remainingBytecode.length > 0) {
      try {
        const [executionBytecode, auxdata] = splitAuxdata(remainingBytecode, AuxdataStyle.SOLIDITY);
  
        if (auxdata) {
          const decodedMetadata = CBOR.decode(arrayify(`0x${auxdata}`));
          metadataSections.push(decodedMetadata);
          remainingBytecode = executionBytecode;
        } else {
          break;
        }
      } catch (error) {
        console.log(error)
        break;
      }
    }
  
    return metadataSections.map((metadata) => ({
      ...metadata,
      ipfs: metadata.ipfs ? bs58.default.encode(metadata.ipfs) : undefined,
    }));
  };
  const ensureHexPrefix = (bytecode) => {
    return bytecode.startsWith('0x') ? bytecode : `0x${bytecode}`;
  };

  // Extend Hardhat's environment
extendEnvironment((hre) => {
    // attach the function to the HRE
    hre.deployMetadata = {
      pushMetadataToIPFS: (contractName) => pushMetadataToIPFS(hre, contractName),
      pushMetadataToIPFSWithBytecode: (bytecode) => pushMetadataToIPFSWithBytecode(hre, bytecode),
    };
  })


function ensureBytecodeHashIsIPFS(hre) {
    // Read the Hardhat config
    const compilers = hre.config.solidity.compilers || [];

    // Check each compiler’s settings
    const hasIPFSBytecode = compilers.some((compiler) => {
        const settings = compiler.settings || {};
        const metadata = settings.metadata || {};
        return metadata.bytecodeHash === 'ipfs';
    });

    if (!hasIPFSBytecode) {
        throw new Error(
        "Hardhat plugin error: You must set `bytecodeHash: 'ipfs'` in your hardhat.config.js compiler settings:\n\n" +
        "  solidity: {\n" +
        "    compilers: [\n" +
        "      {\n" +
        "        version: '0.8.19',\n" +
        "        settings: {\n" +
        "          metadata: {\n" +
        "            bytecodeHash: 'ipfs',\n" +
        "            ...\n" +
        "          }\n" +
        "        }\n" +
        "      }\n" +
        "    ]\n" +
        "  }"
        );
    }
  }

module.exports.pushMetadataToIPFS = pushMetadataToIPFS;