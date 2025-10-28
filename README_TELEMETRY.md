# Telemetry & Usage Monitoring

## Overview

AuroraAI includes a comprehensive telemetry system to track API usage, monitor performance, and calculate costs for AI service calls. This helps you understand usage patterns, optimize performance, and manage operational costs.

## Features

- **Performance Tracking**: Monitor execution time for Claude, Imagen, and Midjourney API calls
- **Cost Calculation**: Automatic cost estimation based on service usage
- **Usage Analytics**: View daily/weekly/monthly usage statistics per user
- **Error Monitoring**: Track failures and error messages for debugging
- **Success Rates**: Monitor success/failure rates for each AI service

## Database Schema

### `generation_logs` Table

Stores detailed logs for every AI generation attempt:

```sql
CREATE TABLE generation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  generator TEXT NOT NULL CHECK (generator IN ('Imagen-3', 'Midjourney', 'Claude')),
  time_ms INTEGER NOT NULL,
  cost DECIMAL(10, 6),
  prompt_length INTEGER DEFAULT 0,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Fields:**
- `user_id`: References authenticated user
- `generator`: Which AI service was used (Claude/Imagen-3/Midjourney)
- `time_ms`: Execution time in milliseconds
- `cost`: Estimated cost in USD
- `prompt_length`: Character count of the prompt
- `success`: Whether the generation succeeded
- `error_message`: Error details if failed
- `metadata`: Additional context (vibe, cleaned prompts, etc.)

### RLS Policies

Users can only view their own logs:
```sql
-- Users can view their own logs
CREATE POLICY "Users can view own generation logs"
  ON generation_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role can insert logs
CREATE POLICY "Service role can insert generation logs"
  ON generation_logs FOR INSERT
  TO service_role
  WITH CHECK (true);
```

## Cost Calculation

Estimated costs per service (as of implementation):

| Service | Cost per Generation |
|---------|---------------------|
| Claude (Sonnet 4.5) | $0.015 |
| Google Imagen-3 | $0.04 |
| Midjourney | $0.06 |

> **Note**: These are estimates. Actual costs may vary based on prompt complexity, image resolution, and API pricing changes.

## API Endpoints

### Log Generation

**Endpoint**: `POST /api/telemetry/log`

Logs a generation event (used internally by the submit API).

```typescript
// Request Body
{
  userId: string;
  generator: 'Imagen-3' | 'Midjourney' | 'Claude';
  timeMs: number;
  success?: boolean;
  errorMessage?: string;
  promptLength?: number;
  metadata?: Record<string, any>;
}

// Response
{
  success: true,
  logId: "uuid"
}
```

### Get User Stats

**Endpoint**: `GET /api/telemetry/stats`

Retrieve aggregated usage statistics for the authenticated user.

```typescript
// Response
{
  totalGenerations: number;
  successfulGenerations: number;
  failedGenerations: number;
  totalCost: number;
  averageTimeMs: number;
  generatorBreakdown: {
    [generator: string]: {
      count: number;
      totalCost: number;
      averageTimeMs: number;
    }
  }
}
```

**Example:**
```bash
curl -X GET https://your-domain.com/api/telemetry/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Usage in Code

### Logging a Generation

```typescript
import { logGeneration } from '@/lib/telemetry';

// Log successful generation
await logGeneration({
  userId: 'user-uuid',
  generator: 'Imagen-3',
  timeMs: 2500,
  success: true,
  promptLength: 120,
  metadata: {
    vibe: 'serene',
    resolution: '1024x1024'
  }
});

// Log failed generation
await logGeneration({
  userId: 'user-uuid',
  generator: 'Claude',
  timeMs: 1200,
  success: false,
  errorMessage: 'API rate limit exceeded',
  promptLength: 450
});
```

### Calculating Costs

```typescript
import { calculateCost } from '@/lib/telemetry';

const claudeCost = calculateCost('Claude', 1500);  // $0.015
const imagenCost = calculateCost('Imagen-3', 3000); // $0.04
const midjourneyGost = calculateCost('Midjourney', 5000); // $0.06
```

### Getting User Stats

```typescript
import { getUserUsageStats } from '@/lib/telemetry';

const stats = await getUserUsageStats('user-uuid');

console.log(`Total cost: $${stats.totalCost.toFixed(2)}`);
console.log(`Success rate: ${(stats.successfulGenerations / stats.totalGenerations * 100).toFixed(1)}%`);
```

## Telemetry Flow

### Image Generation Request

1. **User submits reflection** → `POST /api/submit`
2. **Claude processes reflection**:
   - Start timer: `claudeStartTime = Date.now()`
   - Call Claude API
   - End timer: `claudeTimeMs = Date.now() - claudeStartTime`
   - Log result: `logGeneration({ generator: 'Claude', timeMs: claudeTimeMs, ... })`
3. **Image generation**:
   - Start timer: `imageGenStartTime = Date.now()`
   - Call Imagen-3 or Midjourney API
   - End timer: `imageGenTimeMs = Date.now() - imageGenStartTime`
   - Log result: `logGeneration({ generator: 'Imagen-3', timeMs: imageGenTimeMs, ... })`
4. **Upload to Supabase Storage**
5. **Return image URL to user**

### Error Handling

All errors are logged with telemetry:

```typescript
try {
  // AI generation
} catch (error) {
  await logGeneration({
    userId,
    generator: 'Claude',
    timeMs: elapsedTime,
    success: false,
    errorMessage: error.message,
  });
  throw error;
}
```

## Analytics Queries

### View Recent Generations

```sql
SELECT 
  generator,
  time_ms,
  cost,
  success,
  created_at
FROM generation_logs
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 50;
```

### Total Cost This Month

```sql
SELECT 
  SUM(cost) as total_cost,
  COUNT(*) as total_generations
FROM generation_logs
WHERE user_id = auth.uid()
  AND created_at >= DATE_TRUNC('month', NOW());
```

### Success Rate by Generator

```sql
SELECT 
  generator,
  COUNT(*) as total,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful,
  ROUND(100.0 * SUM(CASE WHEN success THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
FROM generation_logs
WHERE user_id = auth.uid()
GROUP BY generator;
```

### Average Response Time

```sql
SELECT 
  generator,
  AVG(time_ms) as avg_time_ms,
  MIN(time_ms) as min_time_ms,
  MAX(time_ms) as max_time_ms
FROM generation_logs
WHERE user_id = auth.uid()
  AND success = TRUE
GROUP BY generator;
```

## Monitoring & Alerts

### Set Up Alerts

You can create database functions to alert on:

- **High Error Rates**: Alert when >20% of generations fail in an hour
- **Cost Thresholds**: Alert when daily cost exceeds budget
- **Performance Degradation**: Alert when average response time increases significantly

### Example: Cost Alert Function

```sql
CREATE OR REPLACE FUNCTION check_daily_cost_alert()
RETURNS TRIGGER AS $$
DECLARE
  daily_cost DECIMAL;
BEGIN
  SELECT SUM(cost) INTO daily_cost
  FROM generation_logs
  WHERE user_id = NEW.user_id
    AND created_at >= CURRENT_DATE;
  
  IF daily_cost > 10.00 THEN
    -- Send notification (implement with pg_notify or external service)
    PERFORM pg_notify('cost_alert', 
      json_build_object(
        'user_id', NEW.user_id,
        'daily_cost', daily_cost
      )::text
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER daily_cost_check
  AFTER INSERT ON generation_logs
  FOR EACH ROW
  EXECUTE FUNCTION check_daily_cost_alert();
```

## Setup Instructions

### 1. Run Database Migration

Execute the telemetry schema in Supabase SQL Editor:

```bash
# Copy and run the contents of schema-telemetry.sql
```

### 2. Verify RLS Policies

Ensure Row Level Security is enabled and policies are active:

```sql
SELECT * FROM pg_policies WHERE tablename = 'generation_logs';
```

### 3. Test Telemetry Logging

Make a test image generation request and verify the log entry:

```sql
SELECT * FROM generation_logs ORDER BY created_at DESC LIMIT 1;
```

### 4. Access Stats API

Authenticate and fetch your usage statistics:

```bash
curl https://your-domain.com/api/telemetry/stats \
  -H "Authorization: Bearer YOUR_JWT"
```

## Best Practices

1. **Don't Skip Telemetry**: Always log both successful and failed generations
2. **Include Context**: Use `metadata` field for debugging (vibe, prompt cleaning, etc.)
3. **Monitor Costs**: Regularly check stats to avoid unexpected bills
4. **Analyze Failures**: Review error messages to improve reliability
5. **Performance Optimization**: Use time metrics to identify slow API calls
6. **Privacy**: Telemetry logs contain user_id but not personal reflection content

## Troubleshooting

### Logs Not Appearing

1. **Check RLS Policies**: Ensure service role can insert
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'generation_logs';
   ```

2. **Verify Service Role Key**: Check `SUPABASE_SERVICE_ROLE_KEY` is set
   ```bash
   echo $SUPABASE_SERVICE_ROLE_KEY
   ```

3. **Check API Logs**: View Vercel/server logs for errors

### Incorrect Cost Calculations

Update cost constants in `/lib/telemetry.ts`:

```typescript
export const GENERATION_COSTS = {
  'Imagen-3': 0.04,      // Update with current pricing
  'Midjourney': 0.06,    // Update with current pricing
  'Claude': 0.015,       // Update with current pricing
};
```

### Missing Stats

Run the RPC function manually to check for errors:

```sql
SELECT * FROM get_user_usage_stats(auth.uid());
```

## Future Enhancements

- **Dashboard**: Build a visual analytics dashboard
- **Export Data**: CSV export for accounting/analysis
- **Billing Integration**: Connect to Stripe for automated billing
- **Real-time Monitoring**: WebSocket-based live usage display
- **Anomaly Detection**: ML-based alerts for unusual patterns
- **Multi-tenant Analytics**: Admin view for all users (with proper authorization)

## Related Documentation

- [Database Schema](./schema-telemetry.sql)
- [Telemetry Utilities](./lib/telemetry.ts)
- [Authentication](./README_AUTH.md)
- [Notifications](./README_NOTIFICATIONS.md)

---

**Last Updated**: January 2025  
**Version**: 1.0.0
