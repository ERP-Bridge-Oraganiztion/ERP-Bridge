import { useState, type FormEvent } from 'react'
import { Plus, Trash2, Sparkles, Pencil } from 'lucide-react'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/Card'
import { Button } from '@/components/Button'
import { Modal } from '@/components/Modal'
import { Input, FieldLabel, Select } from '@/components/Field'
import { DataTable, type Column } from '@/components/DataTable'
import { EmptyState } from '@/components/EmptyState'
import {
  useMappingRules,
  useCreateMappingRule,
  useUpdateMappingRule,
  useDeleteMappingRule,
  useAutoMap,
} from '@/hooks/useMapping'
import type { MappingRule } from '@/api/types'

const TRANSFORMS = ['NONE', 'UPPERCASE', 'LOWERCASE', 'TRIM', 'REGEX_REPLACE']
const DATA_TYPES = ['VARCHAR', 'INTEGER', 'DECIMAL', 'BOOLEAN', 'DATE', 'TEXT']

const EMPTY_FORM = {
  sourceTable: 'res_partner',
  sourceField: '',
  targetTable: 'business_partner',
  targetField: '',
  dataType: 'VARCHAR',
  required: false,
  transform: 'NONE',
}

export default function MappingTab({ projectId }: { projectId: number }) {
  const { data: rules, isLoading } = useMappingRules(projectId)
  const createRule = useCreateMappingRule(projectId)
  const updateRule = useUpdateMappingRule(projectId)
  const deleteRule = useDeleteMappingRule(projectId)
  const autoMap = useAutoMap(projectId)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingRuleId, setEditingRuleId] = useState<number | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)

  const isEditing = editingRuleId !== null
  const activeMutation = isEditing ? updateRule : createRule

  function openAddModal() {
    setEditingRuleId(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  function openEditModal(rule: MappingRule) {
    setEditingRuleId(rule.id)
    setForm({
      sourceTable: rule.sourceTable,
      sourceField: rule.sourceField,
      targetTable: rule.targetTable,
      targetField: rule.targetField,
      dataType: rule.dataType,
      required: rule.required,
      transform: rule.customTransformationLogic ?? 'NONE',
    })
    setModalOpen(true)
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const payload = {
      sourceTable: form.sourceTable,
      sourceField: form.sourceField,
      targetTable: form.targetTable,
      targetField: form.targetField,
      dataType: form.dataType,
      required: form.required,
      customTransformationLogic: form.transform === 'NONE' ? undefined : form.transform,
    }

    if (isEditing && editingRuleId !== null) {
      updateRule.mutate({ ruleId: editingRuleId, payload }, { onSuccess: () => setModalOpen(false) })
    } else {
      createRule.mutate(payload, { onSuccess: () => setModalOpen(false) })
    }
  }

  const columns: Column<MappingRule>[] = [
    { header: 'Source', accessor: (r) => `${r.sourceTable}.${r.sourceField}` },
    { header: 'Target', accessor: (r) => `${r.targetTable}.${r.targetField}` },
    { header: 'Type', accessor: (r) => <span className="font-mono text-xs">{r.dataType}</span> },
    { header: 'Required', accessor: (r) => (r.required ? 'Yes' : 'No') },
    { header: 'Transform', accessor: (r) => r.customTransformationLogic ?? '—' },
    {
      header: '',
      accessor: (r) => (
        <div className="flex items-center gap-3">
          <button onClick={() => openEditModal(r)} className="text-graphite-400 hover:text-ink" aria-label="Edit rule">
            <Pencil size={15} />
          </button>
          <button onClick={() => deleteRule.mutate(r.id)} className="text-graphite-400 hover:text-ink" aria-label="Delete rule">
            <Trash2 size={15} />
          </button>
        </div>
      ),
      width: '70px',
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Field Mapping Rules</CardTitle>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => autoMap.mutate()} disabled={autoMap.isPending}>
            <Sparkles size={15} /> {autoMap.isPending ? 'Thinking…' : 'Auto-map with AI'}
          </Button>
          <Button size="sm" onClick={openAddModal}>
            <Plus size={15} /> Add Rule
          </Button>
        </div>
      </CardHeader>
      <CardBody className="p-0">
               {autoMap.isSuccess && (
          <div className="border-b border-graphite-200 bg-graphite-50 px-5 py-2.5 text-xs text-ink">
            <p>
              AI suggested {autoMap.data.suggestedCount} mappings, created {autoMap.data.createdCount} new rule(s).
              You can fine-tune any row with the pencil icon.
            </p>
            {autoMap.data.createdCount === 0 && autoMap.data.skipped && autoMap.data.skipped.length > 0 && (
              <ul className="mt-2 list-disc pl-4 text-graphite-600">
                {autoMap.data.skipped.map((s, i) => (
                  <li key={i}>
                    <span className="font-mono">{s.key}</span>: {s.reason}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        {autoMap.isError && (
          <p className="border-b border-graphite-200 bg-graphite-50 px-5 py-2.5 text-xs text-ink">
            {(autoMap.error as any)?.response?.data?.message || 'Could not get AI mapping suggestions.'}
          </p>
        )}
        {isLoading ? (
          <p className="p-5 text-sm text-graphite-500">Loading mapping rules…</p>
        ) : !rules || rules.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="No mapping rules configured"
              description="Map discovered source columns to SAP Business Partner / Material fields before running validation."
              action={<Button size="sm" onClick={openAddModal}>Add Rule</Button>}
            />
          </div>
        ) : (
          <DataTable columns={columns} rows={rules} keyFor={(r) => r.id} />
        )}
      </CardBody>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={isEditing ? 'Edit Mapping Rule' : 'New Mapping Rule'}>
        <form onSubmit={handleSubmit}>
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Source table</FieldLabel>
              <Input required value={form.sourceTable} onChange={(e) => setForm({ ...form, sourceTable: e.target.value })} />
            </div>
            <div>
              <FieldLabel>Source field</FieldLabel>
              <Input required value={form.sourceField} onChange={(e) => setForm({ ...form, sourceField: e.target.value })} />
            </div>
          </div>
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Target table</FieldLabel>
              <Input required value={form.targetTable} onChange={(e) => setForm({ ...form, targetTable: e.target.value })} />
            </div>
            <div>
              <FieldLabel>Target field</FieldLabel>
              <Input required value={form.targetField} onChange={(e) => setForm({ ...form, targetField: e.target.value })} />
            </div>
          </div>
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Data type</FieldLabel>
              <Select value={form.dataType} onChange={(e) => setForm({ ...form, dataType: e.target.value })}>
                {DATA_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <FieldLabel>Transformation</FieldLabel>
              <Select value={form.transform} onChange={(e) => setForm({ ...form, transform: e.target.value })}>
                {TRANSFORMS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <label className="mb-5 flex items-center gap-2 text-sm text-graphite-700">
            <input
              type="checkbox"
              checked={form.required}
              onChange={(e) => setForm({ ...form, required: e.target.checked })}
              className="h-4 w-4 border-graphite-400 accent-ink"
            />
            Required field
          </label>

          {activeMutation.isError && (
            <p className="mb-4 border border-ink bg-graphite-50 px-3 py-2 text-xs text-ink">
              {(activeMutation.error as any)?.response?.data?.message ||
                'Could not save this mapping. Check the console/network tab for details.'}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={activeMutation.isPending}>
              {activeMutation.isPending ? 'Saving…' : isEditing ? 'Update rule' : 'Save rule'}
            </Button>
          </div>
        </form>
      </Modal>
    </Card>
  )
}
