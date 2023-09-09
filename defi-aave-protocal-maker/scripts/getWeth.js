const hre = require('hardhat');
const { addr } = require('../helper-hard-config');
const fs = require("fs")
const path = require("path")

const getTheAbi = (contractName=null) => {
    if (!contractName) return undefined;
    try {
        const dir = path.resolve(
            __dirname,
            `../artifacts/contracts/interfaces/${contractName}.sol/${contractName}.json`, // hardhat build dir
        )
        const file = fs.readFileSync(dir, "utf8")
        const json = JSON.parse(file)
        return json.abi

    } catch (e) {
        console.log(`e`, e)
    }
}

const ethDepositingAmount = hre.ethers.parseEther("0.02")
const getWeth = async()=>{
    const { deployer } = await hre.getNamedAccounts();
    // now getting the contracts ABI, and address and getting that contract here
    console.log(addr.mainnet.wethContract);
    const signer = await hre.ethers.provider.getSigner(deployer)
    const myContract = new hre.ethers.Contract(
        addr.mainnet.wethContract,
        getTheAbi("IWeth"),
        signer
    )

    // now after getting the contract running all the operations on it
    const fundEth = await myContract.deposit({value: ethDepositingAmount})
    await fundEth.wait(1);

    const my_wethBalance = (await myContract.balanceOf(deployer)).toString();
    console.log(`WETH balance: ${my_wethBalance}... good!!`);
    // now
}

module.exports = {
    getWeth,
    getTheAbi,
    ethDepositingAmount
}