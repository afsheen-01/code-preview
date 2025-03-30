import * as vscode from 'vscode';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
    console.log('React Preview extension is now active!');

    // Register command to open preview
    let disposable = vscode.commands.registerCommand('extension.previewReact', () => {
        const panel = vscode.window.createWebviewPanel(
            'reactPreview',
            'React Preview',
            vscode.ViewColumn.Beside,
            {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.file(path.join(context.extensionPath, 'media'))
                ]
            }
        );

        // Get the current text editor
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }

        // Update panel content
        updateWebview(panel, editor.document);

        // Update the webview when the document changes
        const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
            if (e.document.uri.toString() === editor.document.uri.toString()) {
                updateWebview(panel, e.document);
            }
        });

        // Clean up resources when panel is closed
        panel.onDidDispose(() => {
            changeDocumentSubscription.dispose();
        });
    });

    context.subscriptions.push(disposable);
}

function updateWebview(panel: vscode.WebviewPanel, document: vscode.TextDocument) {
    const content = document.getText();
    const fileName = document.fileName;
    const fileExtension = path.extname(fileName).toLowerCase();

    // Check if it's a React file
    if (['.jsx', '.tsx', '.js', '.ts'].includes(fileExtension)) {
        panel.webview.html = getReactPreviewHTML(content);
    } else {
        panel.webview.html = getNonReactHTML();
    }
}

function getReactPreviewHTML(content: string): string {
    // Process the component content
    const processedContent = processReactContent(content);
    
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>React Preview</title>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/react/17.0.2/umd/react.development.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/17.0.2/umd/react-dom.development.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/6.26.0/babel.min.js"></script>
        <style>
            body {
                padding: 20px;
                font-family: Arial, sans-serif;
                background-color: #1e1e1e;
                color: #ffffff;
            }
            #root {
                border: 1px solid #444;
                padding: 20px;
                border-radius: 4px;
                min-height: 100px;
            }
            .error {
                color: #ff6b6b;
                border: 1px solid #ff6b6b;
                padding: 10px;
                margin-top: 10px;
                border-radius: 4px;
                background-color: rgba(255, 107, 107, 0.1);
                white-space: pre-wrap;
                font-family: monospace;
            }
            h2 {
                color: #cccccc;
            }
        </style>
    </head>
    <body>
        <h2>React Component Preview</h2>
        <div id="root"></div>
        <div id="error-container"></div>

        <script type="text/babel">
            (function() {
                const errorContainer = document.getElementById('error-container');
                const rootElement = document.getElementById('root');
                
                try {
                    ${processedContent}
                    
                    // Try to determine the component to render
                    let componentToRender = null;
                    let componentName = null;
                    
                    // Check for common export patterns
                    if (typeof App !== 'undefined') {
                        componentToRender = App;
                        componentName = 'App';
                    } else if (typeof Component !== 'undefined') {
                        componentToRender = Component;
                        componentName = 'Component';
                    } else if (typeof Main !== 'undefined') {
                        componentToRender = Main;
                        componentName = 'Main';
                    }
                    
                    // If a component was found, try to render it
                    if (componentToRender) {
                        try {
                            ReactDOM.render(React.createElement(componentToRender), rootElement);
                            console.log('Successfully rendered component:', componentName);
                        } catch (renderError) {
                            errorContainer.innerHTML = '<div class="error">Error rendering component: ' + renderError.message + '</div>';
                            console.error('Render error:', renderError);
                        }
                    } else {
                        // If no component was found, display a helpful message
                        errorContainer.innerHTML = '<div class="error">No React component found to render. Make sure your component is named "App", "Component", or "Main", or modify the extension to look for your specific component name.</div>';
                    }
                } catch (error) {
                    errorContainer.innerHTML = '<div class="error">Error parsing React component: ' + error.message + '</div>';
                    console.error('Parse error:', error);
                }
            })();
        </script>
    </body>
    </html>
    `;
}

function processReactContent(content: string): string {
    // Remove import statements (they won't work in this isolated environment)
    let processedContent = content.replace(/import\s+.*?from\s+['"].*?['"];?/g, '');
    
    // Remove export statements but keep the component definitions
    processedContent = processedContent.replace(/export\s+default\s+/g, '');
    processedContent = processedContent.replace(/export\s+/g, '');
    
    // Add React and ReactDOM to the global scope if using JSX
    if (content.includes('jsx') || content.includes('<') && content.includes('>')) {
        processedContent = processedContent.replace(/import\s+React\s+from\s+['"]react['"];?/g, '');
        processedContent = processedContent.replace(/import\s+\{\s*.*?\s*\}\s+from\s+['"]react['"];?/g, '');
    }
    
    return processedContent;
}

function getNonReactHTML(): string {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>React Preview</title>
        <style>
            body {
                padding: 20px;
                font-family: Arial, sans-serif;
                background-color: #1e1e1e;
                color: #ffffff;
            }
            .message {
                color: #cccccc;
                border: 1px solid #444;
                padding: 20px;
                border-radius: 4px;
                background-color: #2d2d2d;
            }
        </style>
    </head>
    <body>
        <div class="message">
            <h2>Not a React File</h2>
            <p>This extension only previews React components (.jsx, .tsx, .js, or .ts files containing React components).</p>
        </div>
    </body>
    </html>
    `;
}

export function deactivate() {}