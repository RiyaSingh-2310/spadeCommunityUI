# API contracts added / required for Admin UI features

## 1. Redemption approve / reject (existing — updated response)

`PATCH /api/reward-history/redeem/:id/status`

**Request body**
```json
{
  "status": "approved" | "rejected",
  "action_by": "Admin Name",
  "remark": "Amazon Gift Card",
  "comment": "Amazon Gift Card Voucher: XXXX-XXXX"
}
```

- `remark` = redemption method / product (preserved)
- `comment` = admin remark shown in UI details

**Response (updated)**
```json
{
  "success": true,
  "message": "Redeem request approved successfully!",
  "data": { /* full redeem request row including remark, comment, status, updated_at */ }
}
```

---

## 2. API Key Management (new)

Base path: `/api/api-integrations`

### List (masked)
`GET /api/api-integrations`  
Auth: admin Bearer token  
Allowed: `permission_type` in `admin` | `superadmin` | `super_admin`

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "api_name": "Scamalytics",
      "api_user_id": "••••••••abcd",
      "api_key": "••••••••••••wxyz",
      "has_api_user_id": true,
      "has_api_key": true,
      "created_at": "...",
      "updated_at": "..."
    }
  ]
}
```

### Get one (optional reveal)
`GET /api/api-integrations/:name?reveal=true`

### Upsert
`PUT /api/api-integrations` or `POST /api/api-integrations`

```json
{
  "api_name": "Scamalytics",
  "api_user_id": "your-user-id",
  "api_key": "your-secret-key"
}
```

Secrets are encrypted at rest. Scamalytics runtime reads DB credentials first, then falls back to env vars.

---

## 3. Tremendous redemption method (extended)

`GET/PUT /api/reward-settings/get|update` now includes:

```json
{ "tremendous_enabled": true }
```

DB column `reward_settings.tremendous_enabled` is auto-added if missing.

---

## 4. Missing / not yet available

### Tremendous product catalog
There is **no** backend product catalog endpoint yet for listing Tremendous products with name + logo.

When available, expected shape for redeem rows / catalog:

```json
{
  "product_name": "Amazon.com Gift Card",
  "product_logo": "https://...",
  "tremendous_product_id": "..."
}
```

Admin UI already maps `product_name` / `product_logo` (and aliases) onto redeem request details when the backend returns them.

### Dedicated Tremendous credentials
Store Tremendous API credentials via **Settings → API Key Management** with `api_name: "Tremendous"` (same API Key Management endpoints above). Do not hard-code Tremendous secrets in the frontend.
