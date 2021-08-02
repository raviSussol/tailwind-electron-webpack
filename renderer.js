// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.
const React = require('react');
const { render } = require('react-dom');

require('./styles.css');

const App = () => (
    <>
        <h1 className="mt-3 text-4xl text-center text-blue-500 font-bold">Hello World!</h1>
    </>
);

render(<App />, document.getElementById('root'));
