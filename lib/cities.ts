export interface City {
  name: string;
  bbox: [number, number, number, number]; // [south, west, north, east]
}

export const CITIES: Record<string, City[]> = {
  TX: [
    { name: "Houston",     bbox: [29.52, -95.67, 30.11, -95.01] },
    { name: "Dallas",      bbox: [32.62, -97.00, 33.02, -96.55] },
    { name: "Austin",      bbox: [30.10, -97.94, 30.52, -97.57] },
    { name: "San Antonio", bbox: [29.27, -98.70, 29.71, -98.34] },
    { name: "Fort Worth",  bbox: [32.59, -97.48, 32.90, -97.19] },
  ],
  CO: [
    { name: "Denver",            bbox: [39.61, -105.10, 39.91, -104.77] },
    { name: "Colorado Springs",  bbox: [38.79, -104.93, 38.99, -104.69] },
    { name: "Aurora",            bbox: [39.62, -104.90, 39.77, -104.73] },
  ],
  AZ: [
    { name: "Phoenix", bbox: [33.29, -112.32, 33.72, -111.93] },
    { name: "Tucson",  bbox: [32.10, -111.07, 32.32, -110.84] },
    { name: "Mesa",    bbox: [33.35, -111.90, 33.49, -111.65] },
  ],
  FL: [
    { name: "Miami",        bbox: [25.70, -80.32, 25.86, -80.14] },
    { name: "Orlando",      bbox: [28.42, -81.51, 28.62, -81.32] },
    { name: "Tampa",        bbox: [27.87, -82.57, 28.07, -82.37] },
    { name: "Jacksonville", bbox: [30.10, -81.81, 30.50, -81.46] },
  ],
  CA: [
    { name: "Los Angeles",   bbox: [33.70, -118.67, 34.34, -118.15] },
    { name: "San Diego",     bbox: [32.53, -117.29, 32.97, -116.99] },
    { name: "San Francisco", bbox: [37.70, -122.52, 37.83, -122.35] },
    { name: "San Jose",      bbox: [37.12, -122.04, 37.47, -121.76] },
  ],
  PA: [
    { name: "Philadelphia", bbox: [39.86, -75.28, 40.14, -74.96] },
    { name: "Pittsburgh",   bbox: [40.36, -80.10, 40.50, -79.87] },
  ],
  WA: [
    { name: "Seattle",  bbox: [47.49, -122.44, 47.73, -122.23] },
    { name: "Spokane",  bbox: [47.61, -117.51, 47.74, -117.33] },
  ],
  GA: [
    { name: "Atlanta",  bbox: [33.64, -84.55, 33.89, -84.29] },
    { name: "Savannah", bbox: [31.95, -81.19, 32.12, -81.02] },
  ],
  IL: [
    { name: "Chicago", bbox: [41.64, -87.94, 42.02, -87.52] },
    { name: "Aurora",  bbox: [41.72, -88.39, 41.82, -88.24] },
  ],
  NJ: [
    { name: "Newark",      bbox: [40.69, -74.25, 40.77, -74.14] },
    { name: "Jersey City", bbox: [40.66, -74.10, 40.75, -74.03] },
    { name: "Trenton",     bbox: [40.20, -74.80, 40.24, -74.74] },
  ],
};
