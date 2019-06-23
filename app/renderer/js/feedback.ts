import { remote } from 'electron';
import path from 'path';
import fs from 'fs';
import SendFeedback from '@electron-elements/send-feedback';

const { app } = remote;

type SendFeedbackType = typeof SendFeedback;

// make the button color match zulip app's theme
SendFeedback.customStyles = `
button:hover, button:focus {
  border-color: #4EBFAC;
  color: #4EBFAC;
}

button:active {
  background-color: #f1f1f1;
  color: #4EBFAC;
}

button {
  background-color: #4EBFAC;
  border-color: #4EBFAC;
}
`;

customElements.define('send-feedback', SendFeedback);
const sendFeedback: SendFeedbackType = document.querySelector('send-feedback');
const feedbackHolder = sendFeedback.parentElement;

// customize the fields of custom elements
sendFeedback.title = 'Report Issue';
sendFeedback.titleLabel = 'Issue title:';
sendFeedback.titlePlaceholder = 'Enter issue title';
sendFeedback.textareaLabel = 'Describe the issue:';
sendFeedback.textareaPlaceholder = 'Succinctly describe your issue and steps to reproduce it...';
sendFeedback.buttonLabel = 'Report Issue';
sendFeedback.loaderSuccessText = '';

sendFeedback.useReporter('emailReporter', {
	email: 'akash@zulipchat.com'
});

feedbackHolder.addEventListener('click', (e: Event) => {
	// only remove the class if the grey out faded
	// part is clicked and not the feedback element itself
	if (e.target === e.currentTarget) {
		feedbackHolder.classList.remove('show');
	}
});

sendFeedback.addEventListener('feedback-submitted', () => {
	setTimeout(() => {
		feedbackHolder.classList.remove('show');
	}, 1000);
});

const dataDir = app.getPath('userData');
const logsDir = path.join(dataDir, '/Logs');
sendFeedback.logs.push(...fs.readdirSync(logsDir).map(file => path.join(logsDir, file)));

export = {
	feedbackHolder,
	sendFeedback
};
