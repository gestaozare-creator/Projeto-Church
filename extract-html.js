const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { MapBrazil } = require('react-brazil-map');

try {
  const html = ReactDOMServer.renderToStaticMarkup(React.createElement(MapBrazil, null));
  const fs = require('fs');
  fs.writeFileSync('rendered-map.html', html);
  console.log("HTML length:", html.length);
} catch (e) {
  console.log(e);
}
