'use strict';

// This is a security fix. Following function prevents drag and drop event in the app
// so that attackers can't execute any remote code within the app
// It doesn't affect the compose box so that users can still
// use drag and drop event to share files etc

function preventDragAndDrop(): void {
	const preventEvents = ['dragover', 'drop'];
	preventEvents.forEach(dragEvents => {
		document.addEventListener(dragEvents, event => {
			event.preventDefault();
		});
	});
}

preventDragAndDrop();
