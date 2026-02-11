import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const tools = [
  {
    type: "function",
    function: {
      name: "get_tasks",
      description: "Get all tasks from the user's Kanban board. Returns the full list of tasks with their details.",
      parameters: { type: "object", properties: {}, required: [], additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "add_task",
      description: "Add a new task to the Kanban board.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Task title" },
          description: { type: "string", description: "Task description" },
          priority: { type: "string", enum: ["low", "medium", "high"], description: "Task priority" },
          status: { type: "string", enum: ["todo", "in_progress"], description: "Task status column" },
          due_date: { type: "string", description: "Due date in YYYY-MM-DD format (optional)" },
          assignee: { type: "string", description: "Person assigned (optional)" },
        },
        required: ["title", "priority", "status"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_task",
      description: "Update an existing task. Use get_tasks first to find the task ID.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string", description: "The task UUID to update" },
          title: { type: "string" },
          description: { type: "string" },
          priority: { type: "string", enum: ["low", "medium", "high"] },
          status: { type: "string", enum: ["todo", "in_progress"] },
          due_date: { type: "string", description: "Due date YYYY-MM-DD or null to clear" },
          assignee: { type: "string" },
        },
        required: ["id"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_task",
      description: "Delete a task from the board by its ID. Use get_tasks first to find the task ID.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string", description: "The task UUID to delete" },
        },
        required: ["id"],
        additionalProperties: false,
      },
    },
  },
];

async function executeTool(
  fnName: string,
  args: Record<string, unknown>,
  supabase: ReturnType<typeof createClient>,
  userId: string
) {
  switch (fnName) {
    case "get_tasks": {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", userId)
        .order("position", { ascending: true });
      if (error) return JSON.stringify({ error: error.message });
      return JSON.stringify(data);
    }
    case "add_task": {
      const maxPos = await supabase
        .from("tasks")
        .select("position")
        .eq("user_id", userId)
        .eq("status", args.status as string)
        .order("position", { ascending: false })
        .limit(1);
      const position = (maxPos.data?.[0]?.position ?? -1) + 1;
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          user_id: userId,
          title: args.title,
          description: args.description ?? "",
          priority: args.priority ?? "medium",
          status: args.status ?? "todo",
          due_date: args.due_date ?? null,
          assignee: args.assignee ?? "",
          position,
        })
        .select()
        .single();
      if (error) return JSON.stringify({ error: error.message });
      return JSON.stringify({ success: true, task: data });
    }
    case "update_task": {
      const { id, ...updates } = args as { id: string; [k: string]: unknown };
      const { data, error } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", id)
        .eq("user_id", userId)
        .select()
        .single();
      if (error) return JSON.stringify({ error: error.message });
      return JSON.stringify({ success: true, task: data });
    }
    case "delete_task": {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", args.id as string)
        .eq("user_id", userId);
      if (error) return JSON.stringify({ error: error.message });
      return JSON.stringify({ success: true });
    }
    default:
      return JSON.stringify({ error: "Unknown tool" });
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Extract user from auth header
    const authHeader = req.headers.get("authorization") ?? "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify user token
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Not authenticated. Please log in." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Service role client for DB operations
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const systemPrompt = `You are TaskFlow AI, a helpful assistant integrated into a Kanban task management app.
You have FULL access to the user's Kanban board through tools. You can:
- View all their tasks (get_tasks)
- Add new tasks (add_task)
- Update existing tasks (update_task) 
- Delete tasks (delete_task)

ALWAYS use the get_tasks tool first when the user asks about their tasks or board.
When making changes, confirm what you did. Keep answers concise and practical.
Help with task planning, prioritization, and project management.`;

    // Non-streaming: tool calling loop
    let aiMessages = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    const MAX_TOOL_ROUNDS = 5;
    let finalText = "";

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: aiMessages,
          tools,
          tool_choice: "auto",
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const t = await response.text();
        console.error("AI gateway error:", response.status, t);
        return new Response(JSON.stringify({ error: "AI gateway error" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const result = await response.json();
      const choice = result.choices?.[0];
      if (!choice) break;

      const msg = choice.message;
      aiMessages.push(msg);

      // If tool calls, execute them and continue the loop
      if (msg.tool_calls && msg.tool_calls.length > 0) {
        for (const tc of msg.tool_calls) {
          const args = typeof tc.function.arguments === "string"
            ? JSON.parse(tc.function.arguments)
            : tc.function.arguments;
          const toolResult = await executeTool(tc.function.name, args, adminClient, user.id);
          aiMessages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: toolResult,
          });
        }
        continue; // let the model see the tool results
      }

      // No tool calls — we have the final answer
      finalText = msg.content || "";
      break;
    }

    return new Response(JSON.stringify({ content: finalText }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
