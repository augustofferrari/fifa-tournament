import { PageHeader } from '@renderer/components/PageHeader'

export function SettingsPage() {
  return (
    <section className="page">
      <PageHeader
        title="Settings"
        description="Configure application preferences."
      />
      <div className="card card--inline">
        <div>
          <h2 className="card__title">Platform</h2>
          <p className="card__meta">{window.api.app.platform}</p>
        </div>
      </div>
    </section>
  )
}
