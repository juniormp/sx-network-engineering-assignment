import * as readline from 'readline';
import { ethers } from 'ethers';
import { COMMIT_REVEAL_ABI, COMMIT_REVEAL_ADDRESS, JSON_RPC_PROVIDER, PRIVATE_KEY } from './constants';
import { Event } from './interfaces';

// Sets up the Ethereum provider, signer, and contract instance.
const provider = new ethers.JsonRpcProvider(JSON_RPC_PROVIDER);
const signer = new ethers.Wallet(PRIVATE_KEY, provider);
const contract = new ethers.Contract(COMMIT_REVEAL_ADDRESS, COMMIT_REVEAL_ABI, signer);

const readLine = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Array to store emitted events from the contract.
const events: Event[] = [];

// Listens for 'NewVoteCommit' events and adds them to the events array.
contract.on('NewVoteCommit', (voteCommit: string) => {
    events.push({ name: 'NewVoteCommit', data: { voteCommit } });
});

// Listens for 'NewVoteReveal' events and adds them to the events array.
contract.on('NewVoteReveal', (voteCommit: string, choice: string) => {
    events.push({ name: 'NewVoteReveal', data: { voteCommit, choice } });
});

// Main function to handle the CLI loop and process commands.
const main = async (): Promise<void> => {
    const command = await promptForCommand();

    switch (command) {
        case 'commit':
        case 'reveal':
            await handleVote(command);
            break;
        case 'winner':
            await getWinner();
            break;
        case 'votes':
            await displayVotes();
            break;
        case 'events':
            displayEvents();
            break;
        default:
            console.log('Invalid command');
    }

    await main();
};

// Prompts the user for a command and returns the input as a lower-cased string.
const promptForCommand = async (): Promise<string> => {
    return new Promise((resolve) => {
        readLine.question('Enter command (commit/reveal/winner/votes/events): ', (command) => {
            resolve(command.trim().toLowerCase());
        });
    });
};

// Prompts the user for input based on the provided query and returns the input.
const promptForInput = async (query: string): Promise<string> => {
    return new Promise((resolve) => {
        readLine.question(query, (input) => {
            resolve(input.trim());
        });
    });
};

// Validates if the given choice is either 'YES' or 'NO'.
const validateChoice = (choice: string): choice is 'YES' | 'NO' => {
    return choice === 'YES' || choice === 'NO';
};

// Handles vote operations based on the command ('commit' or 'reveal').
const handleVote = async (command: 'commit' | 'reveal'): Promise<void> => {
    const choiceInput = await promptForInput('Enter your choice (YES/NO): ');
    const choice = choiceInput.toUpperCase();

    if (!validateChoice(choice)) {
        console.log('Only YES or NO options are permitted');
        return;
    }

    const secret = await promptForInput('Enter your secret: ');
    const choiceNumber = choice === 'YES' ? 1 : 2;

    try {
        if (command === 'commit') {
            await commitVote(choiceNumber, secret);
        } else {
            await revealVote(choiceNumber, secret);
        }
    } catch (err: any) {
        console.error('Error:', err.reason);
    }
};

// Commits a vote to the contract using the provided choice and secret.
const commitVote = async (choice: number, secret: string): Promise<void> => {
    const vote = `${choice}~${secret}`;
    const hashVote = ethers.keccak256(ethers.toUtf8Bytes(vote));
    try {
        const tx = await contract.commitVote(hashVote);
        await tx.wait();
        console.log('Vote committed successfully.');
    } catch (error: any) {
        console.error('Failed to commit vote:', error.reason);
    }
};


// Reveals a vote on the contract using the provided choice and secret.
const revealVote = async (choice: number, secret: string): Promise<void> => {
    const vote = `${choice}~${secret}`;
    const hashVote = ethers.keccak256(ethers.toUtf8Bytes(vote));
    try {
        const tx = await contract.revealVote(vote, hashVote);
        await tx.wait();
        console.log('Vote revealed successfully.');
    } catch (error: any) {
        console.error('Failed to reveal vote:', error.reason);
    }
};

// Retrieves and displays the winner from the contract.
const getWinner = async (): Promise<void> => {
    try {
        const winner = await contract.getWinner();
        console.log('Winner:', winner);
    } catch (error: any) {
        console.error('Failed to retrieve winner:', error.reason);
    }
};

// Displays all vote commitments recorded on the contract.
const displayVotes = async (): Promise<void> => {
    try {
        const votes = await contract.getVoteCommitsArray();
        console.log('Votes commits:', votes);
    } catch (error: any) {
        console.error('Failed to retrieve votes:', error.reason);
    }
};

// Displays all events captured from the contract.
const displayEvents = (): void => {
    if (events.length === 0) {
        console.log('No events captured.');
        return;
    }
    console.log('Captured Events:');
    events.forEach(event => {
        console.log(event);
    });
};

main();
