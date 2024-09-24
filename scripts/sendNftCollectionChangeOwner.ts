import { Address, toNano } from '@ton/core';
import { NftItem } from '../wrappers/NftItem';
import { compile, NetworkProvider } from '@ton/blueprint';
import { NftCollection } from '../wrappers/NftCollection';

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();

    const address = Address.parse(args.length > 0 ? args[0] : await ui.input('Collection address'));
    const newOwnerAddress = Address.parse(await ui.input('Enter new Owner Address'));
    const nftCollection = provider.open(NftCollection.createFromAddress(address));

    const data = await nftCollection.sendChangeOwner(provider.sender(), {
        value: toNano('0.05'),
        queryId: Date.now(),
        newOwnerAddress,
    });
    console.log(data);
}
