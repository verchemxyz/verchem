'use client'

import type { PrepDraft, PrepTemplate } from '@/lib/lab/types'
import type { RequiredPrepField } from '@/lib/lab/required-fields'
import { useLabTranslations } from './use-lab-translations'

type Measurements = PrepDraft['measurements']

export function requiredPrepFieldLabel(
  t: ReturnType<typeof useLabTranslations>,
  field: RequiredPrepField
): string {
  return {
    lot: t.reagentLot,
    coa_assay: t.coaAssay,
    expiry: t.expiry,
    balance_id: t.balanceId,
    flask_id: t.flaskId,
    temperature: t.temperature,
  }[field]
}

/**
 * Editable values may be temporarily incomplete while a preparer clears and
 * replaces a number. Keeping zero-valid temperatures nullable prevents an
 * empty input from becoming a fabricated 0 °C bench observation.
 */
export type EditableMeasurements = Omit<Measurements, 'temperatureC' | 'equipment'> & {
  temperatureC: number | null
  equipment: Omit<Measurements['equipment'], 'flaskCalibrationTemperatureC'> & {
    flaskCalibrationTemperatureC: number | null
  }
}

const controlClass = 'mt-1.5 min-h-[44px] w-full rounded-md border border-input-border bg-input px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-ring'

function optionalNumber(value: string): number | null {
  return value.trim() === '' ? null : Number(value)
}

function requiredNumber(value: string): number {
  return value.trim() === '' ? 0 : Number(value)
}

function nullableNumber(value: string): number | null {
  return value.trim() === '' ? null : Number(value)
}

function RequiredHint({ required, missing }: { required: boolean; missing: boolean }) {
  const t = useLabTranslations()
  return required ? <span className="ml-2 text-xs text-destructive-strong">{missing ? t.requiredValueMissing : t.requiredByTemplate}</span> : null
}

function Field({
  label,
  required,
  missing = false,
  children,
  help,
}: {
  label: string
  required?: boolean
  missing?: boolean
  children: React.ReactNode
  help?: string
}) {
  return (
    <label className="block text-sm font-medium text-foreground">
      {label}<RequiredHint required={required === true} missing={missing} />
      {children}
      {help && <span className="mt-1 block text-xs font-normal text-muted-foreground">{help}</span>}
    </label>
  )
}

export function createInitialMeasurements(template: PrepTemplate): EditableMeasurements {
  const declaredVolumeMl = template.spec.targetVolumeUnit === 'mL'
    ? template.spec.target.targetVolume
    : template.spec.target.targetVolume * 1000
  return {
    reagentLot: '',
    expiry: null,
    balanceId: null,
    flaskId: null,
    notes: '',
    weighedG: null,
    measuredMl: null,
    finalVolumeMl: declaredVolumeMl,
    coaAssayPercent: template.spec.target.reagentPurityPercent,
    coaBasis: template.spec.target.reagentPurityBasis,
    temperatureC: template.spec.target.preparationTemperatureC,
    equipment: {
      massStandardG: null,
      flaskToleranceMl: null,
      flaskCalibrationTemperatureC: template.spec.target.preparationTemperatureC,
      fillRepeatabilitySdMl: null,
      temperatureHalfWidthC: null,
      volumeExpansionCoefficientPerC: null,
      assayToleranceHalfWidthPercent: null,
    },
  }
}

/** Full controlled-measurement form; required-field flags guide the user but never authorize a transition. */
export function RequiredFieldsForm({
  template,
  measurements,
  onChange,
  disabled = false,
}: {
  template: PrepTemplate
  measurements: EditableMeasurements
  onChange: (next: EditableMeasurements) => void
  disabled?: boolean
}) {
  const t = useLabTranslations()
  const required = new Set(template.spec.requiredFields)
  const massPath = template.spec.target.unit !== 'pct_vv'
  const setEquipment = (equipment: EditableMeasurements['equipment']) => onChange({ ...measurements, equipment })

  return (
    <div className="space-y-7">
      <section>
        <h3 className="border-b border-border pb-2 text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">{t.benchRecord}</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label={t.reagentLot} required={required.has('lot')}>
            <input disabled={disabled} value={measurements.reagentLot} onChange={(event) => onChange({ ...measurements, reagentLot: event.target.value })} className={controlClass} />
          </Field>
          <Field label={t.expiry} required={required.has('expiry')}>
            <input disabled={disabled} type="date" value={measurements.expiry ?? ''} onChange={(event) => onChange({ ...measurements, expiry: event.target.value || null })} className={controlClass} />
          </Field>
          <Field label={t.coaAssay} required={required.has('coa_assay')}>
            <input disabled={disabled} type="number" step="any" value={measurements.coaAssayPercent} onChange={(event) => onChange({ ...measurements, coaAssayPercent: requiredNumber(event.target.value) })} className={controlClass} />
          </Field>
          <Field label={t.coaBasis}>
            <select disabled={disabled} value={measurements.coaBasis} onChange={(event) => onChange({ ...measurements, coaBasis: event.target.value as Measurements['coaBasis'] })} className={controlClass}>
              <option value="mass">{t.basisMass}</option>
              <option value="volume">{t.basisVolume}</option>
            </select>
          </Field>
          {massPath ? (
            <Field label={t.actualNetMass}>
              <input disabled={disabled} type="number" step="any" value={measurements.weighedG ?? ''} onChange={(event) => onChange({ ...measurements, weighedG: optionalNumber(event.target.value), measuredMl: null })} className={controlClass} />
            </Field>
          ) : (
            <Field label={t.deliveredVolume}>
              <input disabled={disabled} type="number" step="any" value={measurements.measuredMl ?? ''} onChange={(event) => onChange({ ...measurements, measuredMl: optionalNumber(event.target.value), weighedG: null })} className={controlClass} />
            </Field>
          )}
          <Field label={t.finalVolume}>
            <input disabled={disabled} type="number" step="any" value={measurements.finalVolumeMl} onChange={(event) => onChange({ ...measurements, finalVolumeMl: requiredNumber(event.target.value) })} className={controlClass} />
          </Field>
          <Field label={t.balanceId} required={required.has('balance_id')}>
            <input disabled={disabled} value={measurements.balanceId ?? ''} onChange={(event) => onChange({ ...measurements, balanceId: event.target.value || null })} className={controlClass} />
          </Field>
          <Field label={t.flaskId} required={required.has('flask_id')}>
            <input disabled={disabled} value={measurements.flaskId ?? ''} onChange={(event) => onChange({ ...measurements, flaskId: event.target.value || null })} className={controlClass} />
          </Field>
          <Field label={t.temperature} required={required.has('temperature')} missing={required.has('temperature') && measurements.temperatureC === null}>
            <input disabled={disabled} type="number" step="any" value={measurements.temperatureC ?? ''} onChange={(event) => onChange({ ...measurements, temperatureC: nullableNumber(event.target.value) })} className={controlClass} />
          </Field>
        </div>
        <Field label={t.notes} help={t.notesHelp}>
          <textarea disabled={disabled} value={measurements.notes} onChange={(event) => onChange({ ...measurements, notes: event.target.value })} rows={3} className={`${controlClass} resize-y`} />
        </Field>
      </section>

      <section>
        <h3 className="border-b border-border pb-2 text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">{t.equipmentUncertainty}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{t.equipmentHelp}</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label={t.balanceStandardUncertainty}>
            <input disabled={disabled} type="number" step="any" value={measurements.equipment.massStandardG ?? ''} onChange={(event) => setEquipment({ ...measurements.equipment, massStandardG: optionalNumber(event.target.value) })} className={controlClass} />
          </Field>
          <Field label={t.flaskToleranceHalfWidth}>
            <input disabled={disabled} type="number" step="any" value={measurements.equipment.flaskToleranceMl ?? ''} onChange={(event) => setEquipment({ ...measurements.equipment, flaskToleranceMl: optionalNumber(event.target.value) })} className={controlClass} />
          </Field>
          <Field label={t.flaskCalibrationTemp}>
            <input disabled={disabled} type="number" step="any" value={measurements.equipment.flaskCalibrationTemperatureC ?? ''} onChange={(event) => setEquipment({ ...measurements.equipment, flaskCalibrationTemperatureC: nullableNumber(event.target.value) })} className={controlClass} />
          </Field>
          <Field label={t.fillRepeatabilitySd}>
            <input disabled={disabled} type="number" step="any" value={measurements.equipment.fillRepeatabilitySdMl ?? ''} onChange={(event) => setEquipment({ ...measurements.equipment, fillRepeatabilitySdMl: optionalNumber(event.target.value) })} className={controlClass} />
          </Field>
          <Field label={t.temperatureHalfWidth}>
            <input disabled={disabled} type="number" step="any" value={measurements.equipment.temperatureHalfWidthC ?? ''} onChange={(event) => setEquipment({ ...measurements.equipment, temperatureHalfWidthC: optionalNumber(event.target.value) })} className={controlClass} />
          </Field>
          <Field label={t.volumeExpansionCoefficient}>
            <input disabled={disabled} type="number" step="any" value={measurements.equipment.volumeExpansionCoefficientPerC ?? ''} onChange={(event) => setEquipment({ ...measurements.equipment, volumeExpansionCoefficientPerC: optionalNumber(event.target.value) })} className={controlClass} />
          </Field>
          <Field label={t.coaAssayToleranceHalfWidth}>
            <input disabled={disabled} type="number" step="any" value={measurements.equipment.assayToleranceHalfWidthPercent ?? ''} onChange={(event) => setEquipment({ ...measurements.equipment, assayToleranceHalfWidthPercent: optionalNumber(event.target.value) })} className={controlClass} />
          </Field>
        </div>
      </section>

      <p className="text-xs text-muted-foreground">{t.requiredFieldsDisclaimer}</p>
    </div>
  )
}
