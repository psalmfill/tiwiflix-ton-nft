import { Address, toNano } from '@ton/core';
import { NftCollection } from '../wrappers/NftCollection';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const sender_address = provider.sender().address as Address;
    const nftCollection = provider.open(
        NftCollection.createFromConfig(
            {
                ownerAddress: sender_address,
                nextItemIndex: 0,
                collectionContentUrl: 'collection.json',
                commonContentUrl: 'nft/',
                nftItemCode: await compile('NftItem'),
                royaltyParams: {
                    factor: 10,
                    base: 100,
                    address: sender_address,
                },
            },
            await compile('NftCollection'),
        ),
    );

    await nftCollection.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(nftCollection.address);

    // run methods on `nftCollection`
    const data = await nftCollection.getCollectionData();
    console.log(data);
}
