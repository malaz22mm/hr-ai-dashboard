import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { attendanceApi, type AttendanceHistoryQuery } from '@/api/resources/attendanceApi'
import { queryKeys } from '@/query/keys'

export function useAttendancePresenceQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.attendance.presence,
    queryFn: () => attendanceApi.presence(),
    enabled,
    staleTime: 30 * 1000,
  })
}

export function useAttendanceHistoryQuery(
  employeeId: number | null,
  query: AttendanceHistoryQuery = {},
  enabled = true,
) {
  const stable = { ...query }
  return useQuery({
    queryKey: queryKeys.attendance.history(employeeId ?? 0, stable),
    queryFn: () => attendanceApi.history(employeeId!, stable),
    enabled: enabled && employeeId != null && employeeId > 0,
  })
}

export function useAttendancePunchMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: attendanceApi.punch,
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({ queryKey: queryKeys.attendance.root })
      void qc.invalidateQueries({
        queryKey: queryKeys.attendance.history(variables.empId, {}),
      })
    },
  })
}
