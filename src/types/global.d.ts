// src/types/global.d.ts

export {}; // Required to make this a module

declare global {
  interface Window {
    ethereum?: any;
  }
}
