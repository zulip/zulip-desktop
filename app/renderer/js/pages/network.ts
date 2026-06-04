import { ipcRenderer } from 'electron';

window.addEventListener('DOMContentLoaded', () => {
    const errorTextField = document.getElementById('error-text');
    const reconnectBtn = document.getElementById('reconnect');

    // Listen for message from index.ts
    ipcRenderer.on('update-message', (_event, message: string) => {
        if (errorTextField) {
            errorTextField.innerText = message;
        }
    });

    reconnectBtn?.addEventListener('click', () => {
        window.location.reload();
    });
});