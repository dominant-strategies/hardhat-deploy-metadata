require('../../index.js');

module.exports = {
    solidity: {
      compilers: [
        {
          version: "0.8.20",
          settings: {
            optimizer: { enabled: false },
            metadata: {
              bytecodeHash: "ipfs",
              useLiteralContent: true
            },
            evmVersion: 'london',
          }
        }
      ]
    }
  };