/**
 * Ticket Service
 * High-level ticket operations
 */

const logger = require('../../../shared/logger');

class TicketService {
  constructor(web3Service) {
    this.web3 = web3Service;
  }

  /**
   * Create event
   */
  async createEvent(eventData) {
    try {
      const {
        name,
        description,
        location,
        date,
        capacity,
        price,
        baseUri
      } = eventData;

      logger.info('Creating event:', { name, location, capacity });

      const priceInWei = this.web3.parseEther(price.toString());

      const tx = await this.web3.sendTransaction('createEvent', [
        name,
        description,
        location,
        Math.floor(date / 1000), // Convert to unix timestamp
        capacity,
        priceInWei,
        baseUri
      ]);

      logger.info('Event created successfully', { txHash: tx.hash });

      return {
        success: true,
        txHash: tx.hash,
        blockNumber: tx.receipt.blockNumber,
        message: 'Event created successfully'
      };
    } catch (error) {
      logger.error('Create event failed:', error);
      throw error;
    }
  }

  /**
   * Mint single ticket
   */
  async mintTicket(eventId, tier, seatNumber, priceEth) {
    try {
      logger.info('Minting ticket:', { eventId, tier, seatNumber });

      const priceInWei = this.web3.parseEther(priceEth.toString());

      const tx = await this.web3.sendTransaction('mintTicket', [
        eventId,
        tier,
        seatNumber
      ], {
        value: priceInWei
      });

      logger.info('Ticket minted successfully', { txHash: tx.hash });

      return {
        success: true,
        txHash: tx.hash,
        blockNumber: tx.receipt.blockNumber,
        message: 'Ticket minted successfully'
      };
    } catch (error) {
      logger.error('Mint ticket failed:', error);
      throw error;
    }
  }

  /**
   * Batch mint tickets
   */
  async batchMintTickets(eventId, tier, seatNumbers, priceEth) {
    try {
      logger.info('Batch minting tickets:', { 
        eventId, 
        tier, 
        count: seatNumbers.length 
      });

      const totalPrice = this.web3.parseEther((priceEth * seatNumbers.length).toString());

      const tx = await this.web3.sendTransaction('batchMintTickets', [
        eventId,
        tier,
        seatNumbers
      ], {
        value: totalPrice
      });

      logger.info('Tickets batch minted successfully', { txHash: tx.hash });

      return {
        success: true,
        txHash: tx.hash,
        blockNumber: tx.receipt.blockNumber,
        ticketsCount: seatNumbers.length,
        message: `${seatNumbers.length} tickets minted successfully`
      };
    } catch (error) {
      logger.error('Batch mint tickets failed:', error);
      throw error;
    }
  }

  /**
   * Transfer ticket
   */
  async transferTicket(tokenId, toAddress) {
    try {
      logger.info('Transferring ticket:', { tokenId, to: toAddress });

      const tx = await this.web3.sendTransaction('transferTicket', [
        toAddress,
        tokenId
      ]);

      logger.info('Ticket transferred successfully', { txHash: tx.hash });

      return {
        success: true,
        txHash: tx.hash,
        blockNumber: tx.receipt.blockNumber,
        message: 'Ticket transferred successfully'
      };
    } catch (error) {
      logger.error('Transfer ticket failed:', error);
      throw error;
    }
  }

  /**
   * Validate ticket at venue
   */
  async validateTicket(tokenId) {
    try {
      logger.info('Validating ticket:', { tokenId });

      const tx = await this.web3.sendTransaction('validateTicket', [tokenId]);

      logger.info('Ticket validated successfully', { txHash: tx.hash });

      return {
        success: true,
        txHash: tx.hash,
        blockNumber: tx.receipt.blockNumber,
        message: 'Ticket validated successfully'
      };
    } catch (error) {
      logger.error('Validate ticket failed:', error);
      throw error;
    }
  }

  /**
   * Burn ticket
   */
  async burnTicket(tokenId) {
    try {
      logger.info('Burning ticket:', { tokenId });

      const tx = await this.web3.sendTransaction('burnTicket', [tokenId]);

      logger.info('Ticket burned successfully', { txHash: tx.hash });

      return {
        success: true,
        txHash: tx.hash,
        blockNumber: tx.receipt.blockNumber,
        message: 'Ticket burned successfully'
      };
    } catch (error) {
      logger.error('Burn ticket failed:', error);
      throw error;
    }
  }

  /**
   * Get event details
   */
  async getEvent(eventId) {
    try {
      const event = await this.web3.call('getEvent', eventId);

      return {
        eventId: eventId,
        name: event.name,
        description: event.description,
        location: event.location,
        date: new Date(Number(event.date) * 1000),
        capacity: Number(event.capacity),
        ticketsSold: Number(event.ticketsSold),
        price: this.web3.formatEther(event.price),
        eventOwner: event.eventOwner,
        active: event.active
      };
    } catch (error) {
      logger.error('Get event failed:', error);
      throw error;
    }
  }

  /**
   * Get ticket details
   */
  async getTicket(tokenId) {
    try {
      const ticket = await this.web3.call('getTicket', tokenId);

      return {
        tokenId: Number(ticket.tokenId),
        eventId: Number(ticket.eventId),
        tier: ticket.tier,
        seatNumber: Number(ticket.seatNumber),
        mintedAt: new Date(Number(ticket.mintedAt) * 1000),
        originalMinter: ticket.originalMinter,
        transferCount: Number(ticket.transferCount),
        used: ticket.used
      };
    } catch (error) {
      logger.error('Get ticket failed:', error);
      throw error;
    }
  }

  /**
   * Get user tickets
   */
  async getUserTickets(address) {
    try {
      const tokenIds = await this.web3.call('getUserTickets', address);

      const tickets = [];
      for (const tokenId of tokenIds) {
        const ticket = await this.getTicket(Number(tokenId));
        tickets.push(ticket);
      }

      return tickets;
    } catch (error) {
      logger.error('Get user tickets failed:', error);
      throw error;
    }
  }

  /**
   * Get event tickets
   */
  async getEventTickets(eventId) {
    try {
      const tokenIds = await this.web3.call('getEventTickets', eventId);

      const tickets = [];
      for (const tokenId of tokenIds) {
        const ticket = await this.getTicket(Number(tokenId));
        tickets.push(ticket);
      }

      return tickets;
    } catch (error) {
      logger.error('Get event tickets failed:', error);
      throw error;
    }
  }

  /**
   * Get available seats
   */
  async getAvailableSeats(eventId) {
    try {
      const available = await this.web3.call('getAvailableSeats', eventId);
      return Number(available);
    } catch (error) {
      logger.error('Get available seats failed:', error);
      throw error;
    }
  }

  /**
   * Check if ticket is valid
   */
  async isTicketValid(tokenId) {
    try {
      return await this.web3.call('isTicketValid', tokenId);
    } catch (error) {
      logger.error('Check ticket validity failed:', error);
      throw error;
    }
  }

  /**
   * Get event count
   */
  async getEventCount() {
    try {
      const count = await this.web3.call('getEventCount');
      return Number(count);
    } catch (error) {
      logger.error('Get event count failed:', error);
      throw error;
    }
  }

  /**
   * Add whitelisted address
   */
  async addWhitelisted(address) {
    try {
      logger.info('Adding whitelisted address:', { address });

      const tx = await this.web3.sendTransaction('addWhitelisted', [address]);

      return {
        success: true,
        txHash: tx.hash,
        message: 'Address whitelisted successfully'
      };
    } catch (error) {
      logger.error('Add whitelisted failed:', error);
      throw error;
    }
  }

  /**
   * Estimate ticket mint cost
   */
  async estimateMintCost(eventId) {
    try {
      const event = await this.getEvent(eventId);
      return {
        price: event.price,
        priceUsd: null // Would need price feed integration
      };
    } catch (error) {
      logger.error('Estimate mint cost failed:', error);
      throw error;
    }
  }
}

module.exports = TicketService;
