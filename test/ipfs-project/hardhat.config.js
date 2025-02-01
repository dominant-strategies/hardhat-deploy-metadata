require('../../index.js');

module.exports = {
    solidity: {
      compilers: [
        {
          version: "0.8.20",
          settings: {
            optimizer: { enabled: false },
            evmVersion: 'london',
            metadata: {
              bytecodeHash: 'ipfs',
            }
          }
        }
      ]
    }
  };