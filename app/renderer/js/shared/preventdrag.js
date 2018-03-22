'use strict';

const preventDragandDrop = () => {
	document.addEventListener('dragover', event => {
		console.log(event);
		event.preventDefault();
	});
	document.addEventListener('drop', event => {
		console.log(event);
		event.preventDefault();
	});
};

preventDragandDrop();
