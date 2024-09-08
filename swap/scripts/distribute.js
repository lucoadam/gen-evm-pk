const { ethers } = require("ethers");
const { RPC } = require("./constants");
const fs = require("fs");

const provider = new ethers.providers.JsonRpcProvider(RPC);
const main = async () => {
  const mainWallet = new ethers.Wallet.fromMnemonic(
    process.env.MNEMONIC,
    "m/44'/60'/0'/0/0" // change last number to get different wallet
  ).connect(provider);

  console.log("Main Wallet: ", mainWallet.address);
  console.log("Balance");
  const balance = await mainWallet.getBalance();
  const totalWalletsToSendFund = parseInt(process.env.TOTAL_MAIN_WALLETS || 10);
  const balanceInEachWallet = balance.div(totalWalletsToSendFund);
  for (let i = 0; i < totalWalletsToSendFund; i++) {
    const wallet = new ethers.Wallet.fromMnemonic(
      process.env.MNEMONIC,
      `m/44'/60'/0'/0/${i}`
    ).connect(provider);
    console.log(`Sending balance to wallet ${i}`);
    const tx = await mainWallet.sendTransaction({
      to: wallet.address,
      value: balanceInEachWallet,
    });
    await tx.wait();
    console.log(`Balance sent to wallet ${i}: \n TXHash: ${tx.hash}`);
    console.log(`Wallet address: ${wallet.address}`);
  }
  console.log(ethers.utils.formatEther(balance));
};

main();
