// this hidden webview will be used to open pdf url and
// save it to user's computer without triggering a reload
// when navigating to pdf url to download it.
const hiddenWebView = document.createElement('webview');
hiddenWebView.classList.add('download-webview');
hiddenWebView.src = 'about:blank';
document.querySelector('#content').appendChild(hiddenWebView);

module.exports = hiddenWebView;
