/**
 * NFT Ticket Contract Tests
 * Comprehensive testing suite for NFTTicket contract
 */

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NFTTicket Contract", function () {
  let nftTicket;
  let owner;
  let addr1;
  let addr2;
  let addrs;

  beforeEach(async function () {
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    const NFTTicket = await ethers.getContractFactory("NFTTicket");
    nftTicket = await NFTTicket.deploy();
    await nftTicket.waitForDeployment();
  });

  // ============================================
  // DEPLOYMENT TESTS
  // ============================================

  describe("Deployment", function () {
    it("Should deploy with correct name and symbol", async function () {
      expect(await nftTicket.name()).to.equal("NFTTicket");
      expect(await nftTicket.symbol()).to.equal("TICKET");
    });

    it("Should set deployer as owner", async function () {
      expect(await nftTicket.owner()).to.equal(owner.address);
    });

    it("Should whitelist owner on deployment", async function () {
      expect(await nftTicket.isWhitelisted(owner.address)).to.be.true;
    });
  });

  // ============================================
  // EVENT MANAGEMENT TESTS
  // ============================================

  describe("Event Management", function () {
    const eventData = {
      name: "Galatasaray Concert",
      description: "Amazing concert event",
      location: "Istanbul",
      capacity: 1000,
      price: ethers.parseEther("0.5"),
      baseUri: "ipfs://QmExample"
    };

    it("Should create event", async function () {
      const futureDate = Math.floor(Date.now() / 1000) + 86400; // 1 day from now

      const tx = await nftTicket.createEvent(
        eventData.name,
        eventData.description,
        eventData.location,
        futureDate,
        eventData.capacity,
        eventData.price,
        eventData.baseUri
      );

      await expect(tx).to.emit(nftTicket, "EventCreated");

      const eventCount = await nftTicket.getEventCount();
      expect(eventCount).to.equal(1);
    });

    it("Should not create event with past date", async function () {
      const pastDate = Math.floor(Date.now() / 1000) - 86400;

      await expect(
        nftTicket.createEvent(
          eventData.name,
          eventData.description,
          eventData.location,
          pastDate,
          eventData.capacity,
          eventData.price,
          eventData.baseUri
        )
      ).to.be.revertedWith("Event date must be in future");
    });

    it("Should not create event with zero capacity", async function () {
      const futureDate = Math.floor(Date.now() / 1000) + 86400;

      await expect(
        nftTicket.createEvent(
          eventData.name,
          eventData.description,
          eventData.location,
          futureDate,
          0,
          eventData.price,
          eventData.baseUri
        )
      ).to.be.revertedWith("Capacity must be positive");
    });

    it("Should get event details", async function () {
      const futureDate = Math.floor(Date.now() / 1000) + 86400;

      await nftTicket.createEvent(
        eventData.name,
        eventData.description,
        eventData.location,
        futureDate,
        eventData.capacity,
        eventData.price,
        eventData.baseUri
      );

      const event = await nftTicket.getEvent(1);

      expect(event.name).to.equal(eventData.name);
      expect(event.location).to.equal(eventData.location);
      expect(event.capacity).to.equal(eventData.capacity);
      expect(event.active).to.be.true;
    });

    it("Should update event", async function () {
      const futureDate = Math.floor(Date.now() / 1000) + 86400;

      await nftTicket.createEvent(
        eventData.name,
        eventData.description,
        eventData.location,
        futureDate,
        eventData.capacity,
        eventData.price,
        eventData.baseUri
      );

      await nftTicket.updateEvent(1, "Updated Name", "Updated Description", false);

      const event = await nftTicket.getEvent(1);
      expect(event.name).to.equal("Updated Name");
      expect(event.active).to.be.false;
    });
  });

  // ============================================
  // TICKET MINTING TESTS
  // ============================================

  describe("Ticket Minting", function () {
    let eventDate;

    beforeEach(async function () {
      eventDate = Math.floor(Date.now() / 1000) + 86400;

      await nftTicket.createEvent(
        "Test Event",
        "Description",
        "Location",
        eventDate,
        10,
        ethers.parseEther("1"),
        "ipfs://QmExample"
      );
    });

    it("Should mint single ticket", async function () {
      const tx = await nftTicket.mintTicket(1, "VIP", 1, {
        value: ethers.parseEther("1")
      });

      await expect(tx).to.emit(nftTicket, "TicketMinted");

      const balance = await nftTicket.balanceOf(owner.address);
      expect(balance).to.equal(1);
    });

    it("Should not mint duplicate seat", async function () {
      await nftTicket.mintTicket(1, "VIP", 1, {
        value: ethers.parseEther("1")
      });

      await expect(
        nftTicket.mintTicket(1, "Regular", 1, {
          value: ethers.parseEther("1")
        })
      ).to.be.revertedWith("Seat already taken");
    });

    it("Should not mint with insufficient payment", async function () {
      await expect(
        nftTicket.mintTicket(1, "VIP", 1, {
          value: ethers.parseEther("0.5")
        })
      ).to.be.revertedWith("Insufficient payment");
    });

    it("Should not mint when sold out", async function () {
      // Mint all tickets
      for (let i = 1; i <= 10; i++) {
        await nftTicket.mintTicket(1, "Regular", i, {
          value: ethers.parseEther("1")
        });
      }

      // Try to mint one more
      await expect(
        nftTicket.mintTicket(1, "Regular", 11, {
          value: ethers.parseEther("1")
        })
      ).to.be.revertedWith("Event sold out");
    });

    it("Should batch mint tickets", async function () {
      const seatNumbers = [1, 2, 3, 4, 5];

      const tx = await nftTicket.batchMintTickets(1, "Regular", seatNumbers, {
        value: ethers.parseEther("5")
      });

      await expect(tx).to.emit(nftTicket, "TicketMinted");

      const balance = await nftTicket.balanceOf(owner.address);
      expect(balance).to.equal(5);
    });

    it("Should track ticket metadata", async function () {
      await nftTicket.mintTicket(1, "VIP", 1, {
        value: ethers.parseEther("1")
      });

      const ticket = await nftTicket.getTicket(1);
      expect(ticket.eventId).to.equal(1);
      expect(ticket.tier).to.equal("VIP");
      expect(ticket.seatNumber).to.equal(1);
      expect(ticket.transferCount).to.equal(0);
      expect(ticket.used).to.be.false;
    });
  });

  // ============================================
  // TRANSFER TESTS
  // ============================================

  describe("Ticket Transfer", function () {
    let eventDate;

    beforeEach(async function () {
      eventDate = Math.floor(Date.now() / 1000) + 86400;

      await nftTicket.createEvent(
        "Test Event",
        "Description",
        "Location",
        eventDate,
        10,
        ethers.parseEther("1"),
        "ipfs://QmExample"
      );

      await nftTicket.mintTicket(1, "VIP", 1, {
        value: ethers.parseEther("1")
      });
    });

    it("Should transfer ticket", async function () {
      const tx = await nftTicket.transferTicket(addr1.address, 1);

      await expect(tx).to.emit(nftTicket, "TicketTransferred");

      const owner_after = await nftTicket.ownerOf(1);
      expect(owner_after).to.equal(addr1.address);
    });

    it("Should track transfer count", async function () {
      await nftTicket.transferTicket(addr1.address, 1);

      const ticket = await nftTicket.getTicket(1);
      expect(ticket.transferCount).to.equal(1);
    });

    it("Should not transfer used ticket", async function () {
      await nftTicket.validateTicket(1);

      await expect(
        nftTicket.transferTicket(addr1.address, 1)
      ).to.be.revertedWith("Ticket already used");
    });
  });

  // ============================================
  // VALIDATION TESTS
  // ============================================

  describe("Ticket Validation", function () {
    let eventDate;

    beforeEach(async function () {
      eventDate = Math.floor(Date.now() / 1000) + 86400;

      await nftTicket.createEvent(
        "Test Event",
        "Description",
        "Location",
        eventDate,
        10,
        ethers.parseEther("1"),
        "ipfs://QmExample"
      );

      await nftTicket.mintTicket(1, "VIP", 1, {
        value: ethers.parseEther("1")
      });
    });

    it("Should validate ticket", async function () {
      const tx = await nftTicket.validateTicket(1);

      await expect(tx).to.emit(nftTicket, "TicketValidated");

      const isValid = await nftTicket.isTicketValid(1);
      expect(isValid).to.be.false;
    });

    it("Should not validate already used ticket", async function () {
      await nftTicket.validateTicket(1);

      await expect(
        nftTicket.validateTicket(1)
      ).to.be.revertedWith("Ticket already used");
    });
  });

  // ============================================
  // BURN TESTS
  // ============================================

  describe("Ticket Burning", function () {
    let eventDate;

    beforeEach(async function () {
      eventDate = Math.floor(Date.now() / 1000) + 86400;

      await nftTicket.createEvent(
        "Test Event",
        "Description",
        "Location",
        eventDate,
        10,
        ethers.parseEther("1"),
        "ipfs://QmExample"
      );

      await nftTicket.mintTicket(1, "VIP", 1, {
        value: ethers.parseEther("1")
      });
    });

    it("Should burn ticket", async function () {
      const tx = await nftTicket.burnTicket(1);

      await expect(tx).to.emit(nftTicket, "TicketBurned");

      const balance = await nftTicket.balanceOf(owner.address);
      expect(balance).to.equal(0);
    });

    it("Should mark seat as available after burn", async function () {
      await nftTicket.burnTicket(1);

      // Should be able to mint same seat again
      const tx = await nftTicket.mintTicket(1, "Regular", 1, {
        value: ethers.parseEther("1")
      });

      await expect(tx).to.emit(nftTicket, "TicketMinted");
    });
  });

  // ============================================
  // QUERY TESTS
  // ============================================

  describe("Ticket Queries", function () {
    let eventDate;

    beforeEach(async function () {
      eventDate = Math.floor(Date.now() / 1000) + 86400;

      await nftTicket.createEvent(
        "Test Event",
        "Description",
        "Location",
        eventDate,
        100,
        ethers.parseEther("1"),
        "ipfs://QmExample"
      );

      // Mint some tickets
      for (let i = 1; i <= 5; i++) {
        await nftTicket.mintTicket(1, "Regular", i, {
          value: ethers.parseEther("1")
        });
      }
    });

    it("Should get user tickets", async function () {
      const tickets = await nftTicket.getUserTickets(owner.address);
      expect(tickets.length).to.equal(5);
    });

    it("Should get event tickets", async function () {
      const tickets = await nftTicket.getEventTickets(1);
      expect(tickets.length).to.equal(5);
    });

    it("Should get available seats", async function () {
      const available = await nftTicket.getAvailableSeats(1);
      expect(available).to.equal(95); // 100 - 5 minted
    });
  });

  // ============================================
  // WHITELIST TESTS
  // ============================================

  describe("Whitelist Management", function () {
    it("Should add address to whitelist", async function () {
      const tx = await nftTicket.addWhitelisted(addr1.address);

      await expect(tx).to.emit(nftTicket, "WhitelistUpdated");

      expect(await nftTicket.isWhitelisted(addr1.address)).to.be.true;
    });

    it("Should remove address from whitelist", async function () {
      await nftTicket.addWhitelisted(addr1.address);
      await nftTicket.removeWhitelisted(addr1.address);

      expect(await nftTicket.isWhitelisted(addr1.address)).to.be.false;
    });

    it("Should require whitelist for event creation", async function () {
      const futureDate = Math.floor(Date.now() / 1000) + 86400;

      await expect(
        nftTicket.connect(addr1).createEvent(
          "Test",
          "Description",
          "Location",
          futureDate,
          100,
          ethers.parseEther("1"),
          "ipfs://QmExample"
        )
      ).to.be.revertedWith("Not whitelisted");
    });
  });

  // ============================================
  // PAYMENT TESTS
  // ============================================

  describe("Payment Handling", function () {
    it("Should accept ETH payments", async function () {
      const futureDate = Math.floor(Date.now() / 1000) + 86400;

      await nftTicket.createEvent(
        "Test Event",
        "Description",
        "Location",
        futureDate,
        10,
        ethers.parseEther("1"),
        "ipfs://QmExample"
      );

      const initialBalance = await ethers.provider.getBalance(nftTicket.target);

      await nftTicket.mintTicket(1, "VIP", 1, {
        value: ethers.parseEther("1")
      });

      const finalBalance = await ethers.provider.getBalance(nftTicket.target);
      expect(finalBalance - initialBalance).to.equal(ethers.parseEther("1"));
    });

    it("Should allow owner to withdraw funds", async function () {
      const futureDate = Math.floor(Date.now() / 1000) + 86400;

      await nftTicket.createEvent(
        "Test Event",
        "Description",
        "Location",
        futureDate,
        10,
        ethers.parseEther("1"),
        "ipfs://QmExample"
      );

      await nftTicket.mintTicket(1, "VIP", 1, {
        value: ethers.parseEther("1")
      });

      const initialBalance = await ethers.provider.getBalance(owner.address);

      const tx = await nftTicket.withdraw();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      const finalBalance = await ethers.provider.getBalance(owner.address);

      // Balance should increase by approximately 1 ETH (minus gas)
      const difference = finalBalance - initialBalance;
      expect(difference).to.be.closeTo(
        ethers.parseEther("1") - gasUsed,
        ethers.parseEther("0.01")
      );
    });
  });
});
