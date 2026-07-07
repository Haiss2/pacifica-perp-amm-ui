import { TABS } from '../tabs'

export default function Sidebar({ activeTab, onSelectTab }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        Perp AMM
        <img src="/logo.svg" alt="" className="logo" />
        
      </div>
      <div role="tablist" aria-orientation="vertical">
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
