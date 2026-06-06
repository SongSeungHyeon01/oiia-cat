window.api.getSettings().then(s => console.log('settings loaded:', s));
window.api.onKeypress(() => console.log('keypress received'));
