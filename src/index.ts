import { HttpError } from "starknet";
import { StarknetService } from "./StarknetSevice";
import * as wallets from "./wallets/wallets.json";
import { shuffleArray, wait } from "./util";

async function main(): Promise<void> {

    const w = wallets.warm3[5]

    // await runFull(w)

    const service = new StarknetService(w, false)
    // await service.flexSetApprovalNFT()
    // await wait()
    // await service.flexCancellOrder()
    // await wait()
    // await service.increaseAllowance()
    // await wait()
    // await service.unframedCancel()
    // await service.mySwapSwapEthToStable()
    // await wait()
    // await service.mySwapSwapStableToEth()
    // await service.transferToOkx()

    console.log(`ballance for wallet ${w.address} is ${await service.getBalance()} ETH`)
    // await zkVolAndTransafer(w, "0.6963")
    // await service.transferToOkx("0.6963")
    // for (let i = 0; i < wallets.warm3.length; i++) {
    // await single(wallets.warm3[wallets.warm3.length - 1])
    // }

    // wallets.warm2.slice(2,4).forEach((wallet) => {
    //     //  await runFull(wallet)
    //       single(wallet)
    // })
}

const zkVolAndTransafer = async (w: W, amount: string) => {
    const service = new StarknetService(w, false)
    await service.zkDeposit(amount)
    await wait()
    await service.zkWithraw()
    await wait()
    await service.zkDeposit(amount)
    await wait()
    await service.zkWithraw()
    await service.transferToOkx(amount)
    console.log(`ballance for wallet ${w.address} is ${await service.getBalance()} ETH`)
}

const runFull = async (w: W) => {
    const service = new StarknetService(w)
    let functions = shuffleArray([
        async function mintListAndCancel() {
            await service.mintStarknetId()
            await wait()
            await service.flexSetApprovalNFT()
            await wait()
            await service.flexCancellOrder()
        },
        async function dmail() { await service.sendDmail() },
        async function collateral() {
            await service.enableCollateral()
            await wait()
            await service.disableCollateral()
        },
        async function swap() {
            await service.mySwapSwapEthToStable()
            await wait()
            await service.mySwapSwapStableToEth()
        },
        async function unframed() {
            await service.increaseAllowance()
            await wait()
            await service.unframedCancel()
        },
        // async function zkDepositWithdrawal() {
        //     await service.zkDeposit()
        //     await wait()
        //     await service.zkWithraw()
        // }
    ])
    for (const f of functions) {
        await wait()
        console.log('-------------------------')
        console.log(`running ${f.name} for ${w.address}`)
        await withRetry(f)
    }
    console.log(`ballance for wallet ${w.address} is ${await service.getBalance()} ETH`)
}

const withRetry = async (fun: () => Promise<void>, times: number = 3) => {
    try {
        await fun()
    } catch (error) {
        if (error instanceof HttpError) {
            if (times == 0) throw error

            console.warn(`Error thown: ${error} retries left ${times}`)
            withRetry(fun, times - 1)
        }
        throw error
    }
}

const single = async (w: W) => {
    const service = new StarknetService(w, false)
    const f = shuffleArray([
        async function mint() { await service.mintStarknetId() },
        async function dmail() { await service.sendDmail() },
        async function collateral() {
            await service.enableCollateral()
            await wait()
            await service.disableCollateral()
        },
        // async function swap() {
        //     await service.mySwapSwapEthToStable()
        //     await wait()
        //     await service.mySwapSwapStableToEth()
        // },
        async function flex() {
            await service.flexSetApprovalNFT()
            await wait()
            await service.flexCancellOrder()
        },
        async function unframed() {
            await service.increaseAllowance()
            await wait()
            await service.unframedCancel()
        }
    ])[0]
    console.log('-------------------------')
    console.log(`running ${f.name} for ${w.address}`)
    await withRetry(f)
    console.log(`ballance for wallet ${w.address} is ${await service.getBalance()} ETH`)
}

export interface W {
    address: string,
    pk: string,
    okx: string
}

main()