import Stripe from 'https://esm.sh/stripe@15.4.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!stripeSecretKey) {
      console.error('Missing STRIPE_SECRET_KEY');
      return new Response(
        JSON.stringify({ error: 'Stripe not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const signature = req.headers.get('stripe-signature');
    const body = await req.text();

    let event: Stripe.Event;

    // Verify webhook signature if secret is configured
    if (webhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('Webhook signature verification failed:', message);
        return new Response(
          JSON.stringify({ error: `Webhook Error: ${message}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      // For testing without signature verification
      console.warn('Webhook signature verification skipped - no secret configured');
      event = JSON.parse(body) as Stripe.Event;
    }

    console.log('Received Stripe event:', event.type);

    // Helper function to find user by stripe_customer_id or email
    const findUserByCustomerIdOrEmail = async (customerId: string, customerEmail?: string | null) => {
      // First try by stripe_customer_id
      const { data: profileById } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('stripe_customer_id', customerId)
        .single();

      if (profileById) {
        return profileById;
      }

      // If not found and we have an email, try by email (Payment Link flow)
      if (customerEmail) {
        const { data: profileByEmail } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('email', customerEmail)
          .single();

        return profileByEmail;
      }

      return null;
    };

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string;
        const customerEmail = session.customer_email || session.customer_details?.email;
        
        console.log('Checkout completed. Customer:', customerId, 'Email:', customerEmail);

        const profile = await findUserByCustomerIdOrEmail(customerId, customerEmail);

        if (!profile) {
          console.error('No user found for customer:', customerId, 'email:', customerEmail);
          break;
        }

        // Update subscription plan AND save stripe_customer_id
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            subscription_plan: 'supporter',
            stripe_customer_id: customerId 
          })
          .eq('user_id', profile.user_id);

        if (updateError) {
          console.error('Failed to update subscription plan:', updateError);
        } else {
          console.log('User upgraded to supporter:', profile.user_id);
        }
        break;
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        
        console.log('Subscription created for customer:', customerId, 'Status:', subscription.status);

        // If active, ensure user is upgraded (backup for checkout.session.completed)
        if (subscription.status === 'active') {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ subscription_plan: 'supporter' })
            .eq('stripe_customer_id', customerId);

          if (updateError) {
            console.error('Failed to update subscription on creation:', updateError);
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const status = subscription.status;

        console.log('Subscription updated for customer:', customerId, 'Status:', status);

        // Update based on subscription status
        let plan = 'free';
        if (status === 'active' || status === 'trialing') {
          plan = 'supporter';
        }
        
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ subscription_plan: plan })
          .eq('stripe_customer_id', customerId);

        if (updateError) {
          console.error('Failed to update subscription status:', updateError);
        } else {
          console.log(`User subscription updated to ${plan}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        console.log('Subscription deleted for customer:', customerId);

        // Downgrade to free
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ subscription_plan: 'free' })
          .eq('stripe_customer_id', customerId);

        if (updateError) {
          console.error('Failed to downgrade subscription:', updateError);
        } else {
          console.log('User downgraded to free plan');
        }
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        
        console.log('Invoice paid for customer:', customerId, 'Amount:', invoice.amount_paid);
        // Successful payment - good for logging renewals
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        
        console.log('Payment failed for customer:', customerId);
        // Log failed payment - subscription.updated will handle status change if needed
        break;
      }

      default:
        console.log('Unhandled event type:', event.type);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Webhook error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
