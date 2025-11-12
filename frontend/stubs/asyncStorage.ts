// Stub for @react-native-async-storage/async-storage
// Required by @metamask/sdk which is included via wagmi connectors

const asyncStorage = {
  getItem: async () => null,
  setItem: async () => {},
  removeItem: async () => {},
  clear: async () => {},
  getAllKeys: async () => [],
  multiGet: async () => [],
  multiSet: async () => {},
  multiRemove: async () => {},
};

export default asyncStorage;
