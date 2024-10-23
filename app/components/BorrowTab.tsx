"use client";
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { InfoIcon } from 'lucide-react';
import LoanRequestModal from './LoanRequestModal';
import { useWeb3 } from '../contexts/Web3Contexts';
import Web3 from 'web3';
import TransactionStore from '../utils/transactionHistory';

interface LoanDetails {
  active: boolean;
  loanAmount: string;
  collateralAmount: string;
  interestRate: number;
  destinationChain: number;
  duration: number;
  paidCollateral: string;
}



export default function BorrowTab() {
  const { account, OriginContract, web3,loanDetails,setLoanDetails } = useWeb3();

  // State management
  const [isProcessing, setIsProcessing] = useState(false);
  const [loanAmount, setLoanAmount] = useState(0);
  const [loanDuration, setLoanDuration] = useState("30");
  const [estimatedCollateral, setEstimatedCollateral] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [maticPrice, setMaticPrice] = useState(0);
  const [ethPrice, setEthPrice] = useState(0);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [collateralStatus, setCollateralStatus] = useState({
    isFullyCollateralized: false,
    remainingCollateral: '0'
  });

  // Constants
  const COLLATERALIZATION_RATIO = 150;
  const LIQUIDATION_THRESHOLD = 75;
  const LTV_RATIO = 50;

  // Fetch loan details
  const fetchLoanDetails = async () => {
    if (!OriginContract || !account) return;

    try {
      const details = await OriginContract.methods.getLoanDetails(account).call();
      
      const parsedDetails: LoanDetails = {
        active: details[6],
        loanAmount: details[0],
        collateralAmount: details[1],
        destinationChain: Number(details[2]),
        interestRate: Number(details[3]),
        paidCollateral: details[4],
        duration: Number(details[5])
      };

      setLoanDetails(parsedDetails);
      

      // Calculate collateral status
      await updateCollateralStatus(parsedDetails);
    } catch (error) {
      console.error('Error fetching loan details:', error);
    }
  };

  // Update collateral status
  const updateCollateralStatus = async (details: LoanDetails) => {
    if (!OriginContract || !details.loanAmount) return;

    try {
      const requiredCollateral = await OriginContract.methods.calculateRequiredCollateral(details.loanAmount).call();
      const paidCollateral = details.paidCollateral || '0';
      
      
      setEstimatedCollateral(Number(requiredCollateral));
    } catch (error) {
      console.error('Error updating collateral status:', error);
    }
  };

  // Fetch prices
  useEffect(() => {
    const fetchPrices = async () => {
      if (!OriginContract) return;
      
      try {
        const [maticPriceData, ethPriceData] = await Promise.all([
          OriginContract.methods.getMaticPrice().call(),
          OriginContract.methods.getEthPrice().call()
        ]);
        
        setPriceError(null);
        setMaticPrice(Number(maticPriceData) / 10**8);
        setEthPrice(Number(ethPriceData) / 10**8);
      } catch (error) {
        setPriceError("Error fetching prices");
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 30000); // Update prices every 30 seconds
    return () => clearInterval(interval);
  }, [OriginContract]);

  // Fetch loan details on mount and when account changes
  useEffect(() => {
    fetchLoanDetails();
  }, [account, OriginContract]);

  // Handle loan amount changes
  useEffect(() => {
    const updateEstimatedCollateral = async () => {
      if (!OriginContract || !loanAmount) return;
      
      try {
        const web3 = new Web3(window.ethereum);
        const loanAmountWei = web3.utils.toWei(loanAmount.toString(), 'ether');
        const required = await OriginContract.methods.calculateRequiredCollateral(loanAmountWei).call();
        setEstimatedCollateral(Number(required));
      } catch (error) {
        console.error('Error calculating estimated collateral:', error);
      }
    };

    updateEstimatedCollateral();
  }, [loanAmount]);

  const handleDepositCollateral = async () => {
    if (!OriginContract || !account || !loanDetails) return;
  
    setIsProcessing(true);
    try {
      const CurLoanDetails = await OriginContract.methods.getLoanDetails(account).call();
      const requiredCollateral = await OriginContract.methods.calculateRequiredCollateral(Number(CurLoanDetails[1])).call();
      const tx = await OriginContract.methods.depositCollateral().send({
        from: account,
        value: requiredCollateral
      });
  
      // Use the centralized transaction store
      TransactionStore.saveTransaction({
        chain: 'sepolia',
        type: 'Deposit Collateral',
        amount: Number(web3?.utils.fromWei(requiredCollateral, 'ether')),
        token: 'ETH',
        status: 'completed',
        txHash: tx.transactionHash
      });
  
      setLoanAmount(Number(CurLoanDetails[1]));
      setCollateralStatus({ isFullyCollateralized: true, remainingCollateral: '0' });
      await fetchLoanDetails();
    } catch (error) {
      console.error('Error depositing collateral:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoanRequest = () => {
    setIsModalOpen(true);
  };

  // Calculate button states
  const canRequestLoan = !isProcessing && 
                        loanAmount > 0 && 
                        (!loanDetails?.active || collateralStatus.isFullyCollateralized);
                        
  const canDepositCollateral = !isProcessing && 
                              !loanDetails?.active && 
                              !collateralStatus.isFullyCollateralized;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Loan Request</h2>
          <div className="space-y-2">
            <Label htmlFor="loanAmount">MATIC Amount</Label>
            <Input
              id="loanAmount"
              type="number"
              placeholder="0.00"
              value={loanAmount}
              onChange={(e) => setLoanAmount(Number(e.target.value))}
              disabled={loanDetails?.active && !collateralStatus.isFullyCollateralized}
            />
          </div>
          <div className="text-sm">
            <p>
              Current MATIC/USD: {
                priceError ? 
                <span className="text-red-500">{priceError}</span> : 
                maticPrice ? 
                `$${Number(maticPrice).toFixed(2)}` : 
                "Loading..."
              }
            </p>
            <p>Loan Value: ${(Number(loanAmount) * (Number(maticPrice) || 0)).toFixed(2)}</p>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Loan Details</h2>
          <div className="space-y-2">
            <Label>Interest Rate</Label>
            <p className="text-xl">
              {loanDetails?.interestRate 
                ? `${(loanDetails.interestRate / 100).toFixed(2)}%` 
                : "Pending credit assessment"}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="duration">Loan Duration</Label>
            <Select 
              value={loanDuration} 
              onValueChange={setLoanDuration}
              disabled={loanDetails?.active && !collateralStatus.isFullyCollateralized}
            >
              <SelectTrigger id="duration">
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="60">60 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
         {canDepositCollateral? <div className="space-y-2">
            <Label>Required Collateral (ETH)</Label>
            <p className="text-xl font-bold">
              {web3?.utils.fromWei(estimatedCollateral.toString(), 'ether')} ETH
            </p>
            
          </div>:<>
          </>}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Risk Parameters</h2>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label>Collateralization Ratio</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <InfoIcon className="h-4 w-4" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Required collateral-to-loan ratio ({COLLATERALIZATION_RATIO}%)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Slider defaultValue={[COLLATERALIZATION_RATIO]} max={200} step={1} disabled />
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label>Liquidation Threshold</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <InfoIcon className="h-4 w-4" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Position will be liquidated if collateral value falls below {LIQUIDATION_THRESHOLD}%</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-xl">{LIQUIDATION_THRESHOLD}%</p>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label>Loan-to-Value (LTV) Ratio</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <InfoIcon className="h-4 w-4" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Maximum borrowing power against collateral ({LTV_RATIO}%)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-xl">{LTV_RATIO}%</p>
        </div>
      </div>

      <div className="space-y-4">
        <Button 
          className="w-full" 
          size="lg" 
          onClick={handleLoanRequest}
          disabled={!canRequestLoan}
        >
          {isProcessing ? 'Processing...' : 'Request Loan'}
        </Button>
        {!collateralStatus.isFullyCollateralized && (
          <Button 
            className="w-full" 
            size="lg" 
            onClick={handleDepositCollateral}
            disabled={!canDepositCollateral}
          >
            {isProcessing ? 'Processing...' : `Deposit Additional Collateral`}
          </Button>
        )}
      </div>

      <LoanRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        loanAmount={loanAmount}
        loanDuration={Number(loanDuration)}
        estimatedCollateral={estimatedCollateral}
        isProcessing={isProcessing}
      />
    </div>
  );
}