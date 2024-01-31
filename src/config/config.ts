export const CONFIG_DEV = {
  name: "k-bot-syncing",
  contractAbi:
    '[{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[],"name":"Ping","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"bytes32","name":"txHash","type":"bytes32"}],"name":"Pong","type":"event"},{"inputs":[],"name":"ping","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"pinger","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"_txHash","type":"bytes32"}],"name":"pong","outputs":[],"stateMutability":"nonpayable","type":"function"}]',
  contractAddress: "0x7D3a625977bFD7445466439E60C495bdc2855367",
  web3NodeUrl: ["https://rpc.ankr.com/eth_goerli", "https://eth-goerli.api.onfinality.io/public", "https://goerli.gateway.tenderly.co"],

  temporalHost: "temporal:7233",
  privateKey: process.env.WALLET_KEY || "4b529bf0d894be067f313cf570ea672449cf68fef282ff885700d8d21d137ff7",
  pingTopic: "0xca6e822df923f741dfe968d15d80a18abd25bd1e748bcb9ad81fea5bbb7386af", //Ping Topic from contract to filter ping events from logs
};

export default () => ({ ...CONFIG_DEV });
