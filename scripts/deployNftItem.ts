import { Address, toNano } from '@ton/core';
import { NftItem } from '../wrappers/NftItem';
import { compile, NetworkProvider } from '@ton/blueprint';
import { NftCollection } from '../wrappers/NftCollection';

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();

    const address = Address.parse(args.length > 0 ? args[0] : await ui.input('Collection address'));

    const nftCollection = provider.open(NftCollection.createFromAddress(address));

    const data = await nftCollection.getCollectionData()
    await nftCollection.sendMint(provider.sender(), {
        index: data.nextItemIndex,
        value: toNano('0.05'),
        queryId: Date.now(),
        coinsForStorage: toNano('0.05'),
        ownerAddress:provider.sender().address as Address,
        content: "https://nft.ton.diamonds/octopus-boyz/nft/2/2.json"

    });
}
