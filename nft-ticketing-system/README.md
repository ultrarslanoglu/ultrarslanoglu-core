# NFT Tabanlı Bilet Sistemi

Solidity smart contract ve Node.js backend API'si ile tamamen merkezi olmayan NFT bilet sistemi. Her bilet unique token olarak temsil edilir, transfer edilebilir ama duplicate olamaz.

## 🎯 Özellikler

### Smart Contract (Solidity)
- **ERC721 Standartı**: OpenZeppelin kütüphanesine dayalı
- **Unique Tickets**: Her bilet farklı token ID'sine sahip, duplicate olamaz
- **Transferable**: Biletler kullanıcılar arasında transfer edilebilir
- **Event Management**: Etkinlik oluşturma, yönetme, iptal etme
- **Seat Management**: Koltuk yönetimi ve availability tracking
- **Whitelist**: Event organizer'lar için whitelist sistemi
- **Validation**: Bilet doğrulama (venue'de)
- **Burnable**: Biletler yakılabilir (geri iadesiz iptali için)

### Backend API (Node.js + Express)
- REST API endpoints
- Web3.js entegrasyonu
- Transaction management
- Gas estimation
- Event ve ticket operations

## 📁 Proje Yapısı

```
nft-ticketing-system/
├── contracts/
│   └── NFTTicket.sol              # Main smart contract
├── backend/
│   ├── app.js                     # Express server
│   ├── src/
│   │   ├── config/
│   │   │   └── blockchain.js     # Blockchain configuration
│   │   ├── services/
│   │   │   ├── Web3Service.js    # Web3 interactions
│   │   │   └── TicketService.js  # High-level ticket operations
│   │   └── routes/
│   │       └── tickets.js        # API endpoints
│   └── package.json
├── tests/
│   └── NFTTicket.test.js         # Contract tests
├── hardhat.config.js             # Hardhat configuration
├── .env.example                  # Environment variables template
└── README.md
```

## 🚀 Başlangıç

### 1. Kurulum

```bash
# Klona
git clone https://github.com/ultrarslanoglu/nft-ticketing-system
cd nft-ticketing-system

# Bağımlılıkları yükle
npm install

# Backend bağımlılıkları
cd backend
npm install
```

### 2. Environment Setup

```bash
# .env dosyası oluştur
cp .env.example .env

# Düzenle
PRIVATE_KEY=your_private_key_here
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
ETHERSCAN_API_KEY=your_etherscan_api_key
BLOCKCHAIN_NETWORK=sepolia
```

### 3. Smart Contract Deployment

```bash
# Lokalde test et
npx hardhat test

# Sepolia testnet'e deploy et
npx hardhat run scripts/deploy.js --network sepolia

# Contract'ı verify et
npx hardhat verify --network sepolia DEPLOYED_ADDRESS
```

### 4. Backend Server Başlat

```bash
cd backend
node app.js

# Veya development mode'da
npm run dev
```

Server `http://localhost:3001` üzerinde çalışacak.

## 📡 API Endpoints

### Event Endpoints

#### Event Oluştur
```bash
POST /api/tickets/events
Content-Type: application/json

{
  "name": "Galatasaray Konseri",
  "description": "Harika bir konser etkinliği",
  "location": "Istanbul",
  "date": "2024-06-15T20:00:00Z",
  "capacity": 5000,
  "price": "0.5",
  "baseUri": "ipfs://QmExample"
}
```

#### Event Bilgilerini Al
```bash
GET /api/tickets/events/:eventId
```

#### Event Sayısını Al
```bash
GET /api/tickets/events
```

### Ticket Endpoints

#### Tek Bilet Mint Et
```bash
POST /api/tickets/mint
Content-Type: application/json

{
  "eventId": 1,
  "tier": "VIP",
  "seatNumber": 42
}
```

**Not**: Endpoint otomatik olarak event price'ını alır ve request'i validate eder.

#### Toplu Bilet Mint Et
```bash
POST /api/tickets/batch-mint
Content-Type: application/json

{
  "eventId": 1,
  "tier": "Regular",
  "seatNumbers": [1, 2, 3, 4, 5]
}
```

#### Bilet Detaylarını Al
```bash
GET /api/tickets/:tokenId
```

Response:
```json
{
  "success": true,
  "data": {
    "tokenId": 1,
    "eventId": 1,
    "tier": "VIP",
    "seatNumber": 42,
    "mintedAt": "2024-01-15T10:30:00.000Z",
    "originalMinter": "0x...",
    "transferCount": 0,
    "used": false
  }
}
```

#### Kullanıcının Biletlerini Al
```bash
GET /api/tickets/user/0xUserAddress
```

Response:
```json
{
  "success": true,
  "data": {
    "address": "0xUserAddress",
    "ticketCount": 5,
    "tickets": [...]
  }
}
```

#### Event Biletlerini Al
```bash
GET /api/tickets/event/:eventId/tickets
```

#### Bilet Transfer Et
```bash
POST /api/tickets/:tokenId/transfer
Content-Type: application/json

{
  "toAddress": "0xRecipientAddress"
}
```

#### Bilet Doğrula (Venue'de)
```bash
POST /api/tickets/:tokenId/validate
```

#### Bilet Yak (İptal Et)
```bash
POST /api/tickets/:tokenId/burn
```

#### Bilet Geçerliliğini Kontrol Et
```bash
GET /api/tickets/:tokenId/valid
```

Response:
```json
{
  "success": true,
  "data": {
    "tokenId": 1,
    "isValid": true
  }
}
```

#### Etkinlik İçin Boş Koltukları Al
```bash
GET /api/tickets/event/:eventId/available
```

Response:
```json
{
  "success": true,
  "data": {
    "eventId": 1,
    "availableSeats": 4958
  }
}
```

### Sistem Endpoints

#### Health Check
```bash
GET /health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "services": {
    "web3": "connected",
    "blockchain": "sepolia"
  }
}
```

#### Contract Bilgisi
```bash
GET /contract/info
```

Response:
```json
{
  "success": true,
  "data": {
    "network": "sepolia",
    "contractAddress": "0x...",
    "signerAddress": "0x...",
    "rpcUrl": "configured"
  }
}
```

#### Gas Fiyatı
```bash
GET /contract/gas-price
```

Response:
```json
{
  "success": true,
  "data": {
    "gasPrice": "2500000000",
    "maxFeePerGas": "3000000000",
    "maxPriorityFeePerGas": "1000000000"
  }
}
```

#### İşlem Maliyeti Tahmini
```bash
POST /contract/estimate-cost
Content-Type: application/json

{
  "functionName": "mintTicket",
  "args": [1, "VIP", 42]
}
```

## 🧪 Testing

```bash
# Tüm testleri çalıştır
npx hardhat test

# Belirli test dosyasını çalıştır
npx hardhat test tests/NFTTicket.test.js

# Gas raporu ile test et
REPORT_GAS=true npx hardhat test

# Coverage raporu
npx hardhat coverage
```

## 💾 Smart Contract Detayları

### NFTTicket.sol

#### Event Yapısı
```solidity
struct Event {
    string name;
    string description;
    string location;
    uint256 date;
    uint256 capacity;
    uint256 ticketsSold;
    uint256 price;
    address eventOwner;
    bool active;
    string uri;
}
```

#### Ticket Yapısı
```solidity
struct Ticket {
    uint256 tokenId;
    uint256 eventId;
    string tier;        // VIP, Regular, Economy, vb.
    uint256 seatNumber;
    uint256 mintedAt;
    address originalMinter;
    uint256 transferCount;
    bool used;          // Venue'de kontrol için
}
```

### Ana Fonksiyonlar

#### Event Yönetimi
- `createEvent()` - Yeni etkinlik oluştur
- `updateEvent()` - Etkinlik güncelle
- `getEvent()` - Etkinlik bilgilerini al

#### Bilet İşlemleri
- `mintTicket()` - Tek bilet mint et
- `batchMintTickets()` - Toplu bilet mint et
- `transferTicket()` - Bilet transfer et
- `validateTicket()` - Venue'de doğrula
- `burnTicket()` - Bilet yak

#### Sorgulamalar
- `getUserTickets()` - Kullanıcının biletlerini al
- `getEventTickets()` - Etkinliğin biletlerini al
- `getAvailableSeats()` - Boş koltukları al
- `isTicketValid()` - Bilet geçerli mi kontrol et

## 🔐 Güvenlik

### Smart Contract
- OpenZeppelin ERC721 standartını kullanır
- Whitelist sistemi ile access control
- Duplicate seat prevention
- Event owner'lar tarafından ticket validation
- Secure payment handling

### Backend
- Environment variable'lar ile sensitive data
- CORS protection
- Input validation
- Error handling ve logging
- Gas price tracking

## 📊 Database / Storage

Sistem smart contract'ın internal state'ini kullanır:
- **Events**: Blockchain'de saklanır
- **Tickets**: NFT token'ları olarak saklanır
- **Seat Availability**: Contract state'inde track edilir

Off-chain tracking için opsiyonel:
```javascript
// MongoDB ile event metadata track etmek
const eventSchema = new mongoose.Schema({
  eventId: Number,
  contractAddress: String,
  metadata: {},
  createdAt: Date
});
```

## 🌐 Desteklenen Ağlar

- **Localhost**: Hardhat local network
- **Sepolia**: Ethereum test network
- **Polygon**: L2 production
- **Mumbai**: Polygon test network
- **Mainnet**: Ethereum mainnet

Network değiştirmek için:
```bash
# Backend'de
BLOCKCHAIN_NETWORK=polygon node app.js

# Hardhat'de
npx hardhat run scripts/deploy.js --network polygon
```

## 📝 Örnek Workflow

### 1. Event Oluştur
```bash
curl -X POST http://localhost:3001/api/tickets/events \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Galatasaray Konseri",
    "description": "2024 Yaz Konseri",
    "location": "Ülker Spor ve Etkinlik Salonu",
    "date": "2024-06-15T20:00:00Z",
    "capacity": 5000,
    "price": "0.5"
  }'
```

### 2. Bilet Mint Et
```bash
curl -X POST http://localhost:3001/api/tickets/mint \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": 1,
    "tier": "VIP",
    "seatNumber": 1
  }'
```

### 3. Kullanıcı Biletlerini Al
```bash
curl http://localhost:3001/api/tickets/user/0x123456...
```

### 4. Bilet Transfer Et
```bash
curl -X POST http://localhost:3001/api/tickets/1/transfer \
  -H "Content-Type: application/json" \
  -d '{
    "toAddress": "0xRecipient..."
  }'
```

### 5. Venue'de Doğrula
```bash
curl -X POST http://localhost:3001/api/tickets/1/validate
```

## 🐛 Troubleshooting

### "Contract not initialized" hatası
- `BLOCKCHAIN_NETWORK` ve contract address'i kontrol et
- `.env` dosyasının doğru yapılandırıldığından emin ol

### "Insufficient payment" hatası
- Event price'ını kontrol et
- Bilet fiyatı wei cinsinden gönderilen parayla eşleşmeli

### RPC connection hatası
- RPC URL'sinin doğru olduğundan emin ol
- Network seçimini kontrol et
- API rate limiting'i kontrol et

## 📚 İleri Konular

### Royalties (İsteğe bağlı)
ERC2981 ekleyerek secondary sales'da royalty:
```solidity
import "@openzeppelin/contracts/token/common/ERC2981.sol";
```

### Marketplace Integration
- Seaport protokolüyle uyumlu
- OpenSea üzerinde listelenebilir
- LooksRare, Blur gibi marketplace'lerde işlem yapılabilir

### IPFS Metadata
Bilet metadata'sı IPFS'e kaydedilebilir:
```javascript
{
  "name": "Galatasaray Konseri - VIP",
  "description": "2024 Yaz Konseri VIP Bileti",
  "image": "ipfs://QmImage...",
  "attributes": [
    { "trait_type": "Tier", "value": "VIP" },
    { "trait_type": "Seat", "value": "42" },
    { "trait_type": "Event", "value": "Galatasaray Concert" }
  ]
}
```

## 📄 License

MIT

## 🤝 Contributing

Pull request'ler welcome!

## 📞 Support

Sorularınız için: support@ultrarslanoglu.com
