import {ipcRenderer as baseIpcRenderer} from "electron";

baseIpcRenderer.on("update-message", (_event, message: string) => {
	// 1. Inject Style
	const style = document.createElement('style');
	style.textContent = `
		body {
			background-color: #f5f7f9 !important;
			display: flex !important;
			align-items: center !important;
			justify-content: center !important;
			height: 100vh !important;
			margin: 0 !important;
			font-family: "Source Sans Pro", "Helvetica Neue", Helvetica, Arial, sans-serif !important;
		}
		#error-card {
			background: white;
			padding: 40px;
			width: 480px;
			border-radius: 8px;
			border-top: 6px solid #009688; /* Zulip Green */
			box-shadow: 0 4px 12px rgba(0,0,0,0.1);
			text-align: center;
		}
		#error-title {
			font-size: 22px;
			font-weight: 600;
			color: #333;
			margin-bottom: 20px;
		}
		#error-message {
			text-align: left;
			font-size: 14px;
			line-height: 1.6;
			background: #fcfcfc;
			padding: 20px;
			border: 1px solid #eee;
			border-radius: 4px;
			white-space: pre-wrap;
			color: #444;
			margin-bottom: 25px;
		}
		.reconnect-button {
			background-color: #009688;
			color: white;
			border: none;
			padding: 10px 24px;
			border-radius: 4px;
			font-weight: 600;
			cursor: pointer;
			font-size: 15px;
		}
		.reconnect-button:hover {
			background-color: #00796b;
		}
	`;
	document.head.appendChild(style);

	// 2. Inject HTML
	document.body.innerHTML = `
		<div id="error-card">
			<div id="error-title">Unable to connect</div>
			<div id="error-message">${message}</div>
			<button class="reconnect-button" onclick="window.location.reload()">Try again</button>
		</div>
	`;
});