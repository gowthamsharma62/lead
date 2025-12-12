# Lead Management System

A comprehensive lead management system that centralizes leads from Instagram Meta Lead Ads, Google Lead Forms, and website forms into a single dashboard with filtering, search, and status tracking.

## Features

- **Multi-Source Integration**: Webhook endpoints for Instagram, Google Ads, and website forms
- **User Authentication**: Secure Google OAuth authentication via Mocha Users Service
- **Real-Time Dashboard**: React-based dashboard with live lead updates
- **Advanced Filtering**: Search, filter by source/status, date range filtering
- **Status Management**: Track leads through stages (new → contacted → qualified → closed)
- **Responsive Design**: Mobile-friendly interface with modern UI

## Architecture

- **Backend**: Cloudflare Workers with Hono API framework
- **Database**: Cloudflare D1 (SQLite)
- **Frontend**: React with TypeScript, Tailwind CSS, React Router
- **Authentication**: Mocha Users Service (Google OAuth)
- **Validation**: Zod schemas for type-safe API requests

## Setup Instructions

### 1. Environment Variables

Set the following secret in your Mocha app:

- `INSTAGRAM_VERIFY_TOKEN`: A random string you'll use to verify Instagram webhook (e.g., "my_secret_token_123")

The following are automatically provided by Mocha:
- `MOCHA_USERS_SERVICE_API_URL`
- `MOCHA_USERS_SERVICE_API_KEY`

### 2. Database

The database schema is already migrated with a `leads` table containing:
- Basic contact info (name, email, phone)
- Source tracking (instagram, google, website, other)
- Campaign information
- Status tracking (new, contacted, qualified, closed)
- Timestamps and metadata

### 3. Local Development

The app should already be running in your Mocha preview. No additional setup needed.

## Webhook Configuration

### Instagram/Meta Lead Ads

1. **Create a Facebook App**:
   - Go to https://developers.facebook.com/
   - Create a new app or use an existing one
   - Add the "Webhooks" product

2. **Configure Webhook**:
   - Webhook URL: `https://your-app-url.mocha.run/webhook/instagram`
   - Verify Token: Use the value you set for `INSTAGRAM_VERIFY_TOKEN`
   - Subscribe to `leadgen` events

3. **Subscribe to Page**:
   - In your app settings, subscribe to the Facebook Page that has lead ads
   - Select the `leadgen` field

4. **Test**:
   ```bash
   curl -X POST https://your-app-url.mocha.run/webhook/instagram \
     -H "Content-Type: application/json" \
     -d '{
       "entry": [{
         "id": "page_id",
         "time": 1234567890,
         "changes": [{
           "value": {
             "leadgen_id": "test_lead_123",
             "form_id": "form_123",
             "field_data": [
               {"name": "full_name", "values": ["John Doe"]},
               {"name": "email", "values": ["john@example.com"]},
               {"name": "phone_number", "values": ["+1234567890"]}
             ]
           }
         }]
       }]
     }'
   ```

### Google Lead Forms

For Google Ads lead forms, you can either:

**Option A: Direct Webhook** (if Google supports it)
```bash
curl -X POST https://your-app-url.mocha.run/webhook/google \
  -H "Content-Type: application/json" \
  -d '{
    "lead_id": "google_lead_123",
    "campaign_id": "campaign_456",
    "campaign_name": "Summer Sale 2024",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "phone": "+1234567890",
    "message": "Interested in product demo"
  }'
```

**Option B: Via Zapier/Make**
1. Create a Zap that triggers on new Google Lead Form submission
2. Add a Webhook action
3. Set webhook URL to: `https://your-app-url.mocha.run/webhook/google`
4. Map the fields as shown in the JSON above

### Website Forms

Add this to your website's form submission handler:

```javascript
// After form validation
fetch('https://your-app-url.mocha.run/webhook/form', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: formData.name,
    email: formData.email,
    phone: formData.phone,
    message: formData.message,
    pageUrl: window.location.href
  })
});
```

Or test with curl:
```bash
curl -X POST https://your-app-url.mocha.run/webhook/form \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bob Johnson",
    "email": "bob@example.com",
    "phone": "+1234567890",
    "message": "I would like more information",
    "pageUrl": "https://example.com/contact"
  }'
```

## API Endpoints

### Authentication
- `GET /api/oauth/google/redirect_url` - Get OAuth redirect URL
- `POST /api/sessions` - Exchange code for session token
- `GET /api/users/me` - Get current user (protected)
- `GET /api/logout` - Logout

### Leads
- `GET /api/leads` - List leads with filtering and pagination (protected)
  - Query params: `page`, `pageSize`, `q` (search), `source`, `status`, `dateFrom`, `dateTo`, `sortField`, `sortDir`
- `GET /api/leads/:id` - Get single lead (protected)
- `PATCH /api/leads/:id` - Update lead status or assignment (protected)
- `DELETE /api/leads/:id` - Delete lead (protected)
- `GET /api/leads/stats/summary` - Get lead statistics (protected)

### Webhooks
- `POST /webhook/instagram` - Instagram webhook receiver
- `GET /webhook/instagram` - Instagram webhook verification
- `POST /webhook/google` - Google Ads webhook receiver
- `POST /webhook/form` - Website form webhook receiver

## Using the Dashboard

1. **Login**: Click "Sign in with Google" on the home page
2. **View Leads**: All leads are displayed in the dashboard table
3. **Search**: Use the search bar to find leads by name, email, phone, or message
4. **Filter**: Filter by source, status, or date range
5. **Update Status**: Click the status dropdown to move leads through the pipeline
6. **Pagination**: Navigate through pages if you have more than 20 leads

## Lead Status Workflow

1. **New**: Lead just arrived via webhook
2. **Contacted**: You've reached out to the lead
3. **Qualified**: Lead shows promise and interest
4. **Closed**: Deal completed or lead converted

## Testing the System

### 1. Test Webhooks Locally

Before publishing, test webhooks using curl or a tool like Postman:

```bash
# Test Instagram webhook
curl -X POST https://your-preview-url/webhook/instagram \
  -H "Content-Type: application/json" \
  -d '{"entry":[{"id":"123","time":1234567890,"changes":[{"value":{"leadgen_id":"test_1","field_data":[{"name":"email","values":["test@example.com"]}]}}]}]}'

# Test Google webhook
curl -X POST https://your-preview-url/webhook/google \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com"}'

# Test website form
curl -X POST https://your-preview-url/webhook/form \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","pageUrl":"https://example.com"}'
```

### 2. Verify Lead Creation

After sending test webhooks:
1. Login to the dashboard
2. Check that leads appear in the table
3. Verify all fields are populated correctly
4. Test filtering and search functionality

### 3. Test Status Updates

1. Click on a lead's status dropdown
2. Change the status
3. Verify the status updates immediately
4. Check that the stats counters update

## Security Features

- **Authentication Required**: All lead management endpoints require authentication
- **HTTP-Only Cookies**: Session tokens stored securely
- **CORS Enabled**: Configured for secure cross-origin requests
- **Input Validation**: Zod schemas validate all incoming data
- **Webhook Verification**: Instagram webhook includes verify token

## Production Deployment

1. **Publish Your App**: Use Mocha's publish feature to deploy to production
2. **Update Webhook URLs**: Change all webhook URLs from preview to production URL
3. **Configure Secrets**: Ensure `INSTAGRAM_VERIFY_TOKEN` is set in production
4. **Test Webhooks**: Send test payloads to production webhooks
5. **Monitor**: Check the dashboard regularly for new leads

## Troubleshooting

### Webhooks Not Working
- Verify the webhook URL is correct and accessible
- Check that payloads match the expected schema
- Look for validation errors in the response
- Ensure Content-Type header is set to application/json

### Authentication Issues
- Clear browser cookies and try again
- Verify you're using a supported browser
- Check that the OAuth callback URL is correct
- See: https://docs.getmocha.com/guides/troubleshooting-login

### Leads Not Appearing
- Verify webhook was received (check for 200 response)
- Check database using SQL query tools
- Ensure you're logged in to view dashboard
- Refresh the dashboard page

## Database Schema

```sql
CREATE TABLE leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL,              -- instagram, google, website, other
  source_id TEXT,                    -- External ID from the source
  name TEXT,
  email TEXT,
  phone TEXT,
  message TEXT,
  page_url TEXT,                     -- For website forms
  campaign_id TEXT,
  campaign_name TEXT,
  status TEXT NOT NULL DEFAULT 'new', -- new, contacted, qualified, closed
  assigned_to TEXT,                  -- Future: assign to team members
  meta TEXT,                         -- Raw JSON payload
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Future Enhancements

- Real-time updates using WebSockets or Server-Sent Events
- Email notifications for new leads
- Team member assignment
- Custom fields per lead source
- Export leads to CSV
- Analytics and reporting dashboard
- Automated lead scoring
- Integration with CRM systems
- Bulk actions (archive, delete, update status)
- Lead notes and activity timeline

## Support

For issues with the Mocha platform, visit https://docs.getmocha.com/

For app-specific questions, check the inline code comments or review the API documentation above.
