"use client";
// contexts/Web3Context.tsx
import { createContext, useContext, useState, ReactNode } from 'react';
import Web3, { Contract } from 'web3';

// Define the context type
interface Web3ContextType {
  account: string;
  web3: Web3 | null;
  OriginContract: Contract | null;
  DestinationContract: Contract | null;
  loanDetails: LoanDetails | null;
  setLoanDetails: (loanDetails: LoanDetails) => void;
  setDestinationContract: (contract: Contract) => void;
  MaticContract: Contract | null;
  setMaticContract: (contract: Contract) => void;
  setWeb3: (web3: Web3) => void;
  setOriginContract: (contract: Contract) => void;
  setAccount: (account: string) => void;
}

interface LoanDetails {
  active: boolean;
  loanAmount: string;
  collateralAmount: string;
  interestRate: number;
  destinationChain: number;
  duration: number;
  paidCollateral: string;
}
// Create the Web3 context with an undefined default value
const Web3Context = createContext<Web3ContextType | undefined>(undefined);

interface Web3ProviderProps {
  children: ReactNode; // Define the type for children prop
}

export function Web3Provider({ children }: Web3ProviderProps) {
  const [account, setAccount] = useState<string>(''); // Explicitly type the state
  // Set Web3 provider
  const [web3, setWeb3] = useState<Web3 | null>(null);
  // Set Origin contract
  const [OriginContract, setOriginContract] = useState<Contract | null>(null);
  // Set Destination contract
  const [DestinationContract, setDestinationContract] = useState<Contract | null>(null);
  // Set Matic contract
  const [MaticContract, setMaticContract] = useState<Contract | null>(null);
  const [loanDetails, setLoanDetails] = useState<LoanDetails | null>(null);



  const value: Web3ContextType = {
    account,
    web3,
    OriginContract,
    DestinationContract,
    MaticContract,
    loanDetails,
    setLoanDetails,
    setDestinationContract,
    setMaticContract,
    setOriginContract,
    setWeb3,
    setAccount,
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
}

// Hook to use Web3 context
export const useWeb3 = (): Web3ContextType => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};
