import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "code-preview" is now active!');

	const disposable = vscode.commands.registerCommand('code-preview.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from code-preview!');
	});

	context.subscriptions.push(disposable);
}

// export function deactivate() {}
