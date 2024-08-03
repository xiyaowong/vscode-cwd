import type { ConfigurationChangeEvent, ExtensionContext, WorkspaceFolder } from 'vscode'
import { StatusBarAlignment, window, workspace } from 'vscode'

const DEFAULT_ICON = 'folder-opened'
const DEFAULT_TEMPLATE = '{icon} {name}'
const DEFAULT_TRANSFORM = 'capitalize'

export function activate(ctx: ExtensionContext) {
  let icon = DEFAULT_ICON
  let template = DEFAULT_TEMPLATE
  let transform: 'none' | 'uppercase' | 'lowercase' | 'capitalize' = DEFAULT_TRANSFORM

  const status = window.createStatusBarItem('vscode.cwd', StatusBarAlignment.Left, 99999)
  status.command = 'workbench.action.switchWindow'
  status.show()

  function transformText(text: string) {
    switch (transform) {
      case 'uppercase': return text.toUpperCase()
      case 'lowercase': return text.toLowerCase()
      case 'capitalize': return text.trim().split(/-|_/g).map((t) => {
        if ((/^vscode$/i).test(t)) return 'VSCode' // :)
        return t.charAt(0).toUpperCase() + t.slice(1)
      }).join(' ')
      default: return text
    }
  }

  function refreshConfig(e?: ConfigurationChangeEvent) {
    if (e && !e.affectsConfiguration('vscode-cwd')) return
    const cfg = workspace.getConfiguration('vscode-cwd')
    icon = cfg.get('icon', DEFAULT_ICON)
    template = cfg.get('template', DEFAULT_TEMPLATE)
    transform = cfg.get('transform', DEFAULT_TRANSFORM)
  }

  function refreshCwd() {
    let workspaceFolder: WorkspaceFolder | undefined
    if (window.activeTextEditor) {
      workspaceFolder = workspace.getWorkspaceFolder(window.activeTextEditor.document.uri)
    } else if (workspace.workspaceFolders?.length) {
      workspaceFolder = workspace.workspaceFolders[0]
    }

    if (workspaceFolder) {
      status.text = template
        .replace(/\{icon\}/, `$(${icon})`)
        .replace(/\{name\}/, transformText(workspaceFolder.name))
      status.tooltip = workspaceFolder.uri.fsPath
    } else {
      status.text = ''
      status.tooltip = ''
    }
  }

  ctx.subscriptions.push(
    status,
    workspace.onDidChangeConfiguration(refreshConfig),
    workspace.onDidChangeWorkspaceFolders(refreshCwd),
    window.onDidChangeActiveTextEditor(refreshCwd),
  )

  refreshConfig()
  refreshCwd()
}

export function deactivate() {

}
