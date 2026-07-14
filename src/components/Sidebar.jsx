import { TABS } from '../tabs'
import { MODES } from '../modes'

export default function Sidebar({ activeTab, onSelectTab, mode, onSelectMode }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        Perp AMM
        <img src="/logo.svg" alt="" className="logo" />

      </div>
      <div className="mode-switch" role="tablist" aria-orientation="horizontal">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            role="tab"
            aria-selected={mode === m.id}
            className={mode === m.id ? 'active' : ''}
            onClick={() => onSelectMode(m.id)}
          >
            {m.label}
          </button>
        ))}
      </div>
      <div className="tab-list" role="tablist" aria-orientation="vertical">
        <ul>
          {TABS.map((tab) => (
            <li key={tab.id}>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                className={activeTab === tab.id ? 'active' : ''}
                onClick={() => onSelectTab(tab.id)}
              >
                {tab.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}
