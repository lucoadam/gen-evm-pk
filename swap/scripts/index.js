const { ethers } = require("ethers");
const { swap } = require("./swap");
const { RPC } = require("./constants");
const fs = require("fs");

const provider = new ethers.providers.JsonRpcProvider(RPC);
const overalWallets = process.env.TOTAL_WALLETS || 10;
const totalMainWallets = process.env.TOTAL_MAIN_WALLETS || 10;

const totalWallets = Math.ceil(overalWallets / totalMainWallets);

const transferBalance = async (wallet, to) => {
  const toBalance = await provider.getBalance(to);
  console.log(`Next Wallet balance: ${ethers.utils.formatEther(toBalance)}`);
  if (toBalance.gt(ethers.utils.parseEther("0.1"))) {
    console.log("Already has sufficient balance");
    return;
  }
  console.log(`Transferring balance to ${to}`);
  const balance = await wallet.getBalance();
  if (balance.lt(ethers.utils.parseEther("0.2"))) {
    throw new Error(
      "Main wallet has Insufficient balance. Please top up the main wallet"
    );
  }
  const tx = await wallet.sendTransaction({
    to,
    value: ethers.utils.parseEther("0.1"),
  });
  await tx.wait();
  console.log("transfer balance: ", tx.hash);
};

const withdrawAllBalance = async (wallet, to) => {
  const balance = await wallet.getBalance();
  if (balance.lt(ethers.utils.parseEther("0.002"))) {
    console.log("Insufficient balance to withdraw. Skipping");
    return;
  }
  console.log("Withdrawing balance: ", ethers.utils.formatEther(balance));
  const gasPrice = ethers.utils.parseUnits("5", "gwei");
  const gasLimit = 21000;
  const fee = gasPrice.mul(gasLimit);
  const balanceAfterFee = balance
    .sub(fee)
    .sub(ethers.utils.parseUnits("0.001", "ether"));
  const tx = await wallet.sendTransaction({
    to,
    value: balanceAfterFee,
    gasPrice,
    gasLimit,
  });
  await tx.wait();
  console.log("Withdraw Tx: ", tx.hash);
};

const main = async () => {
  const mainWallet = new ethers.Wallet.fromMnemonic(
    process.env.MNEMONIC,
    `m/44'/60'/0'/0/${process.env.MAIN_WALLET_DERIVATION_INDEX || 0}` // change last number to get different wallet
  ).connect(provider);
  console.log("Main Wallet: ", mainWallet.address);
  const startIndexFromEnv = parseInt(process.env.START_WALLET_INDEX || 0);
  let start = 0;
  console.log("Start Index: ", startIndexFromEnv);
  console.log("Total Wallets: ", totalWallets);
  if (fs.existsSync("last-wallet-index.txt")) {
    start = Number(fs.readFileSync("last-wallet-index.txt", "utf8")) + 1;
  }
  for (let i = start; i < totalWallets; i++) {
    const mainWalletBalance = await mainWallet.getBalance();
    const nextWallet = new ethers.Wallet.fromMnemonic(
      process.env.MNEMONIC,
      `m/44'/60'/0'/0/${i + startIndexFromEnv}`
    ).connect(provider);

    console.log("\n========================================");
    console.log(`Wallet Index: ${i + startIndexFromEnv}`);
    console.log("Next Wallet: ", nextWallet.address);
    console.log(
      "Main Wallet balance: ",
      ethers.utils.formatEther(mainWalletBalance)
    );
    // Transfer balance
    await transferBalance(mainWallet, nextWallet.address);

    // Swap
    await swap(nextWallet);

    // Withdraw all balance
    await withdrawAllBalance(nextWallet, mainWallet.address);

    // Save last wallet index
    fs.writeFileSync("last-wallet-index.txt", i.toString());
    console.log("========================================\n");
  }

  console.log("All wallets are done");
  fs.unlinkSync("last-wallet-index.txt");
};

main();
