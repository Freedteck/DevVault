const fs = require("fs");
const path = require("path");
const solc = require("solc");

// Compile the contract
const contractPath = path.join(__dirname, "contracts", "BountyEscrow.sol");
const outputDir = path.join(__dirname, "build");

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

try {
  const source = fs.readFileSync(contractPath, "utf8");

  const input = {
    language: "Solidity",
    sources: {
      "BountyEscrow.sol": {
        content: source,
      },
    },
    settings: {
      outputSelection: {
        "*": {
          "*": ["*"],
        },
      },
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));

  if (output.errors) {
    console.error("Compilation errors:");
    output.errors.forEach((error) => console.error(error.formattedMessage));
    process.exit(1);
  }

  const contract = output.contracts["BountyEscrow.sol"]["BountyEscrow"];
  const bytecode = contract.evm.bytecode.object;
  const abi = contract.abi;

  // Write bytecode and ABI to files
  fs.writeFileSync(path.join(outputDir, "BountyEscrow.bin"), bytecode);
  fs.writeFileSync(
    path.join(outputDir, "BountyEscrow.abi"),
    JSON.stringify(abi, null, 2)
  );

  console.log("Contract compiled successfully!");

  // Create the bytecode.js file for the client
  const clientBytecodePath = path.join(
    __dirname,
    "src",
    "client",
    "escrowBytecode.js"
  );
  const bytecodeContent = `const bytecode = "${bytecode}";\nconst abi = ${JSON.stringify(
    abi,
    null,
    2
  )};\n\nexport { bytecode, abi };`;

  fs.writeFileSync(clientBytecodePath, bytecodeContent);
  console.log("Bytecode and ABI exported to src/client/escrowBytecode.js");
} catch (error) {
  console.error("Compilation failed:", error.message);
  process.exit(1);
}
