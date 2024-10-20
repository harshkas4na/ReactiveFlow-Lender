import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Moon, Sun } from "lucide-react"
import BorrowTab from './components/BorrowTab'
import RepayTab from './components/RepayTab'
import LiquidationsTab from './components/LiquidationsTab'
import AccountTab from './components/AccountTab'

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isConnected, setIsConnected] = useState(false)

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
    document.documentElement.classList.toggle('dark')
  }

  const connectWallet = () => {
    // Implement wallet connection logic here
    setIsConnected(true)
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`}>
      <div className="bg-background text-foreground">
        <header className="border-b">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img src="/placeholder.svg?height=32&width=32" alt="dApp Logo" className="h-8 w-8" />
              <h1 className="text-xl font-bold">Cross-Chain Lending</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Select>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select Network" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ethereum">Ethereum Sepolia</SelectItem>
                  <SelectItem value="polygon">Polygon Mumbai</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={connectWallet}>
                {isConnected ? 'Connected' : 'Connect Wallet'}
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
              <h2 className="font-semibold mb-2">ETH Balance</h2>
              <p className="text-2xl">0.00 ETH</p>
            </div>
            <div className="bg-card text-card-foreground p-4 rounded-lg shadow">
              <h2 className="font-semibold mb-2">MATIC Balance</h2>
              <p className="text-2xl">0.00 MATIC</p>
            </div>
            <div className="bg-card text-card-foreground p-4 rounded-lg shadow">
              <h2 className="font-semibold mb-2">Active Loans</h2>
              <p className="text-2xl">0</p>
            </div>
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
  )
}