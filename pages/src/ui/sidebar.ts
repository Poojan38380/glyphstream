// ============================================================
// GlyphStream — Sidebar Control Panel
// Generic parameter control builder for all component demos.
// ============================================================

export interface ControlDef {
  id: string
  label: string
  type: 'slider' | 'color' | 'select' | 'button'
  min?: number
  max?: number
  step?: number
  value?: number | string
  options?: { label: string; value: string }[]
  label?: string
  onChange?: (value: number | string) => void
}

export interface SidebarConfig {
  title: string
  controls: ControlDef[]
  presets?: { name: string; description: string }[]
  onPresetSelect?: (name: string) => void
  onRegenerate?: () => void
  onReset?: () => void
}

export function buildSidebar(config: SidebarConfig): HTMLElement {
  const sidebar = document.createElement('div')
  sidebar.className = 'gs-sidebar'
  Object.assign(sidebar.style, {
    position: 'fixed',
    top: '0',
    right: '0',
    width: '280px',
    height: '100vh',
    background: 'rgba(12,12,18,0.95)',
    borderLeft: '1px solid rgba(255,255,255,0.08)',
    padding: '20px 16px',
    overflowY: 'auto',
    fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    fontSize: '12px',
    color: '#ccc8c0',
    zIndex: '1000',
    backdropFilter: 'blur(10px)',
  })

  // Title
  const title = document.createElement('h2')
  title.textContent = config.title
  Object.assign(title.style, {
    fontSize: '14px',
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: '16px',
    letterSpacing: '0.5px',
  })
  sidebar.appendChild(title)

  // Presets
  if (config.presets && config.presets.length > 0) {
    const presetSection = document.createElement('div')
    presetSection.className = 'gs-section'
    Object.assign(presetSection.style, { marginBottom: '20px' })

    const presetLabel = document.createElement('div')
    presetLabel.textContent = 'PRESETS'
    Object.assign(presetLabel.style, {
      fontSize: '10px',
      fontWeight: '600',
      color: 'rgba(255,255,255,0.3)',
      letterSpacing: '1px',
      marginBottom: '8px',
    })
    presetSection.appendChild(presetLabel)

    const presetGrid = document.createElement('div')
    Object.assign(presetGrid.style, {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '6px',
    })

    for (const preset of config.presets) {
      const btn = document.createElement('button')
      btn.textContent = preset.name
      btn.title = preset.description
      Object.assign(btn.style, {
        background: 'rgba(255,255,255,0.06)',
        color: '#ccc8c0',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '4px',
        padding: '4px 10px',
        fontSize: '11px',
        cursor: 'pointer',
        transition: 'background 0.15s',
      })
      btn.onmouseenter = () => (btn.style.background = 'rgba(255,255,255,0.12)')
      btn.onmouseleave = () => (btn.style.background = 'rgba(255,255,255,0.06)')
      btn.onclick = () => config.onPresetSelect?.(preset.name)
      presetGrid.appendChild(btn)
    }

    presetSection.appendChild(presetGrid)
    sidebar.appendChild(presetSection)
  }

  // Controls
  for (const def of config.controls) {
    const group = document.createElement('div')
    Object.assign(group.style, {
      marginBottom: '14px',
    })

    const label = document.createElement('label')
    label.textContent = def.label
    Object.assign(label.style, {
      display: 'block',
      fontSize: '11px',
      color: 'rgba(255,255,255,0.5)',
      marginBottom: '4px',
    })
    group.appendChild(label)

    if (def.type === 'slider') {
      const row = document.createElement('div')
      Object.assign(row.style, { display: 'flex', alignItems: 'center', gap: '8px' })

      const input = document.createElement('input')
      input.type = 'range'
      input.min = String(def.min ?? 0)
      input.max = String(def.max ?? 100)
      input.step = String(def.step ?? 1)
      input.value = String(def.value ?? 50)
      Object.assign(input.style, {
        flex: '1',
        accentColor: '#c4a35a',
      })

      const display = document.createElement('span')
      display.className = 'gs-value'
      display.textContent = String(def.value ?? 50)
      Object.assign(display.style, {
        fontSize: '11px',
        fontFamily: 'monospace',
        color: 'rgba(255,255,255,0.7)',
        minWidth: '36px',
        textAlign: 'right',
      })

      input.oninput = () => {
        display.textContent = input.value
        def.onChange?.(def.step && def.step < 1 ? parseFloat(input.value) : parseInt(input.value))
      }

      row.appendChild(input)
      row.appendChild(display)
      group.appendChild(row)
    }

    if (def.type === 'color') {
      const input = document.createElement('input')
      input.type = 'color'
      input.value = String(def.value ?? '#ffffff')
      Object.assign(input.style, {
        width: '100%',
        height: '28px',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '4px',
        background: 'transparent',
        cursor: 'pointer',
      })
      input.oninput = () => def.onChange?.(input.value)
      group.appendChild(input)
    }

    if (def.type === 'select') {
      const select = document.createElement('select')
      Object.assign(select.style, {
        width: '100%',
        background: 'rgba(255,255,255,0.06)',
        color: '#ccc8c0',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '4px',
        padding: '4px 8px',
        fontSize: '11px',
      })
      for (const opt of def.options ?? []) {
        const option = document.createElement('option')
        option.value = opt.value
        option.textContent = opt.label
        select.appendChild(option)
      }
      select.value = String(def.value ?? def.options?.[0]?.value ?? '')
      select.onchange = () => def.onChange?.(select.value)
      group.appendChild(select)
    }

    sidebar.appendChild(group)
  }

  // Actions
  const actions = document.createElement('div')
  Object.assign(actions.style, {
    marginTop: '20px',
    paddingTop: '16px',
    borderTop: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    gap: '8px',
  })

  if (config.onRegenerate) {
    const regenBtn = document.createElement('button')
    regenBtn.textContent = '⟳ Regenerate'
    Object.assign(regenBtn.style, {
      flex: '1',
      background: 'rgba(196,163,90,0.15)',
      color: '#c4a35a',
      border: '1px solid rgba(196,163,90,0.3)',
      borderRadius: '4px',
      padding: '6px 12px',
      fontSize: '11px',
      cursor: 'pointer',
    })
    regenBtn.onclick = config.onRegenerate
    actions.appendChild(regenBtn)
  }

  if (config.onReset) {
    const resetBtn = document.createElement('button')
    resetBtn.textContent = 'Reset'
    Object.assign(resetBtn.style, {
      flex: '1',
      background: 'rgba(255,255,255,0.06)',
      color: '#ccc8c0',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '4px',
      padding: '6px 12px',
      fontSize: '11px',
      cursor: 'pointer',
    })
    resetBtn.onclick = config.onReset
    actions.appendChild(resetBtn)
  }

  sidebar.appendChild(actions)

  return sidebar
}
