import { Account, Call, Contract, Provider, constants, json, uint256, encode, CallContractResponse, AllowArray, hash, stark, ec } from "starknet";
import { generateRandomString, getEthPrice, getRandomStable, prettyPrintFee, randomNumber } from './util';
import fs from 'fs';
import { Wallet, ethers } from "ethers";
import { getPubKey, getStarkPk } from "./keyDerivation";
import { W } from ".";


const ACCOUNT_CLASS_HASH = "0x4d07e40e93398ed3c76981e72dd1fd22557a78ce36c0515f679e27f0bb5bc5f";

const STARKVERSE_CONTRACT = "0x060582df2cd4ad2c988b11fdede5c43f56a432e895df255ccd1af129160044b8";
const PYRAMID_CONTRACT = "0x0364847c4f39b869760a8b213186b5b553127e9420e594075d13d1ce8a1d9157";
const PYRAMID_FRONT = "0x042e7815d9e90b7ea53f4550f74dc12207ed6a0faaef57ba0dbf9a66f3762d82";
const DMAIL_CONTRACT = "0x0454f0bd015e730e5adbb4f080b075fdbf55654ff41ee336203aa2e1ac4d4309";
const STARK_ID_CONTRACT = "0x05dbdedc203e92749e2e746e2d40a768d966bd243df04a6b712e222bc040a9af";
const ETH_ADDRESS = "0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7";
const USDT_ADDRESS = "0x68f5c6a61780768455de69077e07e89787839bf8166decfbf92b645209c0fb8";
const USDC_ADDRESS = "0x53c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8";
const DAI_ADDRESS = "0x00da114221cb83fa859dbdb4c44beeaa0bb37c7537ad5ae66fe5e0efd20e6eb3";
const ZK_LAND_CONTRACT = "0x04c0a5193d58f74fbace4b74dcf65481e734ed1714121bdc571da345540efa05";
const MY_SWAP_CONTRACT = "0x010884171baf1914edc28d7afb619b40a4051cfae78a094a55d230f19e944a28";
const FLEX_OWNER = "0x44cf6f308cb181e0f0a6aeb3601802f45eda2714f3334aded57b3e9dbb1a20";
const FLEX_CONTRACT = '0x04b1b3fdf34d00288a7956e6342fb366a1510a9387d321c87f3301d990ac19d4';
const UNFRAMED_CONTRACT = '0x51734077ba7baf5765896c56ce10b389d80cdcee8622e23c0556fb49e82df1b';
const MY_SWAP_STABLE_TO_POOL = new Map<string, string>([[USDC_ADDRESS, "1"], [DAI_ADDRESS, "2"], [USDT_ADDRESS, "4"]])
const ADDRESS_TO_STABLE = new Map<string, string>([[USDC_ADDRESS, "USDC"], [DAI_ADDRESS, "DAI"], [USDT_ADDRESS, "USDT"]])
const SLIPPAGE = 5;

export class StarknetService {

    private account: Account
    private provider: Provider = new Provider({ sequencer: { network: constants.NetworkName.SN_MAIN } })
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
        const stableToPool = getRandomStable(MY_SWAP_STABLE_TO_POOL)
        let amount = (parseFloat(await this.getBalance()) / 1.5).toString()
        if (amount.length > 18) {
            amount = amount.substring(0, 18)
        }
        const amountFloat = parseFloat(amount)

        let slipage = ((amountFloat * getEthPrice()) - ((amountFloat * getEthPrice()) * SLIPPAGE) / 100).toString()
        if (slipage.length > 6) {
            slipage = slipage.substring(0, 6)
        }
        console.log(`swapping ${amount} of ETH to ${ADDRESS_TO_STABLE.get(stableToPool[0])} (~ $ ${amountFloat * getEthPrice()}), slippage of ${SLIPPAGE}% ($ ${slipage})`)

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
        let slipage = ((amountFloat / getEthPrice()) - ((amountFloat / getEthPrice()) * 5) / 100).toString()
        if (slipage.length > 18) {
            slipage = slipage.substring(0, 18)
        }
        console.log(`swapping ${amount} of ${ADDRESS_TO_STABLE.get(stableToBalance[0][0])} to ETH (~ ${(amountFloat / getEthPrice())}), slippage of ${SLIPPAGE}% (${slipage})`)
        await this.invoke([{
            contractAddress: stableToBalance[0][0],
            entrypoint: 'approve',
            calldata: [MY_SWAP_CONTRACT, uint256.bnToUint256(amountBn)],
        },
        {
            contractAddress: MY_SWAP_CONTRACT,
            entrypoint: 'swap',
            calldata: [stableToBalance[0][1], stableToBalance[0][0], uint256.bnToUint256(amountBn), uint256.bnToUint256(ethers.parseEther(slipage))],
        }
        ])
    }

    private async getStableToBalace(): Promise<[[string, string], string] | undefined> {
        for (const stable of MY_SWAP_STABLE_TO_POOL.entries()) {
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
            console.log(`mint cost is ${ethers.formatEther(cost)} ETH (~ ${costFloat * getEthPrice()} $)`)

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
