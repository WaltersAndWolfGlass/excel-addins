export const alphaNumCompare = new Intl.Collator("en", {
  numeric: true,
  sensitivity: "accent",
}).compare;
