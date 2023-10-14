import axios from "axios";
import { ethers } from "ethers";
import { get } from "http";
import { EstimateFee } from 'starknet';

export let ETH_PRICE = 0

export const prettyPrintFee = (fee: EstimateFee) => {
    const formatterOverall = ethers.formatEther(fee.overall_fee.toString())
    console.log(`Overall Fee: ${formatterOverall} ($ ${parseFloat(formatterOverall) * ETH_PRICE})`);
    if (fee.gas_consumed !== undefined) {
        console.log(`Gas Consumed: ${fee.gas_consumed.toString()}`);
    }
    if (fee.gas_price !== undefined) {
        console.log(`Gas Price: ${ethers.formatUnits(fee.gas_price.toString(), 9)}`);
    }
    if (fee.suggestedMaxFee !== undefined) {
        const suggestedMaxFeeFormatted = ethers.formatEther(fee.suggestedMaxFee.toString())
        console.log(`Suggested Max Fee: ${suggestedMaxFeeFormatted} ($ ${parseFloat(suggestedMaxFeeFormatted) * ETH_PRICE})`);
    }
}

export async function fetchEthPrice() {

    if (ETH_PRICE === 0) {
        console.log("getting eth price")
        await axios.get('https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD')
            .then(r => {
                ETH_PRICE = r.data.USD
                console.log(`The price is $${ETH_PRICE}`)
            })
    }
}

export const generateRandomString = (length: number): string => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters.charAt(randomIndex);
    }

    return result;
}

export const wait = (from: number = 1000, to: number = 5000) => {
    const randomDelay = Math.floor(Math.random() * (to - from + 1)) + from;
    console.log(`Waiting for ${randomDelay} milliseconds...`);

    return new Promise<void>((resolve) => {
        setTimeout(() => {
            resolve();
        }, randomDelay);
    });
}

export const getRandomEntry = <K, V>(map: Map<K, V>): [K, V] => {
    return getRandomElement(Array.from(map.entries()))
}

export const getRandomElement = <T>(arr: Array<T>): T => {
    return arr[Math.floor(Math.random() * arr.length)]
}


export const shuffleArray = <T>(array: T[]): T[] => {
    const shuffledArray = [...array];

    for (let i = shuffledArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
    }

    return shuffledArray;
}

export const randomNumber = (min: number = 11111111111111111111, max: number = 999999999999999999999): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}