const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider());

const { interface, bytecode } = require('../compile');

let LotteryContract;
let accounts;

beforeEach(async () => {
  accounts = await web3.eth.getAccounts();
  LotteryContract = await new web3.eth.Contract(JSON.parse(interface))
    .deploy({ data: bytecode })
    .send({ from: accounts[0], gas: 1000000 });
});


describe('Lottery Contract', () => {
  it('deploys a contract', () => {
    assert.ok(LotteryContract.options.address);
  });

  it('allows one account to enter', async () => {
    await LotteryContract.methods.enter().send({
      from: accounts[0],
      value: web3.utils.toWei('0.02', 'ether')
    });

    const players = await LotteryContract.methods.getPlayers().call();

    assert.equal(accounts[0], players[0]);
    assert.equal(players.length, 1);
  });

  it('allows multiple accounts to enter', async () => {
    await LotteryContract.methods.enter().send({
      from: accounts[0],
      value: web3.utils.toWei('0.02', 'ether')
    });
    await LotteryContract.methods.enter().send({
      from: accounts[1],
      value: web3.utils.toWei('0.02', 'ether')
    });
    await LotteryContract.methods.enter().send({
      from: accounts[2],
      value: web3.utils.toWei('0.02', 'ether')
    });

    const players = await LotteryContract.methods.getPlayers().call();
    
    assert.equal(accounts[0], players[0]);
    assert.equal(accounts[1], players[1]);
    assert.equal(accounts[2], players[2]);
    assert.equal(players.length, 3);
  });

  it('requires a minimum amout of ether to enter', async () => {
    try {
      await LotteryContract.methods.enter().send({
        from: accounts[0],
        value: web3.utils.toWei('0.001', 'ether')
      });

      assert(false);
    } catch (e) {
      assert(e);
    };
  });

  it('only manager can call pickWinner', async () => {
    try {
      await LotteryContract.methods.pickWinner().send({
        from: accounts[1]
      });

      assert(false);
    } catch (e) {
      assert(e);
    };
  });

  it('sends money to the winner and resets the players', async () => {
    await LotteryContract.methods.enter().send({
      from: accounts[0],
      value: web3.utils.toWei('1', 'ether')
    });

    const initialBalance = await web3.eth.getBalance(accounts[0]);
    await LotteryContract.methods.pickWinner().send({
      from: accounts[0]
    });
    const players = await LotteryContract.methods.getPlayers().call();
    const finalBalance = await web3.eth.getBalance(accounts[0]);
    const finalContractBalance = await web3.eth.getBalance(LotteryContract.options.address);
    const differenceBalance = finalBalance - initialBalance;
    
    assert(differenceBalance > web3.utils.toWei('0.8', 'ether'));
    assert.equal(finalContractBalance, 0);
    assert.equal(players.length, 0);
  });
});
