// Renders a donut chart of the languages used in the LeetCode repository,
// styled like the cards from github-profile-summary-cards (github_dark theme).
import fs from "node:fs";

const REPO = "sinan-nis/LeetCode";
const OUTPUT = "stats/leetcode-languages.svg";
const COLORS = {
  Python: "#3572A5", TypeScript: "#3178c6", JavaScript: "#f1e05a", Java: "#b07219",
  "C++": "#f34b7d", C: "#555555", Go: "#00ADD8", Rust: "#dea584", Kotlin: "#A97BFF",
};
const FALLBACK_COLOR = "#8b949e";

async function fetchLanguages() {
  const response = await fetch(`https://api.github.com/repos/${REPO}/languages`, {
    headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, "User-Agent": "profile-stats" },
  });
  if (!response.ok) throw new Error(`GitHub API ${response.status}`);
  return response.json();
}

function arc(start, end, outer = 60, inner = 35) {
  const point = (angle, radius) => [radius * Math.sin(angle), -radius * Math.cos(angle)];
  const large = end - start > Math.PI ? 1 : 0;
  const [x1, y1] = point(start, outer);
  const [x2, y2] = point(end, outer);
  const [x3, y3] = point(end, inner);
  const [x4, y4] = point(start, inner);
  return `M${x1},${y1}A${outer},${outer},0,${large},1,${x2},${y2}L${x3},${y3}A${inner},${inner},0,${large},0,${x4},${y4}Z`;
}

function render(languages) {
  const total = Object.values(languages).reduce((sum, bytes) => sum + bytes, 0) || 1;
  const items = Object.entries(languages)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, bytes]) => ({ name, share: bytes / total, color: COLORS[name] ?? FALLBACK_COLOR }));

  const legend = items.map((item, i) => {
    const y = 18 + i * 25.2;
    return `<rect y="${y}" width="14" height="14" fill="${item.color}" stroke="#0d1117"/>` +
      `<text x="16.8" y="${y + 12}" style="fill:#77909c;font-size:14px">${item.name} ${(item.share * 100).toFixed(1)}%</text>`;
  }).join("");

  let angle = 0;
  const slices = items.map((item) => {
    // A full circle cannot be drawn with one arc, so cap a single 100% slice just below 2π.
    const sweep = Math.min(item.share * 2 * Math.PI, 2 * Math.PI - 0.0001);
    const path = `<path d="${arc(angle, angle + sweep)}" style="fill:${item.color};stroke-width:2px" stroke="#0d1117"/>`;
    angle += sweep;
    return path;
  }).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="340" height="200" viewBox="0 0 340 200"><style>*{font-family:'Segoe UI',Ubuntu,"Helvetica Neue",Sans-Serif}</style>` +
    `<rect x="1" y="1" rx="5" ry="5" height="99%" width="99.4%" stroke="#2e343b" stroke-width="1" fill="#0d1117"/>` +
    `<text x="30" y="40" style="font-size:22px;fill:#0366d6">LeetCode Languages</text>` +
    `<g transform="translate(0,40)"><g transform="translate(40,0)">${legend}</g><g transform="translate(230,80)">${slices}</g></g></svg>`;
}

const languages = process.env.LANGUAGES_JSON ? JSON.parse(process.env.LANGUAGES_JSON) : await fetchLanguages();
fs.mkdirSync("stats", { recursive: true });
fs.writeFileSync(OUTPUT, render(languages));
console.log(`Wrote ${OUTPUT}:`, languages);
