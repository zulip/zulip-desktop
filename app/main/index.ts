import { BrowserWindow, app, ipcMain } from "electron";
import * as remoteMain from "@electron/remote/main";
import path from "node:path";

let mainWindow: BrowserWindow;

// This is the EXACT UI and Message injected as a Data URL
const getErrorHtml = (domain: string) => {
  const message = `⚠️ We couldn’t reach ${domain}. Don’t worry! Here’s what you can try:

🌐 Open the URL in your web browser.
🛠️ Check your proxy settings if needed.
📦 Make sure the server is running Zulip version 1.6 or newer.
🔒 Verify the SSL certificate is valid and properly installed.

💡 Tip: Stay connected and try again if the problem persists.

For more guidance, visit:
🔗 https://zulip.readthedocs.io/en/stable/production/ssl-certificates.html`;

  return `
    <html>
      <head>
        <style>
          body { 
            background: #f4f7f6; display: flex; align-items: center; 
            justify-content: center; height: 100vh; margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          }
          .card {
            background: white; padding: 40px; width: 450px; 
            border-radius: 12px; border-top: 10px solid #009688; 
            box-shadow: 0 15px 35px rgba(0,0,0,0.1); text-align: center;
          }
          h1 { color: #009688; font-size: 24px; margin-bottom: 20px; }
          .message { 
            text-align: left; background: #f9fafb; padding: 20px; 
            border-radius: 8px; border: 1px solid #eee; 
            white-space: pre-wrap; font-size: 14px; line-height: 1.6; color: #444;
          }
          button {
            margin-top: 25px; background: #009688; color: white; border: none; 
            padding: 12px 30px; border-radius: 6px; font-weight: bold; cursor: pointer;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>Unable to connect</h1>
          <div class="message">${message}</div>
          <button onclick="window.location.reload()">Try Again</button>
        </div>
      </body>
    </html>
  `;
};

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 720,
    backgroundColor: "#f4f7f6", // Prevents white flash before load
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Load a URL - if this fails, the listener below catches it
  mainWindow.loadURL("https://this-is-a-fake-domain-to-test-ui.com");

  mainWindow.webContents.on("did-fail-load", (event, errorCode) => {
    if (errorCode === -3) return;

    const htmlContent = getErrorHtml("your Zulip server");
    
    // FIXED: Wrapped the data URL in backticks and quotes
    mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);
  });
}

app.whenReady().then(() => {
  remoteMain.initialize();
  createMainWindow();
});