const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const cors      = require('cors')({ origin: true });
const Anthropic = require('@anthropic-ai/sdk');

const ANTHROPIC_API_KEY = defineSecret('ANTHROPIC_API_KEY');

const PROMPT = `You are parsing a petroleum movement document (delivery ticket, invoice, or statement).
Extract the following fields and return ONLY a JSON object with these exact keys:
- ExternalDocumentNumber: document or ticket number (string)
- MovementDate: date and time of the movement in format YYYY-MM-DDTHH:mm (string, use T00:00 if no time given)
- MovementDocumentDate: document date in format YYYY-MM-DD (string, same as MovementDate date if not separately specified)
- Location: facility, tank, or location name (string)
- MovedProduct: product name e.g. Crude Oil, Gasoline, Diesel, Natural Gas (string)
- NetVolume: numeric volume as a number (no commas or units)
- DeliveryBA: supplier, carrier, or counterparty name (string)
If a field cannot be found, use null.
Return ONLY the JSON object, no explanation.`;

exports.parseMovement = onRequest({ secrets: [ANTHROPIC_API_KEY] }, (req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') {
      res.status(405).send('Method not allowed');
      return;
    }
    const { pdfBase64 } = req.body;
    if (!pdfBase64) {
      res.status(400).json({ error: 'Missing pdfBase64' });
      return;
    }
    const apiKey = ANTHROPIC_API_KEY.value();
    if (!apiKey) {
      res.status(500).json({ error: 'Server misconfiguration: API key not set' });
      return;
    }
    try {
      const client = new Anthropic({ apiKey });
      const result = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 512,
        messages: [{
          role: 'user',
          content: [
            { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: pdfBase64 } },
            { type: 'text', text: PROMPT },
          ],
        }],
      });
      const text  = result.content?.[0]?.text || '';
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('No JSON found in Claude response');
      res.json(JSON.parse(match[0]));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
});
