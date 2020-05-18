import {remote} from 'electron';
import SendFeedback from '@electron-elements/send-feedback';

import path from 'path';
import fs from 'fs';

const {app} = remote;

customElements.define('send-feedback', SendFeedback);
export const sendFeedback: SendFeedback = document.querySelector('send-feedback');
export const feedbackHolder = sendFeedback.parentElement;

// Make the button color match zulip app's theme
sendFeedback.customStyles = `
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

/* eslint-disable no-multi-str */

// customize the fields of custom elements
sendFeedback.title = 'Report Issue';
sendFeedback.titleLabel = 'Issue title:';
sendFeedback.titlePlaceholder = 'Enter issue title';
sendFeedback.textareaLabel = 'Describe the issue:';
sendFeedback.textareaPlaceholder = 'Succinctly describe your issue and steps to reproduce it...\n\n\
---\n\
<!-- Please Include: -->\n\
- **Operating System**:\n\
  - [ ] Windows\n\
  - [ ] Linux/Ubuntu\n\
  - [ ] macOS\n\
- **Clear steps to reproduce the issue**:\n\
- **Relevant error messages and/or screenshots**:\n\
';

/* eslint-enable no-multi-str */

sendFeedback.buttonLabel = 'Report Issue';
sendFeedback.loaderSuccessText = '';

sendFeedback.useReporter('emailReporter', {
	email: 'support@zulipchat.com'
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
