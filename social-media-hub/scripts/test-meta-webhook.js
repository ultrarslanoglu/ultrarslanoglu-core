/**
 * Meta Webhook Testing Script
 * Test webhook verification and event handling
 */

const axios = require('axios');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const WEBHOOK_URL = `${BASE_URL}/meta/webhook`;
const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN || 'ultrarslanoglu_webhook_token_2025';

console.log('🔧 Meta Webhook Testing Script');
console.log('===============================\n');
console.log(`Base URL: ${BASE_URL}`);
console.log(`Webhook URL: ${WEBHOOK_URL}`);
console.log(`Verify Token: ${VERIFY_TOKEN}\n`);

// ============================================
// TEST 1: Webhook Verification (GET)
// ============================================

async function testWebhookVerification() {
  console.log('📋 TEST 1: Webhook Verification (GET)');
  console.log('----------------------------------------');
  
  try {
    const challenge = 'test_challenge_12345';
    
    const response = await axios.get(WEBHOOK_URL, {
      params: {
        'hub.mode': 'subscribe',
        'hub.verify_token': VERIFY_TOKEN,
        'hub.challenge': challenge
      }
    });

    if (response.data === challenge) {
      console.log('✅ PASS: Webhook verification successful');
      console.log(`   Challenge received: ${response.data}\n`);
      return true;
    } else {
      console.log('❌ FAIL: Challenge mismatch');
      console.log(`   Expected: ${challenge}`);
      console.log(`   Received: ${response.data}\n`);
      return false;
    }
  } catch (error) {
    console.log('❌ FAIL: Webhook verification error');
    console.log(`   Error: ${error.message}\n`);
    return false;
  }
}

// ============================================
// TEST 2: Invalid Token Verification
// ============================================

async function testInvalidTokenVerification() {
  console.log('📋 TEST 2: Invalid Token Verification');
  console.log('----------------------------------------');
  
  try {
    const response = await axios.get(WEBHOOK_URL, {
      params: {
        'hub.mode': 'subscribe',
        'hub.verify_token': 'invalid_token_xyz',
        'hub.challenge': 'test_challenge'
      },
      validateStatus: () => true // Don't throw on any status
    });

    if (response.status === 403) {
      console.log('✅ PASS: Invalid token properly rejected (403)');
      console.log(`   Status: ${response.status}\n`);
      return true;
    } else {
      console.log('❌ FAIL: Invalid token not properly rejected');
      console.log(`   Status: ${response.status}\n`);
      return false;
    }
  } catch (error) {
    console.log('❌ FAIL: Request error');
    console.log(`   Error: ${error.message}\n`);
    return false;
  }
}

// ============================================
// TEST 3: Messaging Event (POST)
// ============================================

async function testMessagingEvent() {
  console.log('📋 TEST 3: Messaging Event (POST)');
  console.log('----------------------------------------');
  
  const payload = {
    object: 'page',
    entry: [
      {
        id: '123456789',
        time: Date.now(),
        messaging: [
          {
            sender: { id: 'user_123' },
            recipient: { id: 'page_123' },
            timestamp: Date.now(),
            message: {
              mid: 'msg_1',
              text: 'Hello! This is a test message from webhook.'
            }
          }
        ]
      }
    ]
  };

  try {
    const response = await axios.post(WEBHOOK_URL, payload);

    if (response.status === 200) {
      console.log('✅ PASS: Messaging event processed (200)');
      console.log(`   Response: ${JSON.stringify(response.data)}\n`);
      return true;
    } else {
      console.log('❌ FAIL: Unexpected status');
      console.log(`   Status: ${response.status}\n`);
      return false;
    }
  } catch (error) {
    console.log('❌ FAIL: Messaging event error');
    console.log(`   Error: ${error.message}\n`);
    return false;
  }
}

// ============================================
// TEST 4: Instagram Event (POST)
// ============================================

async function testInstagramEvent() {
  console.log('📋 TEST 4: Instagram Event (POST)');
  console.log('----------------------------------------');
  
  const payload = {
    object: 'instagram',
    entry: [
      {
        id: 'ig_123456789',
        time: Date.now(),
        changes: [
          {
            field: 'comments',
            value: {
              id: 'comment_123',
              text: 'Great post! Love it! 💙',
              from: { id: 'user_456' },
              media: { id: 'media_789' }
            }
          }
        ]
      }
    ]
  };

  try {
    const response = await axios.post(WEBHOOK_URL, payload);

    if (response.status === 200) {
      console.log('✅ PASS: Instagram event processed (200)');
      console.log(`   Response: ${JSON.stringify(response.data)}\n`);
      return true;
    } else {
      console.log('❌ FAIL: Unexpected status');
      console.log(`   Status: ${response.status}\n`);
      return false;
    }
  } catch (error) {
    console.log('❌ FAIL: Instagram event error');
    console.log(`   Error: ${error.message}\n`);
    return false;
  }
}

// ============================================
// TEST 5: Multiple Messaging Events
// ============================================

async function testMultipleMessagingEvents() {
  console.log('📋 TEST 5: Multiple Messaging Events');
  console.log('----------------------------------------');
  
  const payload = {
    object: 'page',
    entry: [
      {
        id: 'page_123',
        time: Date.now(),
        messaging: [
          {
            sender: { id: 'user_1' },
            recipient: { id: 'page_123' },
            timestamp: Date.now(),
            message: {
              mid: 'msg_1',
              text: 'First message'
            }
          },
          {
            sender: { id: 'user_1' },
            recipient: { id: 'page_123' },
            timestamp: Date.now() + 1000,
            delivery: {
              mids: ['msg_1']
            }
          },
          {
            sender: { id: 'user_1' },
            recipient: { id: 'page_123' },
            timestamp: Date.now() + 2000,
            read: {
              watermark: Date.now() + 2000
            }
          }
        ]
      }
    ]
  };

  try {
    const response = await axios.post(WEBHOOK_URL, payload);

    if (response.status === 200) {
      console.log('✅ PASS: Multiple events processed (200)');
      console.log(`   Response: ${JSON.stringify(response.data)}\n`);
      return true;
    } else {
      console.log('❌ FAIL: Unexpected status');
      console.log(`   Status: ${response.status}\n`);
      return false;
    }
  } catch (error) {
    console.log('❌ FAIL: Multiple events error');
    console.log(`   Error: ${error.message}\n`);
    return false;
  }
}

// ============================================
// TEST 6: Webhook Status
// ============================================

async function testWebhookStatus() {
  console.log('📋 TEST 6: Webhook Status');
  console.log('----------------------------------------');
  
  try {
    const response = await axios.get(`${BASE_URL}/meta/webhook/status`);

    if (response.status === 200 && response.data.success) {
      console.log('✅ PASS: Webhook status retrieved');
      console.log(`   Status: ${response.data.webhook.status}`);
      console.log(`   Endpoint: ${response.data.webhook.endpoint}`);
      console.log(`   Supported Events: ${response.data.webhook.supportedEvents.join(', ')}\n`);
      return true;
    } else {
      console.log('❌ FAIL: Invalid status response');
      console.log(`   Response: ${JSON.stringify(response.data)}\n`);
      return false;
    }
  } catch (error) {
    console.log('❌ FAIL: Status endpoint error');
    console.log(`   Error: ${error.message}\n`);
    return false;
  }
}

// ============================================
// Run All Tests
// ============================================

async function runAllTests() {
  console.log('\n');
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  const tests = [
    { name: 'Webhook Verification', fn: testWebhookVerification },
    { name: 'Invalid Token Verification', fn: testInvalidTokenVerification },
    { name: 'Messaging Event', fn: testMessagingEvent },
    { name: 'Instagram Event', fn: testInstagramEvent },
    { name: 'Multiple Messaging Events', fn: testMultipleMessagingEvents },
    { name: 'Webhook Status', fn: testWebhookStatus }
  ];

  for (const test of tests) {
    const passed = await test.fn();
    if (passed) {
      results.passed++;
    } else {
      results.failed++;
    }
    results.tests.push({ name: test.name, passed });
  }

  // Summary
  console.log('\n📊 TEST SUMMARY');
  console.log('===============');
  console.log(`Total Tests: ${results.tests.length}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`Pass Rate: ${((results.passed / results.tests.length) * 100).toFixed(1)}%\n`);

  if (results.failed === 0) {
    console.log('🎉 All tests passed! Webhook is working correctly.\n');
  } else {
    console.log('⚠️  Some tests failed. Check the results above.\n');
  }

  return results.failed === 0;
}

// Start testing
runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
