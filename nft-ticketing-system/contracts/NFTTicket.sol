// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * NFT Ticket System
 * ERC721 based NFT ticketing platform
 * 
 * Features:
 * - Unique token-based tickets (no duplicates)
 * - Transferable tickets
 * - Burnable tickets
 * - Event management
 * - Ticket metadata tracking
 * - Access control
 */

contract NFTTicket is ERC721, ERC721Enumerable, ERC721Burnable, Ownable {
    using Counters for Counters.Counter;
    using Strings for uint256;

    // ============================================
    // STATE VARIABLES
    // ============================================

    // Token ID counter
    Counters.Counter private _tokenIdCounter;

    // Event structure
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
        string uri; // Base URI for metadata
    }

    // Ticket structure
    struct Ticket {
        uint256 tokenId;
        uint256 eventId;
        string tier; // VIP, Regular, Economy, etc.
        uint256 seatNumber;
        uint256 mintedAt;
        address originalMinter;
        uint256 transferCount;
        bool used; // For venue validation
    }

    // Event ID counter
    Counters.Counter private _eventIdCounter;

    // Event mapping
    mapping(uint256 => Event) public events;

    // Ticket metadata mapping
    mapping(uint256 => Ticket) public tickets;

    // Event tickets mapping (eventId => tokenIds)
    mapping(uint256 => uint256[]) public eventTickets;

    // Seat availability mapping (eventId => seatNumber => taken)
    mapping(uint256 => mapping(uint256 => bool)) public seatTaken;

    // Price per ticket in wei
    mapping(uint256 => uint256) public ticketPrices;

    // Whitelist addresses for minting
    mapping(address => bool) public whitelisted;

    // ============================================
    // EVENTS
    // ============================================

    event EventCreated(
        uint256 indexed eventId,
        string name,
        string location,
        uint256 date,
        uint256 capacity,
        address indexed eventOwner
    );

    event TicketMinted(
        uint256 indexed tokenId,
        uint256 indexed eventId,
        string tier,
        uint256 seatNumber,
        address indexed minter,
        uint256 price
    );

    event TicketTransferred(
        uint256 indexed tokenId,
        address indexed from,
        address indexed to,
        uint256 timestamp
    );

    event TicketBurned(
        uint256 indexed tokenId,
        uint256 indexed eventId,
        address indexed owner
    );

    event TicketValidated(
        uint256 indexed tokenId,
        uint256 indexed eventId,
        address indexed validator
    );

    event EventUpdated(
        uint256 indexed eventId,
        string name,
        bool active
    );

    event WhitelistUpdated(
        address indexed account,
        bool whitelisted
    );

    // ============================================
    // MODIFIERS
    // ============================================

    modifier eventExists(uint256 eventId) {
        require(eventId < _eventIdCounter.current(), "Event does not exist");
        _;
    }

    modifier eventActive(uint256 eventId) {
        require(events[eventId].active, "Event is not active");
        _;
    }

    modifier ticketExists(uint256 tokenId) {
        require(_ownerOf(tokenId) != address(0), "Ticket does not exist");
        _;
    }

    modifier onlyEventOwner(uint256 eventId) {
        require(msg.sender == events[eventId].eventOwner, "Only event owner can call this");
        _;
    }

    modifier onlyWhitelisted() {
        require(whitelisted[msg.sender] || msg.sender == owner(), "Not whitelisted");
        _;
    }

    modifier paymentValid(uint256 eventId, uint256 quantity) {
        require(
            msg.value >= events[eventId].price * quantity,
            "Insufficient payment"
        );
        _;
    }

    // ============================================
    // CONSTRUCTOR
    // ============================================

    constructor() ERC721("NFTTicket", "TICKET") {
        _eventIdCounter.increment(); // Start event IDs from 1
        whitelisted[msg.sender] = true;
    }

    // ============================================
    // EVENT MANAGEMENT
    // ============================================

    /**
     * Create a new event
     */
    function createEvent(
        string memory name,
        string memory description,
        string memory location,
        uint256 date,
        uint256 capacity,
        uint256 price,
        string memory baseUri
    ) public onlyWhitelisted returns (uint256) {
        require(bytes(name).length > 0, "Event name required");
        require(capacity > 0, "Capacity must be positive");
        require(date > block.timestamp, "Event date must be in future");
        require(price > 0, "Price must be positive");

        uint256 eventId = _eventIdCounter.current();
        _eventIdCounter.increment();

        events[eventId] = Event({
            name: name,
            description: description,
            location: location,
            date: date,
            capacity: capacity,
            ticketsSold: 0,
            price: price,
            eventOwner: msg.sender,
            active: true,
            uri: baseUri
        });

        emit EventCreated(eventId, name, location, date, capacity, msg.sender);

        return eventId;
    }

    /**
     * Update event details
     */
    function updateEvent(
        uint256 eventId,
        string memory name,
        string memory description,
        bool active
    ) public eventExists(eventId) onlyEventOwner(eventId) {
        require(bytes(name).length > 0, "Event name required");
        
        events[eventId].name = name;
        events[eventId].description = description;
        events[eventId].active = active;

        emit EventUpdated(eventId, name, active);
    }

    /**
     * Get event details
     */
    function getEvent(uint256 eventId) 
        public 
        view 
        eventExists(eventId) 
        returns (Event memory) 
    {
        return events[eventId];
    }

    /**
     * Get number of events
     */
    function getEventCount() public view returns (uint256) {
        return _eventIdCounter.current() - 1;
    }

    // ============================================
    // TICKET MINTING
    // ============================================

    /**
     * Mint a single ticket
     */
    function mintTicket(
        uint256 eventId,
        string memory tier,
        uint256 seatNumber
    ) 
        public 
        payable 
        eventExists(eventId) 
        eventActive(eventId) 
        paymentValid(eventId, 1) 
        returns (uint256) 
    {
        Event storage evt = events[eventId];

        // Validation
        require(evt.ticketsSold < evt.capacity, "Event sold out");
        require(!seatTaken[eventId][seatNumber], "Seat already taken");
        require(seatNumber > 0 && seatNumber <= evt.capacity, "Invalid seat number");
        require(bytes(tier).length > 0, "Tier required");

        // Mark seat as taken
        seatTaken[eventId][seatNumber] = true;

        // Create ticket
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        // Mint NFT
        _safeMint(msg.sender, tokenId);

        // Store ticket metadata
        tickets[tokenId] = Ticket({
            tokenId: tokenId,
            eventId: eventId,
            tier: tier,
            seatNumber: seatNumber,
            mintedAt: block.timestamp,
            originalMinter: msg.sender,
            transferCount: 0,
            used: false
        });

        // Add to event tickets
        eventTickets[eventId].push(tokenId);

        // Update event
        evt.ticketsSold++;

        emit TicketMinted(tokenId, eventId, tier, seatNumber, msg.sender, evt.price);

        return tokenId;
    }

    /**
     * Batch mint multiple tickets
     */
    function batchMintTickets(
        uint256 eventId,
        string memory tier,
        uint256[] calldata seatNumbers
    ) 
        public 
        payable 
        eventExists(eventId) 
        eventActive(eventId)
        paymentValid(eventId, seatNumbers.length)
        returns (uint256[] memory) 
    {
        require(seatNumbers.length > 0, "Must mint at least one ticket");
        require(seatNumbers.length <= 100, "Cannot mint more than 100 at once");

        uint256[] memory tokenIds = new uint256[](seatNumbers.length);

        for (uint256 i = 0; i < seatNumbers.length; i++) {
            tokenIds[i] = mintTicket(eventId, tier, seatNumbers[i]);
        }

        return tokenIds;
    }

    // ============================================
    // TICKET TRANSFER
    // ============================================

    /**
     * Override transfer to track transfer count
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override(ERC721, ERC721Enumerable) returns (address) {
        address from = _ownerOf(tokenId);

        if (from != address(0) && to != address(0)) {
            // Track transfer
            if (tickets[tokenId].tokenId != 0) {
                tickets[tokenId].transferCount++;
                emit TicketTransferred(tokenId, from, to, block.timestamp);
            }
        }

        return super._update(to, tokenId, auth);
    }

    /**
     * Transfer ticket with approval
     */
    function transferTicket(
        address to,
        uint256 tokenId
    ) public {
        require(to != address(0), "Invalid recipient");
        require(_ownerOf(tokenId) == msg.sender, "Not token owner");
        require(!tickets[tokenId].used, "Ticket already used");

        safeTransferFrom(msg.sender, to, tokenId);
    }

    // ============================================
    // TICKET VALIDATION
    // ============================================

    /**
     * Validate ticket at venue
     */
    function validateTicket(uint256 tokenId) 
        public 
        ticketExists(tokenId) 
        onlyEventOwner(tickets[tokenId].eventId)
    {
        require(!tickets[tokenId].used, "Ticket already used");
        
        tickets[tokenId].used = true;

        emit TicketValidated(
            tokenId,
            tickets[tokenId].eventId,
            msg.sender
        );
    }

    /**
     * Check if ticket is valid (not used)
     */
    function isTicketValid(uint256 tokenId) 
        public 
        view 
        ticketExists(tokenId) 
        returns (bool) 
    {
        return !tickets[tokenId].used;
    }

    /**
     * Get ticket details
     */
    function getTicket(uint256 tokenId) 
        public 
        view 
        ticketExists(tokenId) 
        returns (Ticket memory) 
    {
        return tickets[tokenId];
    }

    // ============================================
    // TICKET BURNING
    // ============================================

    /**
     * Burn ticket (override to track)
     */
    function burnTicket(uint256 tokenId) public {
        require(_ownerOf(tokenId) == msg.sender, "Not token owner");

        uint256 eventId = tickets[tokenId].eventId;
        
        _burn(tokenId);

        // Mark seat as available
        seatTaken[eventId][tickets[tokenId].seatNumber] = false;

        emit TicketBurned(tokenId, eventId, msg.sender);
    }

    // ============================================
    // TICKET QUERYING
    // ============================================

    /**
     * Get all tickets for an event
     */
    function getEventTickets(uint256 eventId) 
        public 
        view 
        eventExists(eventId) 
        returns (uint256[] memory) 
    {
        return eventTickets[eventId];
    }

    /**
     * Get tickets owned by an address
     */
    function getUserTickets(address user) 
        public 
        view 
        returns (uint256[] memory) 
    {
        uint256 balance = balanceOf(user);
        uint256[] memory tokenIds = new uint256[](balance);

        for (uint256 i = 0; i < balance; i++) {
            tokenIds[i] = tokenOfOwnerByIndex(user, i);
        }

        return tokenIds;
    }

    /**
     * Get ticket count for an event
     */
    function getEventTicketCount(uint256 eventId) 
        public 
        view 
        eventExists(eventId) 
        returns (uint256) 
    {
        return eventTickets[eventId].length;
    }

    /**
     * Get available seats for an event
     */
    function getAvailableSeats(uint256 eventId) 
        public 
        view 
        eventExists(eventId) 
        returns (uint256) 
    {
        return events[eventId].capacity - events[eventId].ticketsSold;
    }

    // ============================================
    // WHITELIST MANAGEMENT
    // ============================================

    /**
     * Add address to whitelist
     */
    function addWhitelisted(address account) public onlyOwner {
        require(account != address(0), "Invalid address");
        whitelisted[account] = true;
        emit WhitelistUpdated(account, true);
    }

    /**
     * Remove address from whitelist
     */
    function removeWhitelisted(address account) public onlyOwner {
        require(account != address(0), "Invalid address");
        whitelisted[account] = false;
        emit WhitelistUpdated(account, false);
    }

    /**
     * Check if address is whitelisted
     */
    function isWhitelisted(address account) public view returns (bool) {
        return whitelisted[account] || account == owner();
    }

    // ============================================
    // PAYMENT MANAGEMENT
    // ============================================

    /**
     * Withdraw funds
     */
    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");

        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }

    /**
     * Withdraw by event owner
     */
    function withdrawEventFunds(uint256 eventId) 
        public 
        eventExists(eventId) 
        onlyEventOwner(eventId) 
    {
        uint256 earnings = events[eventId].ticketsSold * events[eventId].price;
        require(earnings > 0, "No funds to withdraw");

        (bool success, ) = payable(msg.sender).call{value: earnings}("");
        require(success, "Withdrawal failed");
    }

    // ============================================
    // METADATA
    // ============================================

    /**
     * Get token URI
     */
    function tokenURI(uint256 tokenId) 
        public 
        view 
        override 
        ticketExists(tokenId) 
        returns (string memory) 
    {
        Ticket memory ticket = tickets[tokenId];
        Event memory evt = events[ticket.eventId];

        return string(
            abi.encodePacked(
                evt.uri,
                "/",
                tokenId.toString(),
                ".json"
            )
        );
    }

    // ============================================
    // INTERFACE SUPPORT
    // ============================================

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    // ============================================
    // INTERNAL FUNCTIONS
    // ============================================

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    // ============================================
    // RECEIVE ETH
    // ============================================

    receive() external payable {}
}
