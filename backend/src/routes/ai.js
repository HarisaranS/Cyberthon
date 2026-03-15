const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { detectPII, classifyRisk, submitFeedback, AI_URL } = require('../services/aiService');
const { sendSuccess, sendError } = require('../utils/responseUtils');
const axios = require('axios');

router.use(auth);

// Proxy PII detection
router.post('/detect', async (req, res) => {
  const result = await detectPII(req.body.text, req.body.source_type);
  sendSuccess(res, result);
});

// Proxy risk classification
router.post('/classify', async (req, res) => {
  const result = await classifyRisk(req.body.detections, req.body.context);
  sendSuccess(res, result);
});

// ML Feedback/retraining
router.post('/feedback', async (req, res) => {
  const result = await submitFeedback(req.body.feedback, req.user.orgId);
  sendSuccess(res, result);
});

// SSE Stream for DPO Co-Pilot
router.get('/copilot/stream', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ message: 'Query required' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const { getSystemStateContext } = require('../services/aiService');
    const systemState = await getSystemStateContext(req.user.orgId);
    
    const response = await axios({
      method: 'get',
      url: `${AI_URL}/copilot/stream`,
      params: { q, context: systemState },
      responseType: 'stream'
    });

    response.data.pipe(res);
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

module.exports = router;
