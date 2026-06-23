import { Alert, Card, Spin, Tag } from 'antd'
import { useAttritionPredictionQuery } from '@/features/employees/hooks/useAttritionPredictionQuery'
import { isApiError } from '@/api/errors'
import { getApiErrorMessage } from '@/lib/apiErrors'
import type { AttritionPredictionDto } from '@/types/dto'

type Props = {
  employeeId: number
}

function riskTagColor(level: AttritionPredictionDto['riskLevel']): 'error' | 'warning' | 'success' {
  if (level === 'High') return 'error'
  if (level === 'Medium') return 'warning'
  return 'success'
}

function getPredictionErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    if (error.status === 503) return 'Prediction service temporarily unavailable.'
    if (error.status === 404) return 'Employee prediction unavailable.'
  }
  return getApiErrorMessage(error, 'Could not load ML prediction.')
}

export function MlAttritionPredictionCard({ employeeId }: Props) {
  const { data, isLoading, error, isFetching } = useAttritionPredictionQuery(employeeId)

  return (
    <Card title="ML Attrition Prediction">
      <p className="mb-4 text-sm text-slate-600">
        Live model inference from{' '}
        <code className="text-xs">GET /employees/{employeeId}/predictions/attrition</code>. This is
        separate from the HR attrition risk class stored on the employee record.
      </p>

      {isLoading || (isFetching && !data) ? (
        <div className="flex min-h-[120px] items-center justify-center">
          <Spin />
        </div>
      ) : null}

      {error && !isLoading ? (
        <Alert
          type={isApiError(error) && error.status === 503 ? 'warning' : 'error'}
          showIcon
          message="Prediction unavailable"
          description={getPredictionErrorMessage(error)}
        />
      ) : null}

      {data && !error ? (
        <div className="space-y-3 text-sm text-slate-700">
          <p>
            <strong>Risk Level:</strong>{' '}
            <Tag color={riskTagColor(data.riskLevel)}>{data.riskLevel}</Tag>
          </p>
          <p>
            <strong>Attrition Probability:</strong>{' '}
            {Math.round(data.attritionProbability * 100)}%
          </p>
          <p>
            <strong>Predicted Attrition:</strong> {data.predictedAttrition ? 'Yes' : 'No'}
          </p>
          <p>
            <strong>Model Version:</strong> {data.modelVersion}
          </p>
          <p>
            <strong>Computed At:</strong>{' '}
            {data.computedAt ? new Date(data.computedAt).toLocaleString() : '—'}
          </p>
        </div>
      ) : null}
    </Card>
  )
}
