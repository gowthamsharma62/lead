import { Hono } from "hono";
import { cors } from "hono/cors";
import {
  authMiddleware,
  getOAuthRedirectUrl,
  exchangeCodeForSessionToken,
  deleteSession,
  MOCHA_SESSION_TOKEN_COOKIE_NAME,
} from "@getmocha/users-service/backend";
import { getCookie, setCookie } from "hono/cookie";
import {
  InstagramWebhookSchema,
  GoogleWebhookSchema,
  WebsiteFormWebhookSchema,
  LeadQuerySchema,
  UpdateLeadSchema,
  type Lead,
} from "@/shared/types";

const app = new Hono<{ Bindings: Env }>();

// CORS configuration
app.use("/*", cors({
  origin: "*",
  credentials: true,
}));

// ============ Authentication Routes ============

app.get("/api/oauth/google/redirect_url", async (c) => {
  const redirectUrl = await getOAuthRedirectUrl("google", {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });

  return c.json({ redirectUrl }, 200);
});

app.post("/api/sessions", async (c) => {
  const body = await c.req.json();

  if (!body.code) {
    return c.json({ error: "No authorization code provided" }, 400);
  }

  const sessionToken = await exchangeCodeForSessionToken(body.code, {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });

  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true,
    maxAge: 60 * 24 * 60 * 60, // 60 days
  });

  return c.json({ success: true }, 200);
});

app.get("/api/users/me", authMiddleware, async (c) => {
  return c.json(c.get("user"));
});

app.get("/api/logout", async (c) => {
  const sessionToken = getCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME);

  if (typeof sessionToken === "string") {
    await deleteSession(sessionToken, {
      apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
      apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
    });
  }

  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, "", {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true,
    maxAge: 0,
  });

  return c.json({ success: true }, 200);
});

// ============ Webhook Routes ============

// Instagram/Meta webhook
app.post("/webhook/instagram", async (c) => {
  try {
    const body = await c.req.json();
    const validated = InstagramWebhookSchema.parse(body);

    for (const entry of validated.entry) {
      for (const change of entry.changes) {
        const { value } = change;
        
        // Extract fields from field_data
        const fieldData = value.field_data || [];
        const getField = (name: string) => {
          const field = fieldData.find(f => f.name.toLowerCase() === name.toLowerCase());
          return field?.values[0] || null;
        };

        const name = getField("full_name") || getField("name");
        const email = getField("email");
        const phone = getField("phone_number") || getField("phone");
        const message = getField("message") || getField("comments");

        await c.env.DB.prepare(
          `INSERT INTO leads (
            source, source_id, name, email, phone, message,
            campaign_id, campaign_name, status, meta, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
        )
          .bind(
            "instagram",
            value.leadgen_id,
            name,
            email,
            phone,
            message,
            value.ad_id || value.adgroup_id || null,
            null,
            "new",
            JSON.stringify(value)
          )
          .run();
      }
    }

    return c.json({ success: true }, 200);
  } catch (error) {
    console.error("Instagram webhook error:", error);
    return c.json({ error: "Invalid payload" }, 400);
  }
});

// Instagram webhook verification
app.get("/webhook/instagram", async (c) => {
  const mode = c.req.query("hub.mode");
  const token = c.req.query("hub.verify_token");
  const challenge = c.req.query("hub.challenge");

  if (mode === "subscribe" && token === c.env.INSTAGRAM_VERIFY_TOKEN) {
    return c.text(challenge || "");
  }

  return c.json({ error: "Verification failed" }, 403);
});

// Google webhook
app.post("/webhook/google", async (c) => {
  try {
    const body = await c.req.json();
    const validated = GoogleWebhookSchema.parse(body);

    await c.env.DB.prepare(
      `INSERT INTO leads (
        source, source_id, name, email, phone, message,
        campaign_id, campaign_name, status, meta, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    )
      .bind(
        "google",
        validated.lead_id || null,
        validated.name || null,
        validated.email || null,
        validated.phone || null,
        validated.message || null,
        validated.campaign_id || null,
        validated.campaign_name || null,
        "new",
        JSON.stringify(body)
      )
      .run();

    return c.json({ success: true }, 200);
  } catch (error) {
    console.error("Google webhook error:", error);
    return c.json({ error: "Invalid payload" }, 400);
  }
});

// Website form webhook
app.post("/webhook/form", async (c) => {
  try {
    const body = await c.req.json();
    const validated = WebsiteFormWebhookSchema.parse(body);

    await c.env.DB.prepare(
      `INSERT INTO leads (
        source, source_id, name, email, phone, message, page_url,
        status, meta, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    )
      .bind(
        "website",
        null,
        validated.name || null,
        validated.email || null,
        validated.phone || null,
        validated.message || null,
        validated.pageUrl || null,
        "new",
        JSON.stringify(body)
      )
      .run();

    return c.json({ success: true }, 200);
  } catch (error) {
    console.error("Website form webhook error:", error);
    return c.json({ error: "Invalid payload" }, 400);
  }
});

// ============ Lead Management API Routes ============

// Get leads with filtering, search, sort, pagination
app.get("/api/leads", authMiddleware, async (c) => {
  try {
    const query = LeadQuerySchema.parse({
      page: c.req.query("page"),
      pageSize: c.req.query("pageSize"),
      q: c.req.query("q"),
      source: c.req.query("source"),
      status: c.req.query("status"),
      dateFrom: c.req.query("dateFrom"),
      dateTo: c.req.query("dateTo"),
      sortField: c.req.query("sortField"),
      sortDir: c.req.query("sortDir"),
    });

    // Build WHERE clause
    const conditions: string[] = [];
    const bindings: any[] = [];

    if (query.q) {
      conditions.push("(name LIKE ? OR email LIKE ? OR phone LIKE ? OR message LIKE ?)");
      const searchTerm = `%${query.q}%`;
      bindings.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (query.source) {
      conditions.push("source = ?");
      bindings.push(query.source);
    }

    if (query.status) {
      conditions.push("status = ?");
      bindings.push(query.status);
    }

    if (query.dateFrom) {
      conditions.push("created_at >= ?");
      bindings.push(query.dateFrom);
    }

    if (query.dateTo) {
      conditions.push("created_at <= ?");
      bindings.push(query.dateTo);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Get total count
    const countResult = await c.env.DB.prepare(
      `SELECT COUNT(*) as total FROM leads ${whereClause}`
    )
      .bind(...bindings)
      .first<{ total: number }>();

    const total = countResult?.total || 0;

    // Get paginated results
    const offset = (query.page - 1) * query.pageSize;
    const orderBy = `ORDER BY ${query.sortField} ${query.sortDir.toUpperCase()}`;

    const { results } = await c.env.DB.prepare(
      `SELECT * FROM leads ${whereClause} ${orderBy} LIMIT ? OFFSET ?`
    )
      .bind(...bindings, query.pageSize, offset)
      .all<Lead>();

    return c.json({
      leads: results,
      total,
      page: query.page,
      pageSize: query.pageSize,
      totalPages: Math.ceil(total / query.pageSize),
    });
  } catch (error) {
    console.error("Get leads error:", error);
    return c.json({ error: "Failed to fetch leads" }, 500);
  }
});

// Get single lead
app.get("/api/leads/:id", authMiddleware, async (c) => {
  const id = c.req.param("id");

  const lead = await c.env.DB.prepare(
    "SELECT * FROM leads WHERE id = ?"
  )
    .bind(id)
    .first<Lead>();

  if (!lead) {
    return c.json({ error: "Lead not found" }, 404);
  }

  return c.json(lead);
});

// Update lead
app.patch("/api/leads/:id", authMiddleware, async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const validated = UpdateLeadSchema.parse(body);

    const updates: string[] = [];
    const bindings: any[] = [];

    if (validated.status) {
      updates.push("status = ?");
      bindings.push(validated.status);
    }

    if (validated.assigned_to !== undefined) {
      updates.push("assigned_to = ?");
      bindings.push(validated.assigned_to);
    }

    if (updates.length === 0) {
      return c.json({ error: "No updates provided" }, 400);
    }

    updates.push("updated_at = datetime('now')");
    bindings.push(id);

    await c.env.DB.prepare(
      `UPDATE leads SET ${updates.join(", ")} WHERE id = ?`
    )
      .bind(...bindings)
      .run();

    const lead = await c.env.DB.prepare(
      "SELECT * FROM leads WHERE id = ?"
    )
      .bind(id)
      .first<Lead>();

    return c.json(lead);
  } catch (error) {
    console.error("Update lead error:", error);
    return c.json({ error: "Failed to update lead" }, 500);
  }
});

// Delete lead
app.delete("/api/leads/:id", authMiddleware, async (c) => {
  const id = c.req.param("id");

  await c.env.DB.prepare(
    "DELETE FROM leads WHERE id = ?"
  )
    .bind(id)
    .run();

  return c.json({ success: true });
});

// Get lead stats
app.get("/api/leads/stats/summary", authMiddleware, async (c) => {
  const stats = await c.env.DB.prepare(
    `SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as new_count,
      SUM(CASE WHEN status = 'contacted' THEN 1 ELSE 0 END) as contacted_count,
      SUM(CASE WHEN status = 'qualified' THEN 1 ELSE 0 END) as qualified_count,
      SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed_count,
      SUM(CASE WHEN source = 'instagram' THEN 1 ELSE 0 END) as instagram_count,
      SUM(CASE WHEN source = 'google' THEN 1 ELSE 0 END) as google_count,
      SUM(CASE WHEN source = 'website' THEN 1 ELSE 0 END) as website_count
    FROM leads`
  ).first();

  return c.json(stats);
});

export default app;
