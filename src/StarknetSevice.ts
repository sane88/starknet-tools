import { Account, Call, Contract, Provider, constants, json, uint256, encode, CallContractResponse, AllowArray, hash, stark, ec, RpcProvider } from "starknet";
import { ETH_PRICE, generateRandomString, getRandomEntry, prettyPrintFee, randomNumber, getRandomElement } from './util';
import fs from 'fs';
import { ethers } from "ethers";
import { getPubKey, getStarkPk } from "./keyDerivation";
import { W } from ".";
import { time } from "console";


const ACCOUNT_CLASS_HASH = "0x4d07e40e93398ed3c76981e72dd1fd22557a78ce36c0515f679e27f0bb5bc5f";

const JEDISWAP_CONTRACT = "0x041fd22b238fa21cfcf5dd45a8548974d8263b3a531a60388411c5e230f97023";
const STARKVERSE_CONTRACT = "0x060582df2cd4ad2c988b11fdede5c43f56a432e895df255ccd1af129160044b8";
const PYRAMID_CONTRACT = "0x0364847c4f39b869760a8b213186b5b553127e9420e594075d13d1ce8a1d9157";
const PYRAMID_FRONT = "0x042e7815d9e90b7ea53f4550f74dc12207ed6a0faaef57ba0dbf9a66f3762d82";
const DMAIL_CONTRACT = "0x0454f0bd015e730e5adbb4f080b075fdbf55654ff41ee336203aa2e1ac4d4309";
const STARK_ID_CONTRACT = "0x05dbdedc203e92749e2e746e2d40a768d966bd243df04a6b712e222bc040a9af";
const ETH_ADDRESS = "0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7";
export const USDT_ADDRESS = "0x68f5c6a61780768455de69077e07e89787839bf8166decfbf92b645209c0fb8";
export const USDC_ADDRESS = "0x53c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8";
export const DAI_ADDRESS = "0x00da114221cb83fa859dbdb4c44beeaa0bb37c7537ad5ae66fe5e0efd20e6eb3";
const ZK_LAND_CONTRACT = "0x04c0a5193d58f74fbace4b74dcf65481e734ed1714121bdc571da345540efa05";
const MY_SWAP_CONTRACT = "0x010884171baf1914edc28d7afb619b40a4051cfae78a094a55d230f19e944a28";
const FLEX_OWNER = "0x44cf6f308cb181e0f0a6aeb3601802f45eda2714f3334aded57b3e9dbb1a20";
const FLEX_CONTRACT = '0x04b1b3fdf34d00288a7956e6342fb366a1510a9387d321c87f3301d990ac19d4';
const UNFRAMED_CONTRACT = '0x51734077ba7baf5765896c56ce10b389d80cdcee8622e23c0556fb49e82df1b';
const STARK_STARS_CONTRACTS = ['0x4d70758d392e0563a8a0076d4b72847048dea7d65199c50eabc8e855ca62931',
    '0x2ac5be4b280f6625a56b944bab9d985fbbc9f180ff4b08b854b63d284b7f6ae',
    '0x05f650c37f8a15e33f01b3c28365637ca72a536014c4b8f84271c20a4c24aef8',
    '0x027c8cb6bf861df8b86ebda8656430aeec9c1c2c66e9f99d3c8587df5fcb1c9c',
    '0x05e69ae81aed84dfadb4af03a67ce702e353db7f7f87ad833cf08df36e427704',
    '0x06b1e710f97e0d4701123c256a6f4cce4ffdc2bf6f439b42f48d08585feab123',
    '0x062b37f6ced8e742ecd4baa51321e0c39ab089183a1ca0b24138e1fb0f5083a8',
    '0x0656c27654b2b3c4ae3e8f5f6bc2a4863a79fb74cb7b2999af9dde2ad1fe3cb5',
    '0x0265f815955a1595e6859f3ad80533f15b2b57311d25fed6f01e4c530c1f1b0f',
    '0x02c69468dd31a6837bc4a10357bc940f41f6d0acebe74376c940195915cede1d',
    '0x0040cb48ec6f61e1bbc5b62ee2f7a7df8151712394248c90db4f12f7a61ce993',
    '0x04aa60106c215809a9dfc2ac2d64aa166f1185e9dc7212497a837f7d60bfb1c3',
    '0x0002ff063073208cd8b867c727be3a5f46c54d31ae1c1fbf7506ffaca673990f',
    '0x07bc362ffdbd67ff80b49e95f0b9996ad89f9f6ea9186d209ece577df429e69b',
    '0x0267217f031a1d794446943ba45175153d18202b3db246db6b15b0c772f9ec09',
    '0x0021461d8b7593ef6d39a83229750d61a23b7f45b91baafb5ad1b2da6abf13c0',
    '0x04c7999fb6eeb958240abdecdddc2331f35b5f99f1e60e29ef0e4e26f23e182b',
    '0x050e02814bd1900efd33148dbed847e7fe42a2a2de6dd444366ead20cf8dedc5',
    '0x03883b7148c475f170c4b1a21e37b15b9261e86f9c203098ff1c3b7f8cf72f73',
    '0x0394034029c6c0773397a2c79eb9b7df8f080613bfec83d93c3cd5e7c0b993ce']
const MY_SWAP_STABLE_TO_POOL = new Map<string, string>([[USDC_ADDRESS, "1"], [DAI_ADDRESS, "2"], [USDT_ADDRESS, "4"]])
const ADDRESS_TO_STABLE = new Map<string, string>([[USDC_ADDRESS, "USDC"], [DAI_ADDRESS, "DAI"], [USDT_ADDRESS, "USDT"]])
const SLIPPAGE = 5;

export class StarknetService {

    private account: Account
    private provider = new RpcProvider({ nodeUrl: "https://starknet-mainnet.public.blastapi.io" })
    private dryRun: boolean
    private okxAddress: string

    constructor(wallet: W, dryRun?: boolean) {
        this.account = new Account(this.provider, wallet.address, wallet.pk)
        this.okxAddress = wallet.okx
        this.dryRun = dryRun || false
    }

    async transferToOkx(amount: string = "0.001") {
        if (this.okxAddress == "") {
            console.warn("No OKX address provided")
            return
        }

        let uint256Amount = uint256.bnToUint256(ethers.parseEther(amount));
        console.log(`Transferring ${amount} of ETH to ${this.okxAddress}`)
        await this.invoke({
            contractAddress: ETH_ADDRESS,
            entrypoint: "transfer",
            calldata: [this.okxAddress, uint256Amount.low, uint256Amount.high],
        })
    }

    async transferToOkxMax() {
        if (this.okxAddress == "") {
            console.warn("No OKX address provided")
            return
        }

        const balance = await this.getBalanceBigInt()
        let amountUint = uint256.bnToUint256(balance)

        const esimation = await this.account.estimateInvokeFee({
            contractAddress: ETH_ADDRESS,
            entrypoint: "transfer",
            calldata: [this.okxAddress, amountUint.low, amountUint.high],
        })

        const amounttoTransferBn = balance - esimation.suggestedMaxFee
        const amountToTransfer = uint256.bnToUint256(amounttoTransferBn)
        if (amounttoTransferBn < 0.0) {
            console.warn("No balance to transfer")
            return
        }

        console.log(balance)
        console.log(esimation.suggestedMaxFee)

        console.log(`Transferring ${ethers.formatEther(amounttoTransferBn)} of ETH to ${this.okxAddress}`)
        await this.invoke({
            contractAddress: "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
            entrypoint: "transfer",
            calldata: [this.okxAddress, amountToTransfer.low, amountToTransfer.high],
        })
    }

    async claim() {
        await this.invoke({
            contractAddress: "0x06793d9e6ed7182978454c79270e5b14d2655204ba6565ce9b0aa8a3c3121025",
            entrypoint: 'claim',
            calldata: [this.account.address, uint256.bnToUint256(ethers.parseUnits("650", 8))],
        })
    }

    async sendDmail() {
        await this.invoke({
            contractAddress: DMAIL_CONTRACT,
            entrypoint: 'transaction',
            calldata: [`${generateRandomString(10)}@gmail.com`, generateRandomString(10)],
        })
    }

    async mintStarknetId(id?: string) {
        await this.invoke({
            contractAddress: STARK_ID_CONTRACT,
            entrypoint: 'mint',
            calldata: [(id || generateRandomString(10))],
        })
    }

    async enableCollateral(token?: string) {
        if (!(await this.isCollateralEnabled(token || ETH_ADDRESS))) {
            await this.invoke({
                contractAddress: ZK_LAND_CONTRACT,
                entrypoint: 'enable_collateral',
                calldata: [token || ETH_ADDRESS],
            })
        } else {
            console.log(`Collateral is disabled for token ${token || ETH_ADDRESS}`)
        }
    }

    async isCollateralEnabled(token?: string): Promise<boolean> {
        return encode.removeHexPrefix((await this.call({
            contractAddress: ZK_LAND_CONTRACT,
            entrypoint: 'is_collateral_enabled',
            calldata: [this.account.address, (token || ETH_ADDRESS)],
        })).result[0]) == "1"
    }

    async disableCollateral(token?: string) {
        if ((await this.isCollateralEnabled(token || ETH_ADDRESS))) {
            await this.invoke({
                contractAddress: ZK_LAND_CONTRACT,
                entrypoint: 'disable_collateral',
                calldata: [token || ETH_ADDRESS],
            })
        } else {
            console.log(`Collateral is not enabled for token ${token || ETH_ADDRESS}`)
        }
    }

    async increaseAllowance() {
        await this.invoke({
            contractAddress: ETH_ADDRESS,
            entrypoint: 'increaseAllowance',
            calldata: [UNFRAMED_CONTRACT, uint256.bnToUint256(ethers.parseEther("0.0001"))],
        })
    }

    async unframedCancel() {
        await this.invoke({
            contractAddress: UNFRAMED_CONTRACT,
            entrypoint: 'cancel_orders',
            calldata: [["0x2fbe62d76c310cab06057ee0010e3c0d6996a5a1cb78d04b21654e9ee53a085"]],
        })
    }

    async mySwapSwapEthToStable() {
        const stableToPool = getRandomEntry(MY_SWAP_STABLE_TO_POOL)
        let amount = (parseFloat(await this.getBalance()) / 1.5).toPrecision(16)
        // if (amount.length > 18) {
        //     amount = amount.substring(0, 18)
        // }
        const amountFloat = parseFloat(amount)

        let slipage = ((amountFloat * ETH_PRICE) - ((amountFloat * ETH_PRICE) * SLIPPAGE) / 100).toPrecision(6)
        // if (slipage.length > 6) {
        //     slipage = slipage.substring(0, 6)
        // }
        console.log(`swapping ${amount} of ETH to ${ADDRESS_TO_STABLE.get(stableToPool[0])} (~ $ ${amountFloat * ETH_PRICE}), slippage of ${SLIPPAGE}% ($ ${slipage})`)

        await this.invoke([{
            contractAddress: ETH_ADDRESS,
            entrypoint: 'approve',
            calldata: [MY_SWAP_CONTRACT, uint256.bnToUint256(ethers.parseEther(amount))],
        },
        {
            contractAddress: MY_SWAP_CONTRACT,
            entrypoint: 'swap',
            calldata: [stableToPool[1], ETH_ADDRESS, uint256.bnToUint256(ethers.parseEther(amount)), uint256.bnToUint256(ethers.parseUnits(slipage, 6))],
        }
        ])
    }

    async mySwapSwapStableToEth() {
        const stableToBalance = await this.getStableToBalace()
        if (stableToBalance == undefined) throw Error("no stable found")
        const amount = stableToBalance[1]
        const amountFloat = parseFloat(amount)
        const amountBn = ethers.parseUnits(amount, (stableToBalance[0][0] == DAI_ADDRESS ? undefined : 6))
        const slipage = ((amountFloat / ETH_PRICE) - ((amountFloat / ETH_PRICE) * SLIPPAGE) / 100).toPrecision(16)
        // if (slipage.length > 18) {
        //     slipage = slipage.substring(0, 18)
        // }
        const pool = MY_SWAP_STABLE_TO_POOL.get(stableToBalance[0][0])
        if (!pool) throw Error('no pool found')
        console.log(`swapping ${amount} of ${stableToBalance[0][1]} to ETH (~ ${(amountFloat / ETH_PRICE)}), slippage of ${SLIPPAGE}% (${slipage})`)
        await this.invoke([{
            contractAddress: stableToBalance[0][0],
            entrypoint: 'approve',
            calldata: [MY_SWAP_CONTRACT, uint256.bnToUint256(amountBn)],
        },
        {
            contractAddress: MY_SWAP_CONTRACT,
            entrypoint: 'swap',
            calldata: [pool, stableToBalance[0][0], uint256.bnToUint256(amountBn), uint256.bnToUint256(ethers.parseEther(slipage))],
        }
        ])
    }

    async jediSwapEthToStable() {
        const stable = getRandomEntry(ADDRESS_TO_STABLE)
        const amount = (parseFloat(await this.getBalance()) / 1.5).toPrecision(11)
        const amountFloat = parseFloat(amount)
        const amountMin = ((amountFloat - (amountFloat / 100 * SLIPPAGE)) * ETH_PRICE).toPrecision(6)
        console.log(`${amount} ETH supposed to be ~${(amountFloat * ETH_PRICE).toPrecision(6)} ${stable[1]} with slipage of ${SLIPPAGE}% is ${amountMin}`)

        await this.invoke([
            {
                contractAddress: ETH_ADDRESS,
                entrypoint: 'approve',
                calldata: [JEDISWAP_CONTRACT, uint256.bnToUint256(ethers.parseEther(amount))]
            },
            {
                contractAddress: JEDISWAP_CONTRACT,
                entrypoint: 'swap_exact_tokens_for_tokens',
                calldata: [
                    uint256.bnToUint256(ethers.parseEther(amount)),
                    uint256.bnToUint256(ethers.parseUnits(amountMin, 6)),
                    [ETH_ADDRESS, stable[0]],
                    this.account.address,
                    Date.now() + 10000000
                ]
            }
        ])
    }

    async jediSwapStableToEth() {
        const stableToBalance = await this.getStableToBalace()
        if (stableToBalance == undefined) throw Error("no stable found")
        const amount = stableToBalance[1]
        const amountFloat = parseFloat(amount)
        const amountBn = ethers.parseUnits(amount, (stableToBalance[0][0] == DAI_ADDRESS ? undefined : 6))
        const amountMin = ((amountFloat - (amountFloat / 100 * SLIPPAGE)) / ETH_PRICE).toPrecision(16)
        console.log(`${amount} ${stableToBalance[0][1]} is supposed to be ~ ${(amountFloat / ETH_PRICE).toPrecision(16)} with ${SLIPPAGE}% is ${amountMin}`)
        await this.invoke([
            {
                contractAddress: stableToBalance[0][0],
                entrypoint: 'approve',
                calldata: [JEDISWAP_CONTRACT, uint256.bnToUint256(amountBn)]
            },
            {
                contractAddress: JEDISWAP_CONTRACT,
                entrypoint: 'swap_exact_tokens_for_tokens',
                calldata: [
                    uint256.bnToUint256(amountBn),
                    uint256.bnToUint256(ethers.parseEther(amountMin)),
                    [stableToBalance[0][0], ETH_ADDRESS],
                    this.account.address,
                    Date.now() + 10000000
                ]
            }
        ])
    }

    private async getStableToBalace(): Promise<[[string, string], string] | undefined> {
        for (const stable of ADDRESS_TO_STABLE.entries()) {
            const balance = await this.getBalance(stable[0], (stable[0] == DAI_ADDRESS ? undefined : 6))
            if (parseFloat(balance) > 0) {
                return [stable, balance]
            }
        }
        return undefined
    }

    async zkDeposit(amount?: string) {
        if (amount == null) {
            amount = (parseFloat(await this.getBalance()) / 1.5).toString()
        }
        if (amount.length > 18) {
            amount = amount.substring(0, 18)
        }

        if (!(await this.isCollateralEnabled())) {
            await this.invoke({
                contractAddress: ZK_LAND_CONTRACT,
                entrypoint: 'enable_collateral',
                calldata: [ETH_ADDRESS],
            })
        }

        await this.invoke([
            {
                contractAddress: ETH_ADDRESS,
                entrypoint: 'approve',
                calldata: [ZK_LAND_CONTRACT, uint256.bnToUint256(ethers.parseEther(amount))],
            },
            {
                contractAddress: ZK_LAND_CONTRACT,
                entrypoint: 'deposit',
                calldata: [ETH_ADDRESS, ethers.parseEther(amount).toString()],
            }
        ])
    }

    async zkWithraw() {
        await this.invoke({
            contractAddress: ZK_LAND_CONTRACT,
            entrypoint: 'withdraw_all',
            calldata: [ETH_ADDRESS],
        })
    }

    async mintStarkStarsNft() {
        const starkStarContract = getRandomElement(STARK_STARS_CONTRACTS)

        const name = await this.call({
            contractAddress: starkStarContract,
            entrypoint: 'name'
        })

        console.log(`Minting ${ethers.toUtf8String(name.result[0])}`)

        const price = await this.call({
            contractAddress: starkStarContract,
            entrypoint: 'get_price',
        })
        console.log(`Mint price is ${ethers.toNumber(price.result[0])}`)
        await this.invoke([
            {
                contractAddress: ETH_ADDRESS,
                entrypoint: 'approve',
                calldata: [starkStarContract, uint256.bnToUint256(ethers.toBigInt(price.result[0]))]
            },
            {
                contractAddress: starkStarContract,
                entrypoint: 'mint'
            }
        ])
    }

    async flexSetApprovalNFT() {
        await this.invoke({
            contractAddress: STARK_ID_CONTRACT,
            entrypoint: 'setApprovalForAll',
            calldata: [FLEX_OWNER, "1"],
        })
    }

    async flexCancellOrder() {
        await this.invoke({
            contractAddress: FLEX_CONTRACT,
            entrypoint: 'cancelMakerOrder',
            calldata: ["20"],
        })
    }

    async pyramidApprove() {
        await this.invoke({
            contractAddress: ETH_ADDRESS,
            entrypoint: 'approve',
            calldata: [PYRAMID_CONTRACT, uint256.bnToUint256(ethers.parseEther("0.0001"))],
        })
    }

    async pyramidCancel() {
        await this.invoke({
            contractAddress: PYRAMID_CONTRACT,
            entrypoint: 'cancelMakerOrder',
            calldata: ["0"],
        })
    }

    async pyramidMintNFT(limit: number = 0.0005) {

        await this.call({
            contractAddress: PYRAMID_FRONT,
            entrypoint: 'returnMintCost',
            calldata: [],
        }).then((res) => {
            const cost = BigInt(res.result[0]).toString()
            const costFloat = parseFloat(ethers.formatEther(cost))
            console.log(`mint cost is ${ethers.formatEther(cost)} ETH (~ ${costFloat * ETH_PRICE} $)`)

            if (costFloat > limit) {
                console.log("Mint cost is greater than alloved. Skipping")
                return
            }

            this.invoke([
                {
                    contractAddress: ETH_ADDRESS,
                    entrypoint: 'approve',
                    calldata: [PYRAMID_FRONT, uint256.bnToUint256(cost)],
                },
                {
                    contractAddress: PYRAMID_FRONT,
                    entrypoint: 'mint',
                    calldata: [`${randomNumber()}`],
                }])

        })
    }

    async starkverseMint() {
        await this.invoke({
            contractAddress: STARKVERSE_CONTRACT,
            entrypoint: 'publicMint',
            calldata: [this.account.address]
        })
    }

    async getBalance(token?: string, units?: number): Promise<string> {
        const erc20ABI = json.parse(fs.readFileSync("./src/interfaces/ERC20_abi.json").toString("ascii"));
        const erc20 = new Contract(erc20ABI, token || ETH_ADDRESS, this.provider);
        const balance = await erc20.balanceOf(this.account.address);
        let balanceBigNumber = uint256.uint256ToBN(balance.balance);
        let formatted = ethers.formatUnits(balanceBigNumber, units)
        return formatted
    }

    async getBalanceBigInt(token?: string, units?: number): Promise<bigint> {
        const erc20ABI = json.parse(fs.readFileSync("./src/interfaces/ERC20_abi.json").toString("ascii"));
        const erc20 = new Contract(erc20ABI, token || ETH_ADDRESS, this.provider);
        const balance = await erc20.balanceOf(this.account.address);
        let balanceBigNumber = uint256.uint256ToBN(balance.balance);
        return balanceBigNumber
    }

    private async call(call: Call): Promise<CallContractResponse> {
        const result = await this.account.callContract(call);
        // console.log("Result", result);
        return result
    }

    private async invoke(call: AllowArray<Call>) {
        const esimation = await this.account.estimateInvokeFee(call)
        prettyPrintFee(esimation);
        if (this.dryRun) return
        const { transaction_hash: transferTxHash } = await this.account.execute(
            call,
            undefined, // abi
            { maxFee: esimation.suggestedMaxFee },
        );
        console.log("Awaiting tx ", transferTxHash);
        await this.account.waitForTransaction(transferTxHash);
        console.log("Tx mined ", transferTxHash);
    }
}
