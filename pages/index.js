/* pages/index.js */
import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import axios from 'axios'
import Web3Modal from "web3modal"

import {
  nftaddress, nftmarketaddress
} from '../config'

import NFT from '../artifacts/contracts/NFT.sol/NFT.json'
import Market from '../artifacts/contracts/Market.sol/NFTMarket.json'

import PageLoader from '../components/page-loader/page-loader'

export default function Home() {

  const [nfts, setNfts] = useState([])
  const [loadingState, setLoadingState] = useState('not-loaded')

  useEffect(() => {
    loadNFTs()
  }, [])

  async function loadNFTs() {

    const providerOptions = {};
    const web3Modal = new Web3Modal({
      theme: "dark",
      providerOptions
    });
    const web3Provider = await web3Modal.connect();
    // Subscribe to accounts change
    web3Provider.on("accountsChanged", (accounts) => {
      console.log(accounts);
    });
    // Subscribe to chainId change
    web3Provider.on("chainChanged", (chainId) => {
      console.log(chainId);
    });
    // Subscribe to provider connection
    web3Provider.on("connect", (info) => {
      console.log(info);
    });
    // Subscribe to provider disconnection
    web3Provider.on("disconnect", (error) => {
      console.log(error);
      setLoadingState('not-loaded');
    });

    try {
      console.log("wallet_switchEthereumChain");

      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x61' }],
      });


    } catch (switchError) {
      console.log("switchError");
      // This error code indicates that the chain has not been added to MetaMask.
      if (switchError.code === 4902) {
        try {

          console.log("wallet_addEthereumChain");
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x61'
              , chainName: "BSC TestNet"
              , rpcUrl: 'https://data-seed-prebsc-2-s1.binance.org:8545'
              , nativeCurrency: {
                  name: "BNB"
                  , symbol: "BNB"
                  , decimals: 18
              }
              , blockExplorerUrls: "https://testnet.bscscan.com/"
            }],
          });
        } catch (addError) {
          // handle "add" error
          console.error("AddError");
          console.error(addError);
        }
      }

      console.error("switchError");
      console.error(switchError);
      // handle other "switch" errors
    }


    /* create a generic provider and query for unsold market items */
    //const provider = new ethers.providers.JsonRpcProvider()
    //const provider = new ethers.providers.Web3Provider(web3.currentProvider)
    const provider = new ethers.providers.Web3Provider(web3Provider)
    const tokenContract = new ethers.Contract(nftaddress, NFT.abi, provider)
    const marketContract = new ethers.Contract(nftmarketaddress, Market.abi, provider)
    const data = await marketContract.fetchMarketItems()

    /*
    *  map over items returned from smart contract and format 
    *  them as well as fetch their token metadata
    */
    const items = await Promise.all(data.map(async i => {
      const tokenUri = await tokenContract.tokenURI(i.tokenId)
      const meta = await axios.get(tokenUri)
      let price = ethers.utils.formatUnits(i.price.toString(), 'ether')
      let item = {
        price,
        tokenId: i.tokenId.toNumber(),
        seller: i.seller,
        owner: i.owner,
        image: meta.data.image,
        name: meta.data.name,
        description: meta.data.description,
      }
      return item
    }))
    setNfts(items)
    setLoadingState('loaded')
  }

  async function buyNft(nft) {
    /* needs the user to sign the transaction, so will use Web3Provider and sign it */
    const web3Modal = new Web3Modal()
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)
    const signer = provider.getSigner()
    const contract = new ethers.Contract(nftmarketaddress, Market.abi, signer)

    /* user will be prompted to pay the asking proces to complete the transaction */
    const price = ethers.utils.parseUnits(nft.price.toString(), 'ether')
    const transaction = await contract.createMarketSale(nftaddress, nft.tokenId, {
      value: price
    })
    await transaction.wait()
    loadNFTs()
  }

  if (loadingState === 'loaded' && !nfts.length) return (<h1 className="px-20 py-10 text-3xl">No items in marketplace</h1>)

  if (loadingState === 'not-loaded' && !nfts.length) return (<PageLoader title="Loading..." />);

  return (

      <div className="flex justify-center">
        <div className="px-4" style={{ maxWidth: '1600px' }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
            {
              nfts.map((nft, i) => (
                  <div key={i} className="border shadow rounded-xl overflow-hidden">
                    <img src={nft.image} />
                    <div className="p-4">
                      <p style={{ height: '64px' }} className="text-2xl font-semibold">{nft.name}</p>
                      <div style={{ height: '70px', overflow: 'hidden' }}>
                        <p className="text-gray-400">{nft.description}</p>
                      </div>
                    </div>
                    <div className="p-4 bg-black">
                      <p className="text-2xl mb-4 font-bold text-white">{nft.price} BNB</p>
                      <button className="w-full bg-pink-500 text-white font-bold py-2 px-12 rounded" onClick={() => buyNft(nft)}>Buy</button>
                    </div>
                  </div>
              ))
            }
          </div>
        </div>
      </div>
  )
}