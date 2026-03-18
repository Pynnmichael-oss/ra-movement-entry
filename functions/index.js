const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const cors      = require('cors')({ origin: true });
const Anthropic = require('@anthropic-ai/sdk');

const ANTHROPIC_API_KEY = defineSecret('ANTHROPIC_API_KEY');

const PROMPT = `You are extracting structured data from a petroleum movement document.

The most common document type is a TMS7 terminal ticket, but you may also receive delivery tickets, terminal receipts, invoices, bills of lading, pipeline statements, inventory reports, or other petroleum industry documents. Field names and layouts vary by document type — use context clues to map values to the correct output fields.

Extract the following fields and return ONLY a JSON object with these exact keys:

- ExternalDocumentNumber: the primary document identifier — may appear as ticket number, document number, BOL number, invoice number, reference number, confirmation number, or similar
- MovementDate: the date and time the physical movement or delivery occurred — may appear as load date, delivery date, ship date, movement date, or transaction date. Format: YYYY-MM-DDTHH:mm (use T00:00 if no time is given)
- MovementDocumentDate: the date printed on the document itself — may differ from MovementDate. If not separately specified, use the same date as MovementDate. Format: YYYY-MM-DD
- Location: the facility, terminal, tank farm, pipeline station, or site name — may appear as terminal, origin, destination, facility, plant, or location
- MovedProduct: the petroleum product name — may appear as product, material, commodity, or grade (e.g. Crude Oil, Gasoline, CBOB, Diesel, Jet Fuel, Fuel Oil, NGL, Propane)
- NetVolume: the net volume as a plain number only, no commas or units (e.g. 125000) — may appear as net volume, net quantity, net bbls, or similar; prefer net over gross if both present
- DeliveryBA: the counterparty business associate — may appear as supplier, carrier, shipper, consignee, buyer, seller, transporter, or company name

If a field truly cannot be determined from the document, return null for that field.

Return ONLY the JSON object, no explanation, no markdown.`;

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
