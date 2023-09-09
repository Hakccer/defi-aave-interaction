const { addr } = require("../helper-hard-config")
const { getWeth, get, getTheAbi, ethDepositingAmount } = require("./getWeth")
const { ethers, getNamedAccounts } = require("hardhat")

const main = async()=>{
    await getWeth()
    // getting the ethers signer
    const { deployer } = await getNamedAccounts()
    const signer = await ethers.provider.getSigner(deployer);

    const lendingPool = await getLendingPool(signer)
    console.log(`Lending pool address => ${(await lendingPool.getAddress())}`);

    // approving the ERC20 (Wrapped Ether) before depositing as collateral
    await approveERC20(
        addr.mainnet.wethContract,
        (await lendingPool.getAddress()),
        ethDepositingAmount,
        signer
    )
    const deposit_collateral_tx = await lendingPool.deposit(
        addr.mainnet.wethContract,
        ethDepositingAmount,
        signer,
        0
    );
    await deposit_collateral_tx.wait(1)
    console.log("Successfull", deployer);

    // now running this and getting the details
    const { availableBorrowsETH, totalDebtETH } = await getLendingData(lendingPool, deployer);
    console.log(availableBorrowsETH, totalDebtETH);
    const daiPrice = await getDaiPrice(signer);
    const ammountOfDaiCanBorrow =
    availableBorrowsETH.toString() * 0.95 * (1 / daiPrice.toString())

    // logging the amount of Dai can Be Borrowed
    console.log(`Dai I can Borrow ${ammountOfDaiCanBorrow}`);
    console.log(ethers.parseEther(ammountOfDaiCanBorrow.toString()));

    await borrowDai(
        "0x6B175474E89094C44Da98b954EedeAC495271d0F",
        ethers.parseEther(ammountOfDaiCanBorrow.toString()),
        lendingPool,
        signer
    );
    await getLendingData(lendingPool, signer);
}

const getDaiPrice = async(signer) => {
    // getting the Dai Contract here first
    const aggregatorContract = new ethers.Contract(
        "0x773616E4d11A78F511299002da57A0a94577F1f4",
        getTheAbi("AggregatorV3Interface"),
        signer
    )

    const daiPrice_tz = (await aggregatorContract.latestRoundData())[1]
    return daiPrice_tz
} 

const getLendingData = async (lendingPool, account) => {
    console.log("hack1");
    const { totalCollateralETH , totalDebtETH , availableBorrowsETH } =
        await lendingPool.getUserAccountData(account);
    console.log("hack2", totalCollateralETH, totalDebtETH, availableBorrowsETH);
    return { availableBorrowsETH, totalDebtETH };
} 

const borrowDai = async(asset_address, amount, lendingPool, signer) => {
    const myBorrow_tx = await lendingPool.borrow(
        asset_address,
        amount,
        1,
        0,
        signer
    );
    await myBorrow_tx.wait(1);
}

const getLendingPool = async(signer)=>{
    const lendingPoolAddressProvider = new ethers.Contract(
        addr.mainnet.lendingPoolProviderAddress,
        getTheAbi("ILendingPoolAddressesProvider"),
        signer
    )

    // now i have the contract lending pool address provider now getting the lendingPool
    const lendingPoolAddress = await lendingPoolAddressProvider.getLendingPool();
    console.log(`lending pool address => ${lendingPoolAddress}`);

    // now getting the Lending Pool address
    const lendingPool = new ethers.Contract(
        lendingPoolAddress,
        getTheAbi("ILendingPool"),
        signer
    )

    return lendingPool
}

const approveERC20 = async (erc20Address, spendersAddress, amountToSpend, signer) => {
    const erc20Token = new ethers.Contract(
        erc20Address,
        getTheAbi("IERC20"),
        signer
    )
    const approve_tx = await erc20Token.approve(
        spendersAddress,
        amountToSpend
    )
    await approve_tx.wait(1)
    console.log("Approved...");
}

main().then(()=>{
    console.log("wowwwwww!!!");
}).catch((e)=>{
    console.log(`error ${e}`);
})