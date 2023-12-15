import * as CommitRevealContract from '../artifacts/contracts/CommitReveal.sol/CommitReveal.json'
import "dotenv/config";

export const COMMIT_REVEAL_ABI = CommitRevealContract.abi || [];

export const COMMIT_REVEAL_ADDRESS = process.env.CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3'; 

export const JSON_RPC_PROVIDER = process.env.JSON_RPC_PROVIDER || 'http://127.0.0.1:8545';

export const PRIVATE_KEY = process.env.PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';