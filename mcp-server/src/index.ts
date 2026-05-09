import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { createClient } from "@supabase/supabase-js";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const server = new Server(
  {
    name: "lead-intelligence-meta",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Helper to get user's Facebook credentials from Supabase
 */
async function getFBConfig(userId?: string) {
  let query = supabase
    .from("fb_ads_config")
    .select("*")
    .eq("is_active", true);

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query.maybeSingle();
  if (error || !data) {
    throw new Error(`Facebook configuration not found for user: ${userId || 'default'}`);
  }
  return data;
}

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "fb_get_ad_accounts",
        description: "List Facebook Ad Accounts for a user",
        inputSchema: {
          type: "object",
          properties: {
            userId: { type: "string", description: "The Supabase User ID" },
          },
        },
      },
      {
        name: "fb_get_campaigns",
        description: "Get Facebook Ad Campaigns",
        inputSchema: {
          type: "object",
          properties: {
            userId: { type: "string", description: "The Supabase User ID" },
            adAccountId: { type: "string", description: "Optional Ad Account ID (overrides config)" },
          },
        },
      },
      {
        name: "fb_get_insights",
        description: "Get Facebook Ad Insights/Metrics",
        inputSchema: {
          type: "object",
          properties: {
            userId: { type: "string", description: "The Supabase User ID" },
            adAccountId: { type: "string", description: "Ad Account ID" },
            dateRange: { 
              type: "string", 
              description: "Date range (e.g., last_7d, last_30d, today, yesterday)",
              default: "last_7d"
            },
          },
          required: ["userId"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const userId = (args as any)?.userId;

  try {
    const config = await getFBConfig(userId);
    const token = config.access_token;
    const defaultAdAccount = config.ad_account_id;

    switch (name) {
      case "fb_get_ad_accounts": {
        const response = await axios.get(`https://graph.facebook.com/v21.0/me/adaccounts`, {
          params: {
            access_token: token,
            fields: "id,name,account_status,currency",
          },
        });
        return { content: [{ type: "text", text: JSON.stringify(response.data.data, null, 2) }] };
      }

      case "fb_get_campaigns": {
        const adAccountId = (args as any)?.adAccountId || defaultAdAccount;
        const cleanId = adAccountId.replace(/^act_/, "");
        const response = await axios.get(`https://graph.facebook.com/v21.0/act_${cleanId}/campaigns`, {
          params: {
            access_token: token,
            fields: "id,name,status,objective,start_time,stop_time,daily_budget,lifetime_budget",
          },
        });
        return { content: [{ type: "text", text: JSON.stringify(response.data.data, null, 2) }] };
      }

      case "fb_get_insights": {
        const adAccountId = (args as any)?.adAccountId || defaultAdAccount;
        const dateRange = (args as any)?.dateRange || "last_7d";
        const cleanId = adAccountId.replace(/^act_/, "");
        
        const response = await axios.get(`https://graph.facebook.com/v21.0/act_${cleanId}/insights`, {
          params: {
            access_token: token,
            date_preset: dateRange,
            fields: "campaign_name,spend,impressions,clicks,conversions,cpc,ctr,cpp,roas",
            level: "campaign",
          },
        });
        return { content: [{ type: "text", text: JSON.stringify(response.data.data, null, 2) }] };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    const message = error.response?.data?.error?.message || error.message;
    return {
      content: [{ type: "text", text: `Error: ${message}` }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Lead Intelligence Meta MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
