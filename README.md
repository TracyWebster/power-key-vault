# Power Key Vault 🔐⚡

A secure FHE-based energy management system built with FHEVM protocol by Zama. This project enables private energy consumption tracking and management using Fully Homomorphic Encryption, allowing users to record and analyze their energy data while maintaining complete privacy.

## 🚀 Live Demo

**🌐 [Try Power Key Vault](https://power-key-vault-phi.vercel.app/)**

## 🎥 Demo Video

Watch our demonstration of the Power Key Vault features:

[Demo Video](./project-demo.mp4)

*The video showcases encrypted energy record creation, decryption, and real-time updates using FHE technology.*

## ✨ Features

- **🔒 Private Energy Tracking**: Secure energy consumption and generation data using Fully Homomorphic Encryption
- **🧮 Confidential Calculations**: Perform computations on encrypted data without revealing sensitive information
- **⚡ Real-time Updates**: Live event listening for instant record synchronization
- **🎨 Modern UI**: Beautiful Next.js frontend with Tailwind CSS and shadcn/ui components
- **🔗 Blockchain Integration**: Seamless smart contract interaction with MetaMask and RainbowKit
- **📊 Energy Analytics**: Track generation vs consumption with encrypted totals
- **🛡️ Type-safe**: Full TypeScript implementation with comprehensive error handling

## 🏗️ Architecture

### Smart Contracts
- **EnergyVault.sol**: Main contract for managing encrypted energy records
- **FHECounter.sol**: Example FHE counter for demonstration purposes

### Frontend Application
- **Next.js 14**: Modern React framework with App Router
- **FHEVM Integration**: Custom hooks for FHE operations
- **RainbowKit**: Wallet connection and management
- **Real-time Events**: Contract event listening for live updates

## 🛠️ Quick Start

### Prerequisites

- **Node.js**: Version 20 or higher
- **pnpm/npm/yarn**: Package manager
- **MetaMask**: Browser wallet extension

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/TracyWebster/power-key-vault.git
   cd power-key-vault
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd frontend && npm install
   ```

3. **Set up environment variables**
   ```bash
   # Backend configuration
   npx hardhat vars set MNEMONIC
   npx hardhat vars set INFURA_API_KEY
   npx hardhat vars set ETHERSCAN_API_KEY
   ```

4. **Compile contracts**
   ```bash
   npm run compile
   ```

5. **Run tests**
   ```bash
   npm run test
   ```

### Local Development

1. **Start local FHEVM node**
   ```bash
   npx hardhat node
   ```

2. **Deploy contracts**
   ```bash
   npx hardhat deploy --network localhost
   ```

3. **Start frontend**
   ```bash
   cd frontend
   npm run dev
   ```

4. **Access the application**
   Open [http://localhost:3000](http://localhost:3000) in your browser

### Sepolia Testnet Deployment

1. **Deploy to Sepolia**
   ```bash
   npx hardhat deploy --network sepolia
   ```

2. **Verify contracts**
   ```bash
   npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
   ```

## 📁 Project Structure

```
power-key-vault/
├── contracts/                 # Smart contracts
│   ├── EnergyVault.sol       # Main energy management contract
│   └── FHECounter.sol        # Example FHE counter
├── deploy/                   # Deployment scripts
├── tasks/                    # Hardhat custom tasks
├── test/                     # Contract tests
├── frontend/                 # Next.js application
│   ├── app/                  # App router pages
│   ├── components/           # React components
│   │   ├── ui/              # shadcn/ui components
│   │   ├── CreateEnergyRecord.tsx
│   │   ├── EnergyMeter.tsx
│   │   └── EnergyRecordsList.tsx
│   ├── hooks/               # Custom React hooks
│   │   ├── useEnergyVault.tsx
│   │   ├── useFHECounter.tsx
│   │   └── metamask/        # MetaMask integration
│   ├── fhevm/               # FHEVM utilities
│   └── abi/                 # Generated contract ABIs
├── hardhat.config.ts        # Hardhat configuration
└── project-demo.mp4         # Demo video
```

## 🔧 Available Scripts

### Backend (Smart Contracts)
| Script | Description |
|--------|-------------|
| `npm run compile` | Compile all contracts |
| `npm run test` | Run contract tests |
| `npm run coverage` | Generate test coverage |
| `npm run lint` | Run Solidity linting |
| `npm run clean` | Clean build artifacts |

### Frontend
| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run genabi` | Generate contract ABIs |

## 🔐 Security Features

- **Zero-Knowledge Privacy**: Energy data remains encrypted on-chain
- **Owner-Only Access**: Only record owners can decrypt their data
- **Input Validation**: Comprehensive client and contract-side validation
- **Error Handling**: Robust error management with user-friendly messages
- **Type Safety**: Full TypeScript coverage with strict typing

## 🌐 Supported Networks

- **Local Development**: Hardhat Network
- **Testnet**: Sepolia (with FHEVM support)
- **Frontend Deployment**: Vercel

## 📚 Documentation & Resources

- **[FHEVM Documentation](https://docs.zama.ai/fhevm)**: Complete guide to FHEVM
- **[Zama GitHub](https://github.com/zama-ai)**: Official Zama repositories
- **[FHEVM Hardhat Plugin](https://docs.zama.ai/protocol/solidity-guides/development-guide/hardhat)**: Development tools

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the BSD-3-Clause-Clear License. See the [LICENSE](LICENSE) file for details.

## 🆘 Support & Community

- **Issues**: [GitHub Issues](https://github.com/TracyWebster/power-key-vault/issues)
- **Documentation**: [FHEVM Docs](https://docs.zama.ai)
- **Community**: [Zama Discord](https://discord.gg/zama)

---

**Built with ❤️ using FHEVM by Zama**

*Enabling private computation on encrypted data for a more secure future.*
