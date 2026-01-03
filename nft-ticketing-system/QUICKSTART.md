# NFT Ticketing System - Quick Start Guide

Özür dilerim, süratle bir NFT bilet sistemi kuracağız!

## ⚡ 5 Dakikalık Kurulum

### Adım 1: Klona ve Yükle

```bash
# Proje dizinine git
cd nft-ticketing-system

# Tüm bağımlılıkları yükle
npm install
cd backend && npm install && cd ..
```

### Adım 2: Environment Setup

```bash
# .env dosyası oluştur
cp .env.example .env
```

Düzenle `.env`:
```env
# Localhost testing
BLOCKCHAIN_NETWORK=localhost
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb476c55263f4c15e00d4b5ef
```

### Adım 3: Contract'ı Test Et

```bash
# Local Hardhat node başlat (Terminal 1)
npx hardhat node

# Yeni terminal'de (Terminal 2)
# Contract'ı test et
npx hardhat test

# Test sonuçları:
# ✅ Event Management
# ✅ Ticket Minting
# ✅ Transfers
# ✅ Validation
```

### Adım 4: Deploy Et

```bash
# Terminal 3'te
# Contract'ı deploy et
npx hardhat run scripts/deploy.js --network localhost

# Çıktı:
# ✅ NFTTicket deployed to: 0x5FbDB2315678afccb333f8a9c85e8640Ff0d5e1e
```

ABI oluştur:
```bash
node scripts/extract-abi.js
```

### Adım 5: Backend Başlat

```bash
# Terminal 4'te
cd backend
npm run dev

# Çıktı:
# ╔════════════════════════════════════════════╗
# ║   NFT Ticketing System - Backend Server    ║
# ╠════════════════════════════════════════════╣
# ║ Server: http://localhost:3001              
# ║ Health: http://localhost:3001/health       
# ║ Contract: 0x5FbDB2315678...
# ╚════════════════════════════════════════════╝
```

## 🚀 İlk İşlemleri Yap

### 1. Health Check

```bash
curl http://localhost:3001/health
```

### 2. Event Oluştur

```bash
curl -X POST http://localhost:3001/api/tickets/events \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Galatasaray Konseri",
    "description": "Harika bir konser",
    "location": "Istanbul",
    "date": "2024-06-15T20:00:00Z",
    "capacity": 1000,
    "price": "0.5"
  }'

# Response:
# {
#   "success": true,
#   "data": {
#     "txHash": "0x...",
#     "message": "Event created successfully"
#   }
# }
```

### 3. Bilet Mint Et

```bash
curl -X POST http://localhost:3001/api/tickets/mint \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": 1,
    "tier": "VIP",
    "seatNumber": 42
  }'

# Localhost'da sonuç anında confirm olur!
```

### 4. Biletinizi Kontrol Edin

```bash
curl http://localhost:3001/api/tickets/1
```

## 📊 Localhost vs Testnet

### Localhost (Geliştirme)
- ✅ Anında transaction confirmation
- ✅ Sınırsız ETH
- ✅ Hızlı testing
- ❌ Sunucu kapatırsa veriler silinir

```bash
npx hardhat run scripts/deploy.js --network localhost
```

### Sepolia Testnet (Staging)
- ✅ Gerçek testnet
- ✅ Etherscan doğrulama
- ⏳ 15+ saniye/block
- 💸 Faucet'ten ETH alın

```bash
# 1. https://sepoliafaucet.com adresinden ETH al
# 2. .env güncelle
BLOCKCHAIN_NETWORK=sepolia
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
SEPOLIA_PRIVATE_KEY=0x...

# 3. Deploy et
npx hardhat run scripts/deploy.js --network sepolia

# 4. Backend'i güncelle
BLOCKCHAIN_NETWORK=sepolia node backend/app.js
```

## 🔄 API Workflow

### Tipik Etkinlik Akışı

```
1. POST /api/tickets/events
   ↓
2. GET /api/tickets/events/:eventId
   ↓
3. POST /api/tickets/mint (Bilet satış)
   ↓
4. GET /api/tickets/user/:address (Kullanıcının biletleri)
   ↓
5. POST /api/tickets/:tokenId/transfer (Bilet transfer)
   ↓
6. POST /api/tickets/:tokenId/validate (Venue'de doğrula)
```

## 🎮 Postman Collection

Postman'e import etmek için:

```json
{
  "info": {
    "name": "NFT Ticketing System",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Create Event",
      "request": {
        "method": "POST",
        "url": "http://localhost:3001/api/tickets/events",
        "body": {
          "mode": "raw",
          "raw": "{\"name\": \"Concert\", \"location\": \"Istanbul\", \"date\": \"2024-06-15T20:00:00Z\", \"capacity\": 1000, \"price\": \"0.5\"}"
        }
      }
    },
    {
      "name": "Mint Ticket",
      "request": {
        "method": "POST",
        "url": "http://localhost:3001/api/tickets/mint",
        "body": {
          "mode": "raw",
          "raw": "{\"eventId\": 1, \"tier\": \"VIP\", \"seatNumber\": 42}"
        }
      }
    },
    {
      "name": "Get Ticket",
      "request": {
        "method": "GET",
        "url": "http://localhost:3001/api/tickets/1"
      }
    }
  ]
}
```

## 🐛 Sorun Giderme

### "Contract not initialized" hatası

```bash
# Kontrol et:
1. NFTTicket deploy edilmiş mi?
   → npx hardhat run scripts/deploy.js --network localhost
2. ABI dosyası var mı?
   → node scripts/extract-abi.js
3. .env doğru mu?
   → BLOCKCHAIN_NETWORK=localhost
   → NFT_TICKET_ADDRESS_LOCALHOST=0x5FbDB...
```

### "Insufficient payment" hatası

```bash
# Event price'ını kontrol et:
curl http://localhost:3001/api/tickets/events/1

# Bilet mint ederken doğru fiyatı gönder:
POST /api/tickets/mint
{
  "eventId": 1,
  "tier": "VIP",
  "seatNumber": 42
}
# Backend otomatik olarak event price'ını alır!
```

### RPC connection hatası

```bash
# Hardhat node'un çalıştığını kontrol et:
# Terminal 1'de:
npx hardhat node

# Çıktı şöyle olmalı:
# Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/
```

## 📚 Sonraki Adımlar

### 1. Metadata Setup (IPFS)
```bash
# Bilet metadata'sını IPFS'e yükle
# https://pinata.cloud kullan
```

### 2. Frontend Integration
```bash
# React/Next.js frontend oluştur
import { useContract } from 'wagmi';
```

### 3. Polygon'a Deploy
```bash
BLOCKCHAIN_NETWORK=polygon npx hardhat run scripts/deploy.js --network polygon
```

### 4. OpenSea Integration
- Contract'ı verify et
- OpenSea'ya submit et
- Marketplace'de satılabilir hale getir

## 🔗 Faydalı Linkler

- **Ethereum Docs**: https://ethereum.org/developers
- **Hardhat Docs**: https://hardhat.org
- **OpenZeppelin**: https://docs.openzeppelin.com
- **Ethers.js**: https://docs.ethers.org
- **Sepolia Faucet**: https://sepoliafaucet.com
- **Etherscan Sepolia**: https://sepolia.etherscan.io

## ⚠️ Güvenlik Notları

### Mainnet'e deploy etmeden önce:
- [ ] Contract'ı test et (npx hardhat test)
- [ ] Gas raporu kontrol et (REPORT_GAS=true npx hardhat test)
- [ ] Contract'ı code review yap
- [ ] Security audit yap
- [ ] Private key'i korumalı tut (.env'de, GitHub'a yükleme)

## 🎓 Learning Resources

Eğer daha derinlemesine bilgi istersen:

1. **Solidity Basics**
   - https://solidity-by-example.org

2. **ERC721 (NFT Standard)**
   - https://eips.ethereum.org/EIPS/eip-721

3. **Web3.js Interactions**
   - https://web3js.readthedocs.io

4. **Smart Contract Testing**
   - Hardhat testing docs

## 💬 Sorular / Sorununuz Varsa

- GitHub Issues açın
- Discussion sekmesine yazın
- support@ultrarslanoglu.com

---

**Happy Building! 🚀**
