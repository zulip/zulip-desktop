import {remote} from 'electron';
import fs from 'fs';
import path from 'path';

import SendFeedback from '@electron-elements/send-feedback';

const {app} = remote;

customElements.define('send-feedback', SendFeedback);
export const sendFeedback: SendFeedback = document.querySelector('send-feedback');
export const feedbackHolder = sendFeedback.parentElement;

// Make the button color match zulip app's theme
sendFeedback.customStylesheet = 'css/feedback.css';

// Customize the fields of custom elements
sendFeedback.title = 'Report Issue';
sendFeedback.titleLabel = 'Issue title:';
sendFeedback.titlePlaceholder = 'Enter issue title';
sendFeedback.textareaLabel = 'Describe the issue:';
sendFeedback.textareaPlaceholder = 'Succinctly describe your issue and steps to reproduce it...';

sendFeedback.buttonLabel = 'Report Issue';
sendFeedback.loaderSuccessText = '';

sendFeedback.useReporter('emailReporter', {
	email: 'support@zulip.com'
});

feedbackHolder.addEventListener('click', (event: Event) => {
	// Only remove the class if the grey out faded
	// part is clicked and not the feedback element itself
	if (event.target === event.currentTarget) {
		feedbackHolder.classList.remove('show');
	}
});

sendFeedback.addEventListener('feedback-submitted', () => {
	setTimeout(() => {
		feedbackHolder.classList.remove('show');
	}, 1000);
});

sendFeedback.addEventListener('feedback-cancelled', () => {
	feedbackHolder.classList.remove('show');
});

const dataDir = app.getPath('userData');
const logsDir = path.join(dataDir, '/Logs');
sendFeedback.logs.push(...fs.readdirSync(logsDir).map(file => path.join(logsDir, file)));
