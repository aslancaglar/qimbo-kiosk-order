
import { validateWebhookSignature, processWebhookNotification, BizPrintConfig } from './bizPrint';

/**
 * Handler for BizPrint webhook requests
 * In a real application, this would be a server-side endpoint
 * For this demo, we'll create a client-side function that could be called from a proxy endpoint
 */
export const handleBizPrintWebhook = async (
  rawBody: string,
  signature: string,
  config: BizPrintConfig
): Promise<boolean> => {
  try {
    // Skip validation if webhook_secret is not set
    if (!config.webhook_secret) {
      console.warn('Webhook secret not set, skipping signature validation');
    } else {
      // Validate the signature
      const isValid = validateWebhookSignature(signature, rawBody, config.webhook_secret);
      
      if (!isValid) {
        console.error('Invalid webhook signature');
        return false;
      }
    }
    
    // Parse the webhook body
    const data = JSON.parse(rawBody);
    
    // Process the webhook notification
    processWebhookNotification(data);
    
    return true;
  } catch (error) {
    console.error('Error handling BizPrint webhook:', error);
    return false;
  }
};

/**
 * Example of how to set up a webhook handler for BizPrint
 * This would normally be in a server-side file
 * 
 * Express example:
 * 
 * app.post('/api/webhooks/bizprint', express.raw({type: 'application/json'}), (req, res) => {
 *   const signature = req.headers['x-bizprint-signature'] as string;
 *   const rawBody = req.body.toString();
 *   
 *   // Get the BizPrint config from your database or environment variables
 *   const bizPrintConfig = {
 *     webhook_secret: process.env.BIZPRINT_WEBHOOK_SECRET,
 *     // ... other config
 *   };
 *   
 *   handleBizPrintWebhook(rawBody, signature, bizPrintConfig)
 *     .then(isValid => {
 *       if (isValid) {
 *         res.status(200).send('Webhook received');
 *       } else {
 *         res.status(400).send('Invalid webhook');
 *       }
 *     })
 *     .catch(error => {
 *       console.error('Error handling webhook:', error);
 *       res.status(500).send('Server error');
 *     });
 * });
 */
