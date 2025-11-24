export type ShipPropertyName =
  | "ship_location"
  | "ship_attention"
  | "ship_street_address"
  | "ship_city"
  | "ship_state"
  | "ship_zip";
export type ShipProperty = { name: ShipPropertyName; value: string };

export const ShipAddressPresets: {
  ShopA: Array<ShipProperty>;
  ShopB: Array<ShipProperty>;
  LaVerne: Array<ShipProperty>;
  LasVegas: Array<ShipProperty>;
} = {
  ShopA: [
    { name: "ship_location", value: "Walters & Wolf Shop A" },
    { name: "ship_attention", value: "" },
    { name: "ship_street_address", value: "41462 Boscell Road" },
    { name: "ship_city", value: "Fremont" },
    { name: "ship_state", value: "CA" },
    { name: "ship_zip", value: "94538" },
  ],
  ShopB: [
    { name: "ship_location", value: "Walters & Wolf Shop B" },
    { name: "ship_attention", value: "" },
    { name: "ship_street_address", value: "41777 Boyce Road" },
    { name: "ship_city", value: "Fremont" },
    { name: "ship_state", value: "CA" },
    { name: "ship_zip", value: "94538" },
  ],
  LaVerne: [
    { name: "ship_location", value: "Walters & Wolf Shop" },
    { name: "ship_attention", value: "" },
    { name: "ship_street_address", value: "1975 Puddingstone Drive" },
    { name: "ship_city", value: "La Verne" },
    { name: "ship_state", value: "CA" },
    { name: "ship_zip", value: "91750" },
  ],
  LasVegas: [
    { name: "ship_location", value: "Walters & Wolf Shop" },
    { name: "ship_attention", value: "" },
    { name: "ship_street_address", value: "5973 McLeod Drive" },
    { name: "ship_city", value: "Las Vegas" },
    { name: "ship_state", value: "NV" },
    { name: "ship_zip", value: "89120" },
  ],
};
