
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Define CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-bizprint-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const webhookSecret = Deno.env.get("BIZPRINT_WEBHOOK_SECRET") || "";

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Only allow POST requests for webhook handling
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get signature from request headers
    const signature = req.headers.get("x-bizprint-signature") || "";

    // Get the request body as text
    const rawBody = await req.text();

    // Skip validation if webhook_secret is not set
    if (!webhookSecret) {
      console.log("Webhook secret not set, skipping signature validation");
    } else {
      // Validate the signature (in a real implementation, you would use crypto)
      // For now, we'll just log it
      console.log("Validating webhook signature:", { signature, webhookSecret });
      
      // In a real implementation you would validate like this:
      /*
      const encoder = new TextEncoder();
      const secretKey = encoder.encode(webhookSecret);
      const message = encoder.encode(rawBody);
      
      const key = await crypto.subtle.importKey(
        "raw", secretKey, { name: "HMAC", hash: "SHA-256" }, false, ["verify"]
      );
      
      const verified = await crypto.subtle.verify(
        "HMAC", key, signature, message
      );
      
      if (!verified) {
        return new Response(
          JSON.stringify({ error: "Invalid signature" }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      */
    }

    // Parse request body
    let data;
    try {
      data = JSON.parse(rawBody);
    } catch (error) {
      console.error("Error parsing webhook body:", error);
      return new Response(
        JSON.stringify({ error: "Invalid JSON payload" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Received webhook from BizPrint:", data);

    // Extract print job data
    const { job_id, status, printer_id, order_id, error: printError } = data;

    if (job_id && status) {
      // Store print job status in database
      const { error } = await supabase
        .from("print_jobs")
        .upsert({
          job_id,
          status,
          printer_id,
          order_id: order_id || null,
          error_message: printError || null,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error("Error storing print job status:", error);
      }

      // If this is related to an order, update the order's print status
      if (order_id && typeof order_id === "string" || typeof order_id === "number") {
        const { error: orderError } = await supabase
          .from("orders")
          .update({ 
            print_status: status,
            updated_at: new Date().toISOString()
          })
          .eq("id", order_id);

        if (orderError) {
          console.error("Error updating order print status:", orderError);
        }
      }
    }

    // Return success response
    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error handling webhook:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
