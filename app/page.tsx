"use client";
import { useState, useEffect } from 'react';
import Web3 from 'web3';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Moon, Sun } from "lucide-react";
import BorrowTab from './components/BorrowTab';
import RepayTab from './components/RepayTab';
import LiquidationsTab from './components/LiquidationsTab';
import AccountTab from './components/AccountTab';
import { useWeb3 } from './contexts/Web3Contexts';

import { 
  DESTINATION_CONTRACT_ADDRESS, 
  MATIC_CONTRACT_ADDRESS,
  ORIGIN_CONTRACT_ADDRESS 
} from './config/addressess';
import MATIC_ABI from './config/abi/Matic_Contract_ABI.json';
import DESTINATION_ABI from './config/abi/DestinationContract_ABI.json';
import ORIGIN_ABI from './config/abi/OriginContract_ABI.json';
import Logo from './logo';

const SUPPORTED_NETWORKS = {
  SEPOLIA: {
    chainId: 11155111,
    name: 'Ethereum Sepolia',
    rpcUrl: 'https://sepolia.infura.io/v3/5fa6d48931744b27a5f31bb69fe1e2d0'
  },
  KOPLI: {
    chainId: 5318008,
    name: 'Kopli',
    rpcUrl: 'https://kopli-rpc.rkt.ink'
  }
};

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('darkMode');
      return saved ? JSON.parse(saved) : window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });
  
  const [selectedNetwork, setSelectedNetwork] = useState('');
  const [chainId, setChainId] = useState(11155111);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [maticBalance, setMaticBalance] = useState('0.00');
  const [balances, setBalances] = useState({
    eth: '0.00',
    matic: '0.00'
  });

  const {
    account, 
    setAccount,
    web3, 
    setWeb3,
    MaticContract,
    setMaticContract,
    setDestinationContract,
    setOriginContract
  } = useWeb3();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  const getCurrentNetworkKey = (currentChainId) => {
    return Object.keys(SUPPORTED_NETWORKS).find(
      key => SUPPORTED_NETWORKS[key].chainId === currentChainId
    ) || '';
  };

  const initializeContracts = async (web3Instance, currentChainId) => {
    // Clear all contracts first
    setMaticContract(null);
    setDestinationContract(null);
    setOriginContract(null);

    if (currentChainId === SUPPORTED_NETWORKS.KOPLI.chainId) {
      try {
        const maticContract = new web3Instance.eth.Contract(MATIC_ABI, MATIC_CONTRACT_ADDRESS);
        const destinationContract = new web3Instance.eth.Contract(DESTINATION_ABI, DESTINATION_CONTRACT_ADDRESS);
        
        // Set contracts only after successful initialization
        setMaticContract(maticContract);
        setDestinationContract(destinationContract);
        console.log("Initialized Kopli contracts:", { maticContract, destinationContract });
      } catch (error) {
        console.error("Error initializing Kopli contracts:", error);
      }
    } else if (currentChainId === SUPPORTED_NETWORKS.SEPOLIA.chainId) {
      try {
        const originContract = new web3Instance.eth.Contract(ORIGIN_ABI, ORIGIN_CONTRACT_ADDRESS);
        setOriginContract(originContract);
        console.log("Initialized Sepolia contract:", originContract);
      } catch (error) {
        console.error("Error initializing Sepolia contract:", error);
      }
    }
  };

  const updateBalances = async (address, web3Instance, currentChainId) => {
    if (!address || !web3Instance) return;

    try {
      // Get native token balance
      const balance = await web3Instance.eth.getBalance(address);
      const formattedBalance = web3Instance.utils.fromWei(balance, 'ether');
      
      setBalances(prev => ({
        ...prev,
        eth: Number(formattedBalance).toFixed(4)
      }));

      // Only fetch MATIC balance on Kopli network and when MaticContract is available
      if (currentChainId === SUPPORTED_NETWORKS.KOPLI.chainId && MaticContract) {
        try {
          const maticBalance = await MaticContract.methods.balanceOf(address).call();
          const formattedMaticBalance = web3Instance.utils.fromWei(maticBalance.toString(), 'ether');
          setMaticBalance(Number(formattedMaticBalance).toFixed(4));
          console.log('Updated MATIC balance:', formattedMaticBalance);
        } catch (error) {
          console.error('Error fetching MATIC balance:', error);
          setMaticBalance('0.00');
        }
      } else {
        // Reset MATIC balance when not on Kopli
        setMaticBalance('0.00');
      }
    } catch (error) {
      console.error('Error fetching balances:', error);
    }
  };

  // Effect to update balances when account, chainId, or MaticContract changes
  useEffect(() => {
    if (account && web3 && chainId) {
      updateBalances(account, web3, chainId);
    }
  }, [account, chainId, MaticContract]);

  const connectWallet = async () => {
    if (!window.ethereum) {
      setError('Please install MetaMask!');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length > 0) {
        setAccount(accounts[0]);
        const web3Instance = new Web3(window.ethereum);
        const chainId = await web3Instance.eth.getChainId();
        setChainId(chainId);
        setSelectedNetwork(getCurrentNetworkKey(chainId));
        
        // Initialize contracts before updating balances
        await initializeContracts(web3Instance, chainId);
        await updateBalances(accounts[0], web3Instance, chainId);
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const switchNetwork = async (networkName) => {
    try {
      setIsLoading(true);
      const network = SUPPORTED_NETWORKS[networkName.toUpperCase()];
      if (!network) throw new Error('Unsupported network');

      const chainIdHex = `0x${network.chainId.toString(16)}`;
      
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: chainIdHex }],
        });
      } catch (switchError) {
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: chainIdHex,
              chainName: network.name,
              rpcUrls: [network.rpcUrl],
            }],
          });
        } else {
          throw switchError;
        }
      }

      setSelectedNetwork(networkName);
      const web3Instance = new Web3(window.ethereum);
      setWeb3(web3Instance);
      
      const currentChainId = await web3Instance.eth.getChainId();
      setChainId(Number(currentChainId));
      
      // Initialize contracts before updating balances
      await initializeContracts(web3Instance, currentChainId);
      
      if (account) {
        await updateBalances(account, web3Instance, currentChainId);
      }
    } catch (error) {
      console.error('Error switching network:', error);
      setError('Failed to switch network');
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize Web3 and contracts on component mount
  useEffect(() => {
    if (window.ethereum) {
      connectWallet();
      initializeContracts(web3, chainId);
      const web3Instance = new Web3(window.ethereum);
      setWeb3(web3Instance);

      web3Instance.eth.getChainId().then(async (currentChainId) => {
        setChainId(currentChainId);
        const networkKey = getCurrentNetworkKey(currentChainId);
        setSelectedNetwork(networkKey);
        await initializeContracts(web3Instance, currentChainId);
      });

      web3Instance.eth.getAccounts().then(async (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          const currentChainId = await web3Instance.eth.getChainId();
          await updateBalances(accounts[0], web3Instance, currentChainId);
        }
      });

      const handleAccountsChanged = async (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          const currentChainId = await web3Instance.eth.getChainId();
          await updateBalances(accounts[0], web3Instance, currentChainId);
        } else {
          setAccount('');
          setBalances({ eth: '0.00', matic: '0.00' });
          setMaticBalance('0.00');
        }
      };

      const handleChainChanged = async (newChainId) => {
        const chainIdDecimal = parseInt(newChainId, 16);
        setChainId(chainIdDecimal);
        const networkKey = getCurrentNetworkKey(chainIdDecimal);
        setSelectedNetwork(networkKey);
        await initializeContracts(web3Instance, chainIdDecimal);
        if (account) {
          await updateBalances(account, web3Instance, chainIdDecimal);
        }
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  const formatAddress = (address) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const getNetworkName = () => {
    const currentNetwork = getCurrentNetworkKey(chainId);
    return currentNetwork ? SUPPORTED_NETWORKS[currentNetwork].name : "Unknown Network";
  };
  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`}>
      <div className="bg-background text-foreground">
        <header className="border-b">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Logo className="h-16 w-16" />
              <h1 className="text-3xl font-bold">ReactiveFlow Lender</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Select 
                value={selectedNetwork} 
                onValueChange={(value) => switchNetwork(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={getNetworkName()} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SEPOLIA">Ethereum Sepolia</SelectItem>
                  <SelectItem value="KOPLI">Kopli</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={connectWallet}
                disabled={isLoading}
                variant={error ? "destructive" : "default"}
              >
                {isLoading ? (
                  "Connecting..."
                ) : error ? (
                  "Error Connecting"
                ) : account ? (
                  formatAddress(account)
                ) : (
                  "Connect Wallet"
                )}
              </Button>
              <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-card text-card-foreground p-4 rounded-lg shadow">
              <h2 className="font-semibold mb-2">
                {chainId === 11155111 ? 'ETH' : 'KOPLI'} Balance
              </h2>
              <p className="text-2xl">{balances.eth} ETH</p>
            </div>
            {chainId === SUPPORTED_NETWORKS.KOPLI.chainId && (
              <div className="bg-card text-card-foreground p-4 rounded-lg shadow">
                <h2 className="font-semibold mb-2">MATIC Balance</h2>
                <p className="text-2xl">{maticBalance} MATIC</p>
              </div>
            )}
          </div>

          <Tabs defaultValue="borrow" className="space-y-4">
            <TabsList>
              <TabsTrigger value="borrow">Borrow</TabsTrigger>
              <TabsTrigger value="repay">Repay</TabsTrigger>
              <TabsTrigger value="liquidations">Liquidations</TabsTrigger>
              <TabsTrigger value="account">Account</TabsTrigger>
            </TabsList>
            <TabsContent value="borrow">
              <BorrowTab />
            </TabsContent>
            <TabsContent value="repay">
              <RepayTab />
            </TabsContent>
            <TabsContent value="liquidations">
              <LiquidationsTab />
            </TabsContent>
            <TabsContent value="account">
              <AccountTab />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}