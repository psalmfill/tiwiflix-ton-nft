import { Address, toNano } from '@ton/core';
import { NftItem } from '../wrappers/NftItem';
import { compile, NetworkProvider } from '@ton/blueprint';
import { NftCollection } from '../wrappers/NftCollection';

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();

    const address = Address.parse(args.length > 0 ? args[0] : await ui.input('Collection address'));

    const nftCollection = provider.open(NftCollection.createFromAddress(address));

    const data = await nftCollection.getCollectionData();
    const addresses = [
        // 'UQCceSo89ihRMgSKOb1l_-MRx4ACc8jSyNl0kcRaCpzsoqYO',
        // 'UQAZwGM6-nqTWDXTLRy0Pz56kI8Sn2a1kNDTmHr1-CUGqVjc',
        // 'UQBAWKC-WuholfiDZpgP8xZOUX5aCZZWJiWQ2pnfJlpitZLx',
        // 'UQB34v0cB3L8Cb6f8PK6d9k4a8njlwN9H9Ks5nSO3w3dwZ_A',
        // 'UQCCWcz7w56nngd6QHE2rS0kraXrsFN-4nCe-n0AHLAgGKkh',
        // 'UQDz7cUYha6RG1dMsYZZWY0GWA8rnM-1oa2KmeXaT3JmXemr',
        // 'UQA7sEv-PYb7-XtjNISCuyD2_gimzNZhN5VRS3A_jJiI5qTS',
        // 'UQADE8MkM2Q7MJfMjFBM8a-m6_sWMO4o6LnB6nBAA5AvaziI',
        'UQC72KosBnfDQrGkLZSfTOo-cuM3NL7nOrNakJfB08FZqfQK'
       ]

       for(let add of addresses){
        await nftCollection.sendMint(provider.sender(), {
            index: data.nextItemIndex,
            value: toNano('0.05'),
            queryId: Date.now(),
            coinsForStorage: toNano('0.05'),
            ownerAddress: Address.parse(add),
            content: '/nft.json',
        });
       }

    
}
