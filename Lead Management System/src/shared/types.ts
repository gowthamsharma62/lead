import z from "zod";

// Lead status enum
export const LeadStatus = z.enum(["new", "contacted", "qualified", "closed"]);
export type LeadStatusType = z.infer<typeof LeadStatus>;

// Lead source enum
export const LeadSource = z.enum(["instagram", "google", "website", "other"]);
export type LeadSourceType = z.infer<typeof LeadSource>;

// Lead schema
export const LeadSchema = z.object({
  id: z.number(),
  source: LeadSource,
  source_id: z.string().nullable(),
  name: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  message: z.string().nullable(),
  page_url: z.string().nullable(),
  campaign_id: z.string().nullable(),
  campaign_name: z.string().nullable(),
  status: LeadStatus,
  assigned_to: z.string().nullable(),
  meta: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Lead = z.infer<typeof LeadSchema>;

// Instagram webhook payload
export const InstagramWebhookSchema = z.object({
  entry: z.array(
    z.object({
      id: z.string(),
      time: z.number(),
      changes: z.array(
        z.object({
          value: z.object({
            leadgen_id: z.string(),
            page_id: z.string().optional(),
            form_id: z.string().optional(),
            adgroup_id: z.string().optional(),
            ad_id: z.string().optional(),
            created_time: z.number().optional(),
            field_data: z.array(
              z.object({
                name: z.string(),
                values: z.array(z.string()),
              })
            ).optional(),
          }),
        })
      ),
    })
  ),
});

// Google webhook payload
export const GoogleWebhookSchema = z.object({
  lead_id: z.string().optional(),
  campaign_id: z.string().optional(),
  campaign_name: z.string().optional(),
  name: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  message: z.string().optional(),
});

// Website form webhook payload
export const WebsiteFormWebhookSchema = z.object({
  name: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  message: z.string().optional(),
  pageUrl: z.string().optional(),
});

// Update lead request
export const UpdateLeadSchema = z.object({
  status: LeadStatus.optional(),
  assigned_to: z.string().optional(),
});

// Query params for lead list
export const LeadQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  q: z.string().optional(),
  source: LeadSource.optional(),
  status: LeadStatus.optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sortField: z.enum(["created_at", "updated_at", "name", "email"]).default("created_at"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
});

export type LeadQuery = z.infer<typeof LeadQuerySchema>;
