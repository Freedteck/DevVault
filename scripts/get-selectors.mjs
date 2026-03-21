import { readFileSync } from "fs";
import { resolve } from "path";
import solc from "solc";

// Compile the contract just like deploy-contracts.mjs does
const source = readFileSync(resolve("contracts", "VursoBounty.sol"), "utf8");
const input = {
  language: "Solidity",
  sources: { "VursoBounty.sol": { content: source } },
  settings: {
    outputSelection: { "*": { "*": ["evm.methodIdentifiers"] } },
  },
};

const output = JSON.parse(solc.compile(JSON.stringify(input)));
const methods =
  output.contracts["VursoBounty.sol"]["VursoBounty"].evm.methodIdentifiers;

console.log("slashDeposit =>", methods["slashDeposit(string,uint256,address)"]);
console.log(
  "refundDeposit =>",
  methods["refundDeposit(string,uint256,address)"],
);
