import toolbox from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import { defineConfig } from "hardhat/config";

export default defineConfig({
  plugins: [toolbox],
  solidity: "0.8.28",
  networks: { localhost: { type: "http", chainType: "l1", url: "http://127.0.0.1:8545" } }
});
