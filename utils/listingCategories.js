/** Single source of truth for listing category enum + UI (labels + Font Awesome icons). */
const LISTING_CATEGORY_OPTIONS = [
    { value: "trending", label: "Trending", icon: "fa-solid fa-fire" },
    { value: "rooms", label: "Rooms", icon: "fa-solid fa-bed" },
    { value: "iconic-cities", label: "Iconic Cities", icon: "fa-solid fa-city" },
    { value: "mountains", label: "Mountains", icon: "fa-solid fa-mountain" },
    { value: "castles", label: "Castles", icon: "fa-solid fa-chess-rook" },
    { value: "amazing-pools", label: "Amazing Pools", icon: "fa-solid fa-person-swimming" },
    { value: "camping", label: "Camping", icon: "fa-solid fa-campground" },
    { value: "farms", label: "Farms", icon: "fa-solid fa-cow" },
    { value: "arctic", label: "Arctic", icon: "fa-regular fa-snowflake" },
    { value: "domes", label: "Domes", icon: "fa-solid fa-igloo" },
    { value: "boats", label: "Boats", icon: "fa-solid fa-sailboat" },
];

const LISTING_CATEGORY_VALUES = LISTING_CATEGORY_OPTIONS.map((o) => o.value);

module.exports = {
    LISTING_CATEGORY_OPTIONS,
    LISTING_CATEGORY_VALUES,
};
