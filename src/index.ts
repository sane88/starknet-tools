import { HttpError } from "starknet";
import { StarknetService } from "./StarknetSevice";
import * as wallets from "./wallets/wallets.json";
import { fetchEthPrice, shuffleArray, wait } from "./util";

async function main(): Promise<void> {

    // const w = wallets.warm3[1]
    // await fetchEthPrice()
    // await runFull(w)

    // const service = new StarknetService(w, false)

    // await service.starkverseMint()
    // await service.jediSwapEthToStable()
    // await wait()
    // await service.jediSwapStableToEth()
    // await wait()
    // await service.increaseAllowance()
    // await wait()
    // await service.unframedCancel()
    // await service.mySwapSwapEthToStable()
    // await wait()
    // await service.mySwapSwapStableToEth()
    // await service.transferToOkx()

    // console.log(`ballance for wallet ${w.address} is ${await service.getBalance()} ETH`)
    // await zkVolAndTransafer(w, "0.6963")
    // await service.transferToOkx("0.6963")
    for (let i = wallets.warm2.length - 2; i < wallets.warm2.length; i++) {
        const w = wallets.warm2[i]
        console.log(`Address ${w.address}`)
        const service = new StarknetService(w, false)
        await service.mintStarkStarsNft()
        // await wait()
        // await service.jediSwapStableToEth()
        // await service.starkverseMint()
        // await service.pyramidApprove()
        // await wait()
        // await service.pyramidCancel()
        // await wait(5000, 10000)
        // await withRetry(async () => {
        //     await service.getBalance().then((v) => {
        //         console.log(`ballance for wallet ${w.address} is ${v} ETH`)
        //     })
        // })
        // await wait()
        // await service.flexSetApprovalNFT()
        // await wait()
        // await service.flexCancellOrder()
        // console.log(`ballance for wallet ${wallets.warm2[i].address} is ${await service.getBalance()} ETH`)
        // await single(w)
        await wait(5000, 10000)
    }

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
    await withRetry(async () => {
        await service.getBalance().then((v) => {
            console.log(`ballance for wallet ${w.address} is ${v} ETH`)
        })
    })

}

const withRetry = async (fun: () => Promise<void>, times: number = 3) => {
    try {
        await fun()
    } catch (error) {
        if (error instanceof HttpError) {
            if (times == 0) throw error

            console.warn(`Error thown: ${error} retries left ${times}`)
            await withRetry(fun, times - 1)
        }
        throw error
    }
}

const single = async (w: W) => {
    const service = new StarknetService(w, false)
    const f = shuffleArray([
        // async function mint() { await service.mintStarknetId() },
        // async function dmail() { await service.sendDmail() },
        // async function collateral() {
        //     await service.enableCollateral()
        //     await wait()
        //     await service.disableCollateral()
        // },
        // async function swap() {
        //     await service.mySwapSwapEthToStable()
        //     await wait()
        //     await service.mySwapSwapStableToEth()
        // },
        // async function pyramidApproveAndCancel() {
        //     await service.pyramidApprove()
        //     await wait()
        //     await service.pyramidCancel()
        // },
        // async function pyramidMint() {
        //     await service.pyramidMintNFT()
        // },
        async function jediSwap() {
            await service.jediSwapEthToStable()
            await wait()
            await service.jediSwapStableToEth()
        },
        async function starkverseMint() {
            await service.starkverseMint()
        },
        // async function flex() {
        //     await service.flexSetApprovalNFT()
        //     await wait()
        //     await service.flexCancellOrder()
        // },
        // async function unframed() {
        //     await service.increaseAllowance()
        //     await wait()
        //     await service.unframedCancel()
        // }
    ])[0]
    console.log('-------------------------')
    console.log(`running ${f.name} for ${w.address}`)
    await withRetry(f)
    await withRetry(async () => {
        await service.getBalance().then((v) => {
            console.log(`ballance for wallet ${w.address} is ${v} ETH`)
        })
    })
}

export interface W {
    address: string,
    pk: string,
    okx: string
}

main()