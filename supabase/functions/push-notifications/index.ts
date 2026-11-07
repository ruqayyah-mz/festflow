// Supabase Edge Function entry point. Logic lives in handler.ts so it can be tested locally:
//   deno test --allow-env supabase/functions/push-notifications/
import { handler } from "./handler.ts";

Deno.serve(handler);
