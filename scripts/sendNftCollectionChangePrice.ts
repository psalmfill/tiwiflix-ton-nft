import { Address, toNano } from '@ton/core';
import { NftItem } from '../wrappers/NftItem';
import { compile, NetworkProvider } from '@ton/blueprint';
import { NftCollection } from '../wrappers/NftCollection';

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();

    const address = Address.parse(args.length > 0 ? args[0] : await ui.input('Collection address'));
    const newMintingPrice = Number(toNano(await ui.input("Enter new price in TON:")))
    const nftCollection = provider.open(NftCollection.createFromAddress(address));

    const data = await nftCollection.sendChangeMintPrice(provider.sender(), {
        value: toNano('0.05'),
        queryId: Date.now(),
        newMintPrice: newMintingPrice
    });
    console.log(data);
}
