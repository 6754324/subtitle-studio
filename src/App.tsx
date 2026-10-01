import { useState } from 'react'
import { Header } from './components/Header'
import { CueTable } from './components/CueTable'
import { SidePanel } from './components/SidePanel'
import { ImportModal } from './components/ImportModal'

export default function App() {
  const [importOpen, setImportOpen] = useState(false)

  return (
    <div className="flex h-screen flex-col bg-paper-50 text-ink-600">
      <Header onOpenImport={() => setImportOpen(true)} />
      <div className="flex min-h-0 flex-1">
        <main className="min-w-0 flex-1 overflow-hidden">
          <CueTable />
        </main>
        <aside className="w-80 shrink-0 overflow-auto border-l border-ink-200 p-4">
          <SidePanel />
        </aside>
      </div>
      {importOpen && <ImportModal onClose={() => setImportOpen(false)} />}
    </div>
  )
}
