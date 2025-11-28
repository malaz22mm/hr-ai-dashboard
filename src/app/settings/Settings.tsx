export default function Settings() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Settings</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Workspace Controls</h1>
        <p className="mt-1 text-base text-muted-foreground">
          Manage authentication, integrations, and automation preferences.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <form className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-lg font-semibold text-slate-900">Access</p>
          <p className="text-sm text-muted-foreground">Configure SSO and session policies.</p>

          <label className="mt-4 block text-sm font-medium text-slate-700">
            Allowed domains
            <input
              type="text"
              defaultValue="hr.example.com"
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
            />
          </label>

          <label className="mt-4 flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-slate-900" defaultChecked />
            Require MFA for admins
          </label>

          <button
            type="submit"
            className="mt-6 inline-flex w-full justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            Save changes
          </button>
        </form>

        <form className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-lg font-semibold text-slate-900">Integrations</p>
          <p className="text-sm text-muted-foreground">Connect HRIS, payroll, and communication tools.</p>

          <label className="mt-4 block text-sm font-medium text-slate-700">
            HRIS provider
            <select className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none">
              <option>Workday</option>
              <option>BambooHR</option>
              <option>Rippling</option>
            </select>
          </label>

          <label className="mt-4 block text-sm font-medium text-slate-700">
            Webhook endpoint
            <input
              type="url"
              defaultValue="https://hooks.example.com/hr"
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
            />
          </label>

          <button
            type="submit"
            className="mt-6 inline-flex w-full justify-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
          >
            Test connection
          </button>
        </form>
      </div>
    </div>
  )
}


