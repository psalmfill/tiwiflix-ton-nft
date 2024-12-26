import { Address, fromNano, toNano } from '@ton/core';
import { NftItem } from '../wrappers/NftItem';
import { compile, NetworkProvider } from '@ton/blueprint';
import { NftCollection } from '../wrappers/NftCollection';

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();

    const address = Address.parse(args.length > 0 ? args[0] : await ui.input('Collection address'));
    // const address = Address.parse("EQDKfA87JVnBJXsBVfzjIfbhr3bmTTdouUP31Szgm_Lw0v-J"); //Address.parse(args.length > 0 ? args[0] : await ui.input('Collection address'));

    const nftCollection = provider.open(NftCollection.createFromAddress(address));

    const data = await nftCollection.getCollectionData();
    const mintFee = await nftCollection.getMintingPrice();
    console.log('Deploy NFT mint fee: ', fromNano(mintFee));
    await nftCollection.sendMint(provider.sender(), {
        index: data.nextItemIndex,
        value: toNano('0.05'),//+ BigInt(mintFee),
        queryId: Date.now(),
        coinsForStorage: toNano('0.05'),//+ BigInt(mintFee),
        ownerAddress: provider.sender().address as Address,
        content: '/nft.json',
    });
}
