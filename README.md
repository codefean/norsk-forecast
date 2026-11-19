# Norsk Landslide Forecast

Interactive web map of landslide and rockfall hazard in Norway, built on open data from the Norwegian Water Resources and Energy Directorate (NVE).

Live site: https://www.norsklandslide.org

The site is in beta and currently covers Møre og Romsdal. It is a concept for making hazard data easier to explore, and a starting point for participatory mapping work with communities and planners.

## Features

- NVE hazard zones and historical landslide events, coloured by slide type, with popups for each feature
- Glacier outlines and glacial lakes with recorded outburst floods (toggle)
- 3D terrain with adjustable pitch and live elevation readout
- Search by place name or glacier

## Data

- NVE landslide hazard maps and the national landslide database (skredhendelser)
- Andreassen et al. (2022), inventory of Norway's glaciers and ice-marginal lakes, *Journal of Glaciology* 68(272)
- RGI Consortium (2023), Randolph Glacier Inventory v7.0

Hazard and glacier layers are served as Mapbox vector tilesets; lake centroids are loaded from `public/GLO_2019_WGS84.csv`.

## Running locally

Requires Node 18+.

```bash
npm install
npm start          # http://localhost:3000
npm run build      # production build in build/
npm run deploy     # publish build/ to the gh-pages branch
```

The Mapbox public token is set in `src/config.js`.

## Project structure

```
src/
  App.js              routes
  config.js           Mapbox token
  components/         header and footer
  pages/
    weatherMap.js     main map
    landslide.js      NVE hazard layers and popups
    glaciers.js       glacier layers
    lakes.js          glacial lakes
    search.js, MapLegend.js, LayersToggle.js, PitchControl.js, ...
```

## Author

Sean Fagan · sean.fagan@su.se
