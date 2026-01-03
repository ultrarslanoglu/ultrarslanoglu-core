/**
 * Ticket Routes
 * REST API endpoints for ticket operations
 */

const express = require('express');
const router = express.Router();
const logger = require('../../../shared/logger');

/**
 * Initialize ticket routes
 */
function initializeTicketRoutes(ticketService) {
  // ============================================
  // EVENT ENDPOINTS
  // ============================================

  /**
   * POST /tickets/events
   * Create a new event
   */
  router.post('/events', async (req, res) => {
    try {
      const {
        name,
        description,
        location,
        date,
        capacity,
        price,
        baseUri
      } = req.body;

      // Validation
      if (!name || !location || !date || !capacity || !price) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: name, location, date, capacity, price'
        });
      }

      if (capacity < 1) {
        return res.status(400).json({
          success: false,
          error: 'Capacity must be at least 1'
        });
      }

      if (price < 0.001) {
        return res.status(400).json({
          success: false,
          error: 'Price must be at least 0.001 ETH'
        });
      }

      const result = await ticketService.createEvent({
        name,
        description: description || '',
        location,
        date: new Date(date).getTime(),
        capacity: parseInt(capacity),
        price: parseFloat(price),
        baseUri: baseUri || 'ipfs://QmExample'
      });

      res.json({
        success: true,
        data: result,
        message: 'Event created successfully'
      });
    } catch (error) {
      logger.error('Create event error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /tickets/events/:eventId
   * Get event details
   */
  router.get('/events/:eventId', async (req, res) => {
    try {
      const { eventId } = req.params;

      const event = await ticketService.getEvent(parseInt(eventId));

      res.json({
        success: true,
        data: event
      });
    } catch (error) {
      logger.error('Get event error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /tickets/events
   * Get event count
   */
  router.get('/events', async (req, res) => {
    try {
      const count = await ticketService.getEventCount();

      res.json({
        success: true,
        data: {
          eventCount: count
        }
      });
    } catch (error) {
      logger.error('Get event count error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // ============================================
  // TICKET ENDPOINTS
  // ============================================

  /**
   * POST /tickets/mint
   * Mint a single ticket
   */
  router.post('/mint', async (req, res) => {
    try {
      const { eventId, tier, seatNumber } = req.body;

      if (!eventId || !tier || !seatNumber) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: eventId, tier, seatNumber'
        });
      }

      // Get event to get price
      const event = await ticketService.getEvent(parseInt(eventId));

      const result = await ticketService.mintTicket(
        parseInt(eventId),
        tier,
        parseInt(seatNumber),
        parseFloat(event.price)
      );

      res.json({
        success: true,
        data: result,
        message: 'Ticket minted successfully'
      });
    } catch (error) {
      logger.error('Mint ticket error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * POST /tickets/batch-mint
   * Batch mint multiple tickets
   */
  router.post('/batch-mint', async (req, res) => {
    try {
      const { eventId, tier, seatNumbers } = req.body;

      if (!eventId || !tier || !Array.isArray(seatNumbers) || seatNumbers.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: eventId, tier, seatNumbers (array)'
        });
      }

      if (seatNumbers.length > 100) {
        return res.status(400).json({
          success: false,
          error: 'Cannot batch mint more than 100 tickets'
        });
      }

      // Get event to get price
      const event = await ticketService.getEvent(parseInt(eventId));

      const result = await ticketService.batchMintTickets(
        parseInt(eventId),
        tier,
        seatNumbers.map(s => parseInt(s)),
        parseFloat(event.price)
      );

      res.json({
        success: true,
        data: result,
        message: `${seatNumbers.length} tickets minted successfully`
      });
    } catch (error) {
      logger.error('Batch mint tickets error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /tickets/:tokenId
   * Get ticket details
   */
  router.get('/:tokenId', async (req, res) => {
    try {
      const { tokenId } = req.params;

      const ticket = await ticketService.getTicket(parseInt(tokenId));

      res.json({
        success: true,
        data: ticket
      });
    } catch (error) {
      logger.error('Get ticket error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /tickets/user/:address
   * Get all tickets for a user
   */
  router.get('/user/:address', async (req, res) => {
    try {
      const { address } = req.params;

      // Validate address format
      if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid Ethereum address format'
        });
      }

      const tickets = await ticketService.getUserTickets(address);

      res.json({
        success: true,
        data: {
          address,
          ticketCount: tickets.length,
          tickets
        }
      });
    } catch (error) {
      logger.error('Get user tickets error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /tickets/event/:eventId/tickets
   * Get all tickets for an event
   */
  router.get('/event/:eventId/tickets', async (req, res) => {
    try {
      const { eventId } = req.params;

      const tickets = await ticketService.getEventTickets(parseInt(eventId));

      res.json({
        success: true,
        data: {
          eventId: parseInt(eventId),
          ticketCount: tickets.length,
          tickets
        }
      });
    } catch (error) {
      logger.error('Get event tickets error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * POST /tickets/:tokenId/transfer
   * Transfer ticket to another address
   */
  router.post('/:tokenId/transfer', async (req, res) => {
    try {
      const { tokenId } = req.params;
      const { toAddress } = req.body;

      if (!toAddress) {
        return res.status(400).json({
          success: false,
          error: 'Missing required field: toAddress'
        });
      }

      if (!toAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid recipient address format'
        });
      }

      const result = await ticketService.transferTicket(
        parseInt(tokenId),
        toAddress
      );

      res.json({
        success: true,
        data: result,
        message: 'Ticket transferred successfully'
      });
    } catch (error) {
      logger.error('Transfer ticket error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * POST /tickets/:tokenId/validate
   * Validate ticket at venue
   */
  router.post('/:tokenId/validate', async (req, res) => {
    try {
      const { tokenId } = req.params;

      const result = await ticketService.validateTicket(parseInt(tokenId));

      res.json({
        success: true,
        data: result,
        message: 'Ticket validated successfully'
      });
    } catch (error) {
      logger.error('Validate ticket error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * POST /tickets/:tokenId/burn
   * Burn ticket
   */
  router.post('/:tokenId/burn', async (req, res) => {
    try {
      const { tokenId } = req.params;

      const result = await ticketService.burnTicket(parseInt(tokenId));

      res.json({
        success: true,
        data: result,
        message: 'Ticket burned successfully'
      });
    } catch (error) {
      logger.error('Burn ticket error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /tickets/:tokenId/valid
   * Check if ticket is valid
   */
  router.get('/:tokenId/valid', async (req, res) => {
    try {
      const { tokenId } = req.params;

      const isValid = await ticketService.isTicketValid(parseInt(tokenId));

      res.json({
        success: true,
        data: {
          tokenId: parseInt(tokenId),
          isValid
        }
      });
    } catch (error) {
      logger.error('Check ticket validity error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /tickets/event/:eventId/available
   * Get available seats for event
   */
  router.get('/event/:eventId/available', async (req, res) => {
    try {
      const { eventId } = req.params;

      const available = await ticketService.getAvailableSeats(parseInt(eventId));

      res.json({
        success: true,
        data: {
          eventId: parseInt(eventId),
          availableSeats: available
        }
      });
    } catch (error) {
      logger.error('Get available seats error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  return router;
}

module.exports = initializeTicketRoutes;
