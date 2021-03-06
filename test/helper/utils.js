const contract = require("./contract");
const actors = require("../config/actors");
const ethers = require("ethers");
const config = require("../config/config");

module.exports = {
    init,
    updateExchangeBalancesBefore,
    updateExchangeBalancesAfter,
    updateTokenBalancesBefore,
    updateTokenBalancesAfter,
    actors
};

const tokenRatio = config.tokenRatio;
const minTokenForUpdate = config.minTokenForUpdate;

const { exchangeOwner, tokenOwner, feeAccount } = actors;

async function init() {
    // Token
    const [tokenContractAddress, tokenAbi] = await contract.deployToken(tokenOwner.wallet, 18);
    const tokenContract = new ethers.Contract(tokenContractAddress, tokenAbi, tokenOwner.wallet);

    // 10 Decimals Toleks
    const [token10ContractAddress, token10Abi] = await contract.deployToken(tokenOwner.wallet, 10);
    const token10Contract = new ethers.Contract(token10ContractAddress, token10Abi, tokenOwner.wallet);

    // 24 Decimals Toleks
    const [token24ContractAddress, token24Abi] = await contract.deployToken(tokenOwner.wallet, 24);
    const token24Contract = new ethers.Contract(token24ContractAddress, token24Abi, tokenOwner.wallet);

    // WeiDex Token
    const [weidexTokenAddress, weidexTokenAbi] = await contract.deployToken(exchangeOwner.wallet, 18);
    const weidexTokenContract = new ethers.Contract(weidexTokenAddress, weidexTokenAbi, tokenOwner.wallet);

    // WeiDex Exchange
    const [weidexContractAddress, weidexAbi] = await contract.deployWeiDexExchangeContract(exchangeOwner.wallet, feeAccount.wallet);
    const weidexContract = new ethers.Contract(weidexContractAddress, weidexAbi, exchangeOwner.wallet);
    await weidexContract.setDiscountToken(weidexTokenAddress, tokenRatio, minTokenForUpdate);

    // Old ERC20 token
    const [oldTokenContractAddress, oldTokenAbi] = await contract.deployOldToken(tokenOwner.wallet, 18);
    const oldTokenContract = new ethers.Contract(oldTokenContractAddress, oldTokenAbi, tokenOwner.wallet);

    return {
        token: {
            address: tokenContractAddress,
            abi: tokenAbi,
            instance: tokenContract
        },
        oldToken: {
            address: oldTokenContractAddress,
            abi: oldTokenAbi,
            instance: oldTokenContract
        },
        token10Decimals: {
            address: token10ContractAddress,
            abi: token10Abi,
            instance: token10Contract
        },
        token24Decimals: {
            address: token24ContractAddress,
            abi: token24Abi,
            instance: token24Contract
        },
        weidexToken: {
            address: weidexTokenAddress,
            abi: weidexTokenAbi,
            instance: weidexTokenContract
        },
        exchange: {
            address: weidexContractAddress,
            abi: weidexAbi,
            instance: weidexContract
        }
    };
}

async function updateExchangeBalancesBefore(exchangeContract, tokenAddress) {
    await _updateExchangeBalances("exchangeBalanceBefore", exchangeContract, tokenAddress);
}

async function updateExchangeBalancesAfter(exchangeContract, tokenAddress) {
    await _updateExchangeBalances("exchangeBalanceAfter", exchangeContract, tokenAddress);
}

async function updateTokenBalancesBefore(tokenContract) {
    await _updateTokenBalances("tokenBalanceBefore", tokenContract);
}

async function updateTokenBalancesAfter(tokenContract) {
    await _updateTokenBalances("tokenBalanceAfter", tokenContract);
}

async function _updateTokenBalances(property, tokenContract) {
    for (const actor in actors) {
        actors[actor][property] = await tokenContract.balanceOf(actors[actor].wallet.address);
    }
}

async function _updateExchangeBalances(property, exchangeContract, tokenAddress) {
    for (const actor in actors) {
        actors[actor][property] = await exchangeContract.balances(tokenAddress, actors[actor].wallet.address);
    }
}
