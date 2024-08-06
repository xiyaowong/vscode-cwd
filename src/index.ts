import type { ConfigurationChangeEvent, ExtensionContext, WorkspaceFolder } from 'vscode'
import { StatusBarAlignment, window, workspace } from 'vscode'

const DEFAULT_TEMPLATE = '$(folder-opened) {name:capitalize}'

function transformText(text: string, transform = 'capitalize') {
  switch (transform.toLowerCase()) {
    case 'uppercase': return text.toUpperCase()
    case 'lowercase': return text.toLowerCase()
    case 'capitalize': return text.trim().split(/-|_/g).map((t) => {
      if ((/^vscode$/i).test(t)) return 'VSCode' // :)
      return t.charAt(0).toUpperCase() + t.slice(1)
    }).join(' ')
    default: return text
  }
}

export function activate(ctx: ExtensionContext) {
  let template = DEFAULT_TEMPLATE

  const status = window.createStatusBarItem('vscode.cwd', StatusBarAlignment.Left, 99999)
  status.command = 'workbench.action.switchWindow'
  status.show()

  function refreshConfig(e?: ConfigurationChangeEvent) {
    if (e && !e.affectsConfiguration('vscode-cwd')) return
    const cfg = workspace.getConfiguration('vscode-cwd')
    template = cfg.get('template', DEFAULT_TEMPLATE)

    refreshCwd()
  }

  function refreshCwd() {
    let workspaceFolder: WorkspaceFolder | undefined
    if (window.activeTextEditor)
      workspaceFolder = workspace.getWorkspaceFolder(window.activeTextEditor.document.uri)
    workspaceFolder = workspaceFolder || workspace.workspaceFolders?.[0]

    if (workspaceFolder) {
      const name = workspaceFolder.name
      status.text = template
        .replaceAll(/\{name:(\w+)\}/g, (_, transform) => transformText(name, transform))
        .replaceAll(/\{name:?\}/g, name)
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
