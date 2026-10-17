// One vector source for the website, downloadable logos, icons and social card.
export const brandColors = {
  blue: "#307FE9",
  sky: "#88C2FF",
  navy: "#172F4C",
  night: "#0B1220",
  white: "#F5F8FD",
};

export const shieldGradients = [
  { name: "outer", from: "#98CEFF", to: "#78B5F6" },
  { name: "blue", from: "#368AF5", to: "#2873DB" },
  { name: "navy", from: "#203D59", to: "#10233E" },
];

export const shieldLayers = [
  {
    d: "M50 2C66 9.5 83 14.3 98 16.7V54C98 82 79 105 50 118C21 105 2 82 2 54V16.7C17 14.3 34 9.5 50 2Z",
    gradient: "outer",
  },
  {
    d: "M50 17C63 23 75 26.7 87.5 29V59C87.5 83.5 74 99.5 50 109.5C26 99.5 12.5 83.5 12.5 59V29C25 26.7 37 23 50 17Z",
    fill: "#1E5CA6",
    opacity: 0.22,
  },
  {
    d: "M50 13.5C63 19.5 75 23.2 87.5 25.5V55.5C87.5 80 74 96 50 106C26 96 12.5 80 12.5 55.5V25.5C25 23.2 37 19.5 50 13.5Z",
    gradient: "blue",
  },
  {
    d: "M50 28C59 32.5 68 35.2 80 37V59C80 78 69 92 50 101C31 92 20 78 20 59V37C32 35.2 41 32.5 50 28Z",
    fill: "#10233E",
    opacity: 0.24,
  },
  {
    d: "M50 24.8C59 29.3 68 32 77.5 33.8V55.8C77.5 74 67 88 50 97C33 88 22.5 74 22.5 55.8V33.8C32 32 41 29.3 50 24.8Z",
    gradient: "navy",
  },
  { d: "M43.5 48.5L56.5 56V60L43.5 67.5V63L52.5 58L43.5 53Z", fill: "#FFFFFF" },
];

export function shieldMarkup(prefix = "guardian") {
  const defs = shieldGradients
    .map(
      ({ name, from, to }) =>
        `<linearGradient id="${prefix}-${name}" x1="10" y1="10" x2="90" y2="110" gradientUnits="userSpaceOnUse"><stop stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient>`,
    )
    .join("");
  const paths = shieldLayers
    .map(
      ({ d, gradient, fill, opacity }) =>
        `<path d="${d}" fill="${gradient ? `url(#${prefix}-${gradient})` : fill}"${opacity ? ` opacity="${opacity}"` : ""}/>`,
    )
    .join("");
  return `<defs>${defs}</defs>${paths}`;
}
