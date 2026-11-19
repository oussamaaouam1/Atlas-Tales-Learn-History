export const continentArt = {
  africa: require('../../../assets/map/placeholder-africa.webp'),
  europe: require('../../../assets/map/placeholder-europe.webp'),
  asia: require('../../../assets/map/placeholder-asia.webp'),
  northAmerica: require('../../../assets/map/placeholder-north-america.webp'),
  southAmerica: require('../../../assets/map/placeholder-south-america.webp'),
  oceania: require('../../../assets/map/placeholder-oceania.webp'),
  antarctica: require('../../../assets/map/placeholder-antarctica.webp'),
} as const;

export const continentAspect = {
  africa: 793 / 850,
  europe: 850 / 785,
  asia: 850 / 739,
  northAmerica: 816 / 850,
  southAmerica: 583 / 850,
  oceania: 850 / 761,
  antarctica: 850 / 749,
} as const;
