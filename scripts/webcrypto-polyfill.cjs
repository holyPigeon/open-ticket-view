const cryptoModule = require('crypto');
const { webcrypto } = cryptoModule;

if (webcrypto && (!globalThis.crypto || typeof globalThis.crypto.getRandomValues !== 'function')) {
  globalThis.crypto = webcrypto;
}
