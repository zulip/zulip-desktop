'use strict';

// This is a security fix. Following function prevents drag and drop event in the app
// so that attackers can't execute any remote code within the app
// It doesn't affect the compose box so that users can still
// use drag and drop event to share files etc

const preventDragAndDrop = () => {
	document.addEventListener('dragover', event => {
		event.preventDefault();
	});
	document.addEventListener('drop', event => {
		event.preventDefault();
	});
};

preventDragAndDrop();
