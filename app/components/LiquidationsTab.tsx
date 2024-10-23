import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useWeb3 } from '../contexts/Web3Contexts'

const LiquidationsTab = () => {
  const [atRiskLoans, setAtRiskLoans] = useState([])
  const [loading, setLoading] = useState(false)
  const [processingLoan, setProcessingLoan] = useState(null)
  const { toast } = useToast()
  const { DestinationContract, account, web3 } = useWeb3()

  const loadAtRiskLoans = async () => {
    try {
      if (!account || !DestinationContract) return

      // Get all loans events from contract
      const loanRequestEvents = await DestinationContract.getPastEvents('LoanRequested', {
        fromBlock: 0,
        toBlock: 'latest'
      })

      // Process each loan to check if it's at risk
      const atRiskLoansData = await Promise.all(
        loanRequestEvents.map(async (event) => {
          const borrower = event.returnValues.borrower
          const loanDetails = await DestinationContract.methods.getLoanDetails(borrower).call()
          const [amount, repaidAmount, interestRate, dueDate, creditScore, active, funded] = loanDetails

          // Get total due amount
          const totalDue = await DestinationContract.methods.calculateTotalDue(borrower).call()
          
          // Calculate liquidation threshold (75% from contract)
          const liquidationValue = (Number(totalDue) * 75) / 100
          
          // Check if loan is at risk (repaid amount < liquidation threshold)
          if (active && funded && Number(repaidAmount) < liquidationValue) {
            return {
              id: borrower,
              borrower,
              amount: web3.utils.fromWei(amount, 'ether'),
              repaidAmount: web3.utils.fromWei(repaidAmount, 'ether'),
              totalDue: web3.utils.fromWei(totalDue, 'ether'),
              liquidationPrice: web3.utils.fromWei(liquidationValue.toString(), 'ether'),
              active,
              funded
            }
          }
          return null
        })
      )

      // Filter out null values and set state
      setAtRiskLoans(atRiskLoansData.filter(loan => loan !== null))
    } catch (error) {
      console.error('Error loading at-risk loans:', error)
      toast({
        title: "Error",
        description: "Failed to load at-risk loans. Please try again.",
        variant: "destructive"
      })
    }
  }

  useEffect(() => {
    if (account && DestinationContract) {
      loadAtRiskLoans()
    }
  }, [account, DestinationContract])

  const handleLiquidate = async (borrower) => {
    if (!account || !DestinationContract) return

    setProcessingLoan(borrower)
    setLoading(true)

    try {
      // Call liquidateLoan function from the contract
      await DestinationContract.methods
        .liquidateLoan(borrower)
        .send({ from: account })

      toast({
        title: "Success",
        description: "Loan has been successfully liquidated",
      })

      // Refresh the list of at-risk loans
      loadAtRiskLoans()
    } catch (error) {
      console.error('Error liquidating loan:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to liquidate loan. Please try again.",
        variant: "destructive"
      })
    } finally {
      setProcessingLoan(null)
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">At-Risk Loans</h2>
      {atRiskLoans.length > 0 ? (
        atRiskLoans.map((loan) => (
          <div key={loan.id} className="bg-card text-card-foreground p-4 rounded-lg shadow space-y-2">
            <div className="flex justify-between">
              <span>Borrower Address</span>
              <span className="font-mono text-sm">
                {loan.borrower.slice(0, 6)}...{loan.borrower.slice(-4)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Loan Amount</span>
              <span className="font-semibold">{loan.amount} MATIC</span>
            </div>
            <div className="flex justify-between">
              <span>Repaid Amount</span>
              <span className="font-semibold">{loan.repaidAmount} MATIC</span>
            </div>
            <div className="flex justify-between">
              <span>Total Due</span>
              <span className="font-semibold">{loan.totalDue} MATIC</span>
            </div>
            <div className="flex justify-between">
              <span>Liquidation Threshold</span>
              <span className="text-red-500 font-semibold">{loan.liquidationPrice} MATIC</span>
            </div>
            <Button 
              className="w-full" 
              onClick={() => handleLiquidate(loan.borrower)}
              disabled={loading || processingLoan === loan.borrower}
            >
              {processingLoan === loan.borrower ? "Processing..." : "Liquidate"}
            </Button>
          </div>
        ))
      ) : (
        <div className="text-center text-muted-foreground py-4">
          No at-risk loans found
        </div>
      )}
    </div>
  )
}

export default LiquidationsTab