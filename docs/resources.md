# Resources used in AgroAyuda

The submission form asks us to list **every** external resource: NASA data, partner and other data, and any code, text or images we used, even when open source. By ticking "Confirm All Work is Original" we state this list is complete. **When you add a dependency, dataset, document, image, font, icon set or tool, add a row here in the same PR.** The web-results owner copies the two tables below into the form ("Link Text" = Name, "Link Url" = URL).

Rows marked _verify_ need the owner to confirm the licence on the provider's page before submission.

## NASA data and resources (form field "NASA Data")

| Name | URL | Used for | Owner |
|---|---|---|---|
| NASA POWER (Prediction Of Worldwide Energy Resources) Daily API | https://power.larc.nasa.gov/ | Daily rainfall and max temperature 1991-2020 per grid cell: rain layer, climate normals, canícula dry-spell risk | Data |
| NASA POWER documentation | https://power.larc.nasa.gov/docs/ | Parameters, grid and data source notes (MERRA-2) | Data |

## Partner and other data, documents and tools (form field "Space Agency Partner & Other Data")

### Data

| Name | URL | Used for | Licence | Owner |
|---|---|---|---|---|
| SoilGrids (ISRIC) | https://soilgrids.org/ | Soil clay, sand, pH and organic carbon at cell centers | _verify_ | Data |
| geoBoundaries (ADM1 Guatemala) | https://www.geoboundaries.org/ | Dry Corridor region outline | _verify_ | Data |
| OpenFreeMap tiles | https://openfreemap.org/ | Basemap tiles | _verify_ | Web map |
| OpenStreetMap data (via OpenFreeMap) | https://www.openstreetmap.org/copyright | Basemap content; attribution shown on the map | ODbL (see link) | Web map |

### Documents cited (crop values, rules)

| Name | URL | Used for | Owner |
|---|---|---|---|
| ICTA, El cultivo del maíz en Guatemala (2002) | https://www.icta.gob.gt/publicaciones/Maiz/cultivoMaizManejoAgronomico.pdf | Maize cycle days, Dry Corridor zone | Engine |
| CGIAR, Guía de buenas prácticas en el manejo del cultivo de frijol en Guatemala (2024) | https://cgspace.cgiar.org/server/api/core/bitstreams/9964fd5e-e848-4cf3-963b-1b2c72516e3c/content | Bean varieties, postrera sowing window | Engine |
| ICTA, Memoria de Labores 2019 | https://www.icta.gob.gt/publicaciones/Memoriasicta/Memoria%20labores%202019.pdf | Sorghum variety ICTA Rendidor | Engine |
| Rodríguez Sandoval, Aspectos socioeconómicos de los sistemas de cultivos con maicillos criollos (CEIBA, Zamorano) | https://revistas.zamorano.edu/CEIBA/article/download/986/930/2409 | Maize-maicillo relay calendar | Engine |
| FAO Irrigation and Drainage Paper 56, Table 22 | https://www.fao.org/4/x0490e/x0490e0e.htm | Root depth and depletion fraction per crop | Engine |
| FAO ECOCROP | https://ecocrop.apps.fao.org/ecocrop/srv/en/ | Crop cycle and tolerances (data sheets linked in `docs/crop-sources.md`) | Engine |
| Canícula reference [7] (Revista CYTES, USAC) | https://revistas.usac.edu.gt/index.php/cytes/article/download/1284/993/6098 | Dry-spell length N | Data |
| Canícula reference [8] (La canícula y su comportamiento en Guatemala, Revista YUAM) | https://revistayuam.com/wp-content/uploads/2025/10/La-canicula-y-su-comportamiento-en-Guatemala.pdf | Dry-spell length N | Data |

### Code: open-source libraries (versions from the lockfiles)

| Name | URL | Licence |
|---|---|---|
| FastAPI 0.162 | https://github.com/fastapi/fastapi | MIT |
| Uvicorn | https://uvicorn.dev | BSD-3-Clause |
| Pydantic 2.14 | https://github.com/pydantic/pydantic | MIT |
| DuckDB 2.0 | https://duckdb.org | MIT |
| httpx 0.28 | https://github.com/encode/httpx | BSD-3-Clause |
| pandas 3.1 | https://pandas.pydata.org | BSD-3-Clause |
| NumPy | https://numpy.org | BSD-3-Clause (and others, see package) |
| xarray | https://docs.xarray.dev | Apache-2.0 |
| rioxarray 0.24 | https://vylor.github.io/rioxarray/ | Apache-2.0 |
| earthaccess 0.19 (only if the data pipeline uses it) | https://github.com/earthaccess-dev/earthaccess | MIT |
| React 19 | https://react.dev | MIT |
| MapLibre GL JS 6 | https://maplibre.org | BSD-3-Clause |
| Recharts 3 | https://github.com/recharts/recharts | MIT |
| Vite 8 | https://vite.dev | MIT |
| TypeScript 7 | https://www.typescriptlang.org | Apache-2.0 |
| Vitest 5 | https://vitest.dev | MIT |
| Biome 2 | https://biomejs.dev | MIT OR Apache-2.0 |
| json-schema-to-typescript 16 | https://github.com/bcherny/json-schema-to-typescript | MIT |
| Testing Library (React) | https://github.com/testing-library/react-testing-library | MIT |
| Ruff, mypy, pytest (dev tools) | https://docs.astral.sh/ruff/ , https://mypy-lang.org , https://pytest.org | MIT |

### Tools and services

| Name | URL | Used for |
|---|---|---|
| Claude Code (Anthropic), SI | https://claude.com/claude-code | Coding and documentation assistant (see `docs/si-usage.md`) |
| _AI voice tool_, SI | _fill in_ | English voice-over of the demo video |
| _Other AI tools used by owners_, SI | _fill in_ | See `docs/si-usage.md` |
| GitHub and GitHub Actions | https://github.com | Repository and CI |
| Vercel | https://vercel.com | Web hosting |
| Render | https://render.com | API hosting |
| uv | https://docs.astral.sh/uv/ | Python packaging |

### Images, icons, fonts, audio

| Name | URL | Used for | Licence |
|---|---|---|---|
| Emoji icons (system font, Unicode 11 or earlier) | https://unicode.org/emoji/ | Crop icons next to text labels | System font of the viewer's device |
| _Add any image, icon set, font or music used in the app or video_ | | | |
