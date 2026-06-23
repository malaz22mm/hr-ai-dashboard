# Frontend: Attrition Prediction Integration

The ML model is exposed **only through the NestJS API**. Do not call Python or ML model files directly from the browser.

## Endpoint

```http
GET {API_BASE_URL}/employees/{employeeId}/predictions/attrition
Authorization: Bearer {accessToken}
```

Example production base URL: your Vercel backend root (same as other HR API routes).

## TypeScript client example

```typescript
export interface AttritionPrediction {
  employeeId: number;
  employeeName: string;
  predictedAttrition: boolean;
  attritionProbability: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  suggestedAttritionRiskClassId: number;
  modelVersion: string;
  computedAt: string;
}

export async function fetchAttritionPrediction(
  apiBaseUrl: string,
  employeeId: number,
  accessToken: string,
): Promise<AttritionPrediction> {
  const response = await fetch(
    `${apiBaseUrl}/employees/${employeeId}/predictions/attrition`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Prediction failed: ${response.status}`);
  }

  return response.json();
}
```

## UI suggestions (employee detail page)

1. On mount (or button click), call `fetchAttritionPrediction`.
2. Show loading spinner (~0.1–0.5s).
3. Display:
   - **Risk badge:** Low (green), Medium (amber), High (red) from `riskLevel`
   - **Probability:** `Math.round(attritionProbability * 100)%` chance of leaving
   - **Label:** `predictedAttrition ? 'At risk of leaving' : 'Likely to stay'`
4. On `503`, show: "Prediction service temporarily unavailable."

## React hook example

```typescript
import { useEffect, useState } from 'react';

export function useAttritionPrediction(
  apiBaseUrl: string,
  employeeId: number,
  accessToken: string | null,
) {
  const [data, setData] = useState<AttritionPrediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken || employeeId == null) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchAttritionPrediction(apiBaseUrl, employeeId, accessToken)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl, employeeId, accessToken]);

  return { data, loading, error };
}
```

## Auth

Same JWT access token used for `GET /employees` and other protected routes.

## CORS

Backend allows `http://localhost:5173` and `https://hrdashboardai.netlify.app`. Add your frontend origin in `src/app.config.ts` if needed.
