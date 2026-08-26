import type { AsPreparedResult } from '@/lib/lab/as-prepared'
import { formatLabNumber } from '@/lib/lab/client'
import { useLabTranslations } from './use-lab-translations'

export function UncertaintyBudgetTable({ result }: { result: AsPreparedResult }) {
  const t = useLabTranslations()
  const sourceLabels: Record<AsPreparedResult['uncertainty']['budget'][number]['source'], string> = {
    coa_assay: t.uncertaintySourceCoaAssay,
    mass: t.uncertaintySourceBalanceMass,
    flask_calibration: t.uncertaintySourceFlaskCalibration,
    fill_repeatability: t.uncertaintySourceFillRepeatability,
    temperature_expansion: t.uncertaintySourceTemperatureExpansion,
  }
  return (
    <div className="overflow-x-auto border border-border">
      <table className="min-w-full text-left text-xs">
        <thead className="border-b border-border bg-muted text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">{t.uncertaintyTerm}</th>
            <th className="px-3 py-2 font-medium">{t.uncertaintyDistribution}</th>
            <th className="px-3 py-2 font-medium">{t.uncertaintyHalfWidthOrSd}</th>
            <th className="px-3 py-2 font-medium">{t.uncertaintyRelative}</th>
            <th className="px-3 py-2 font-medium">{t.uncertaintyBasis}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {result.uncertainty.budget.map((term) => (
            <tr key={term.source} className={term.status === 'not_included' ? 'bg-muted/50 text-muted-foreground' : 'text-foreground'}>
              <td className="px-3 py-2 font-medium">{sourceLabels[term.source]}</td>
              <td className="px-3 py-2 font-mono tabular-nums">{term.distribution ?? t.uncertaintyNotIncluded}</td>
              <td className="px-3 py-2 font-mono tabular-nums">
                {term.halfWidthOrSd === null ? '—' : `${formatLabNumber(term.halfWidthOrSd)} ${term.unit ?? ''}`.trim()}
              </td>
              <td className="px-3 py-2 font-mono tabular-nums">
                {term.standardRelative === null ? '—' : formatLabNumber(term.standardRelative, 8)}
              </td>
              <td className="min-w-72 px-3 py-2 leading-relaxed">{term.basis}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
