require('dotenv').config();
const HDWalletProvider = require('truffle-hdwallet-provider');
const Web3 = require('web3');
const { interface, bytecode } = require('./compile');

const provider = new HDWalletProvider(
  process.env.MNEMONIC,
  process.env.RINKEBY_URL
);
const web3 = new Web3(provider);

const deploy = async () => {
  const accounts = await web3.eth.getAccounts();
  console.log('Deploying from', accounts[0])
  
  const LotteryContract = await new web3.eth.Contract(JSON.parse(interface))
    .deploy({ 
      data: bytecode
    })
    .send({ 
      from: accounts[0],
      gas: '1000000'
    });

  console.log('Contract ABI:', interface)
  console.log('Contract Address', LotteryContract.options.address);
};
deploy();
