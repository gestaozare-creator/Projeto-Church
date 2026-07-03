async function run() {
  const res = await fetch('https://raw.githubusercontent.com/giuliano-macedo/geodata-br-states/main/state.geojson');
  if (res.ok) {
    const text = await res.text();
    require('fs').writeFileSync('brazil-states.json', text);
    console.log("JSON size: ", text.length);
  } else {
    console.log("Failed:", res.status, res.statusText);
  }
}
run();
