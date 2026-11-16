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
| SoilGrids (ISRIC) | https://soilgrids.org/ | Soil clay, sand, pH and organic carbon at cell centers | CC BY 4.0 | Data |
| Loveland, P.; Webb, J. (2003). Is there a critical level of organic matter in the agricultural soils of temperate regions: a review. Soil & Tillage Research 70:1-18 | https://doi.org/10.1016/S0167-1987(02)00139-3 | Low-SOC threshold (2 % SOC = 20 g/kg) in `data/README.md` | Cited only (journal article) | Data |
| Musinguzi, P.; Tenywa, J. S.; Ebanyat, P.; Tenywa, M. M.; Mubiru, D. N.; Basamba, T. A.; Leip, A. (2013). Soil Organic Carbon Thresholds and Nitrogen Management in Tropical Agroecosystems: Concepts and Prospects. Journal of Sustainable Development 6(12):31-43 | https://doi.org/10.5539/jsd.v6n12p31 | Tropical review behind the low-SOC threshold (about 2 % SOC = 20 g/kg) in `data/README.md` | Cited only (journal article) | Data |
| Musinguzi, P. et al. (2016). Critical soil organic carbon range for optimal crop response to mineral fertiliser nitrogen on a Ferralsol. Experimental Agriculture | https://www.cambridge.org/core/journals/experimental-agriculture/article/critical-soil-organic-carbon-range-for-optimal-crop-response-to-mineral-fertiliser-nitrogen-on-a-ferralsol/68E8927BE333330514FE239BEF810250 | Tropical support for the low-SOC threshold (1.9-2.2 %) | Cited only (journal article) | Data |
| geoBoundaries (ADM1 Guatemala) | https://www.geoboundaries.org/ | Dry Corridor region outline | ODbL 1.0 (source OpenStreetMap, per the geoBoundaries GTM ADM1 metadata) | Data |
| geoBoundaries (ADM2 Guatemala, simplified, same commit 9469f09 as ADM1) | https://www.geoboundaries.org/ | Outline of the listed Dry Corridor municipalities | CC BY 3.0 IGO (source CONRED and OCHA FISS, per the geoBoundaries GTM ADM2 metadata) | Data |
| OpenFreeMap tiles | https://openfreemap.org/ | Basemap tiles | Free public instance, commercial use allowed; attribution required ("OpenFreeMap © OpenMapTiles, Data from OpenStreetMap", added by MapLibre); software MIT; map data from OpenStreetMap (ODbL) | Web map |
| OpenStreetMap data (via OpenFreeMap) | https://www.openstreetmap.org/copyright | Basemap content; attribution shown on the map | ODbL (see link) | Web map |

### Documents cited (crop values, rules)

| Name | URL | Used for | Owner |
|---|---|---|---|
| SESAN (2016), Plan de Respuesta para la Atención del Hambre Estacional 2016, Anexo 1, pp. 28-30 | https://portal.siinsan.gob.gt/wp-content/uploads/Plan-de-Respuesta-para-la-Atencion-del-Hambre-Estacional-2016.pdf | List of Dry Corridor municipalities added to the region (`MUNICIPALITIES`) | Data |
| ICTA, El cultivo del maíz en Guatemala (2002) | https://www.icta.gob.gt/publicaciones/Maiz/cultivoMaizManejoAgronomico.pdf | Maize cycle days, Dry Corridor zone | Engine |
| CGIAR, Guía de buenas prácticas en el manejo del cultivo de frijol en Guatemala (2024) | https://cgspace.cgiar.org/server/api/core/bitstreams/9964fd5e-e848-4cf3-963b-1b2c72516e3c/content | Bean varieties, postrera sowing window | Engine |
| ICTA, Memoria de Labores 2019 | https://www.icta.gob.gt/publicaciones/Memoriasicta/Memoria%20labores%202019.pdf | Sorghum variety ICTA Rendidor | Engine |
| ICTA, Boletín octubre 2022 (abonos verdes) | https://www.icta.gob.gt/publicaciones%202022/boletines/Bolet%C3%ADn%20octubre%202022.pdf | Gandul, mucuna and canavalia in the Dry Corridor | Engine |
| CECEG/USAC, study of southeastern Jutiapa | https://ceceg.usac.edu.gt/wp-content/uploads/2024/02/3.pdf | Traditional crops (crop list) | Lead |
| MAGA, Ajonjolí, Agro en Cifras 2016 | https://www.maga.gob.gt/sitios/diplan/download/informacion_del_sector/agro_en_cifras/2016/individuales/Ajonjoli%20Agro%20en%20Cifras%202016.pdf | Sesame in Guatemala (crop list) | Lead |
| USAC, INF-2011-33 (ayote, Jalapa) | https://digi.usac.edu.gt/bvirtual/informes/rapidos2011/INF-2011-33.pdf | Ayote in the milpa (crop list) | Lead |
| Buckles, Triomphe & Sain (1998), Cover Crops in Hillside Agriculture: Farmer Innovation with Mucuna (IDRC/CIMMYT) | https://idrc-crdi.ca/sites/default/files/openebooks/269-4/index.html | Mucuna cycle and flowering | Engine |
| EcuRed, Cajanus cajan (secondary) | https://www.ecured.cu/Cajanus_Cajan | Gandul cycle classes | Engine |
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
| Shapely 2.2 | https://github.com/shapely/shapely | BSD-3-Clause |
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
| Claude (Anthropic), claude.ai chat, SI | https://claude.ai | Chat assistant for code, tests and documentation (see `docs/si-usage.md`) |
| ElevenLabs, SI | https://elevenlabs.io | English AI-generated voice-over of the demo video |
| ChatGPT (OpenAI), SI | https://chatgpt.com | Logo generation (see `docs/si-usage.md`) |
| Gemini (Google), SI | https://gemini.google.com | Logo generation (see `docs/si-usage.md`) |
| GitHub and GitHub Actions | https://github.com | Repository and CI |
| Vercel | https://vercel.com | Web hosting |
| Render | https://render.com | API hosting |
| uv | https://docs.astral.sh/uv/ | Python packaging |
| VTracer (visioncortex) | https://github.com/visioncortex/vtracer | Converting the logo image to SVG |
| ImageMagick | https://imagemagick.org | Cleaning the logo image before vectorizing |

### Images, icons, fonts, audio

| Name | URL | Used for | Licence |
|---|---|---|---|
| Emoji icons (system font, Unicode 11 or earlier) | https://unicode.org/emoji/ | Crop icon fallback when a photo fails to load; "Nada" and priority icons | System font of the viewer's device |
| Maize photo: "Yellow corn.jpg" by Dalia fathallah (Wikimedia Commons) | https://commons.wikimedia.org/wiki/File:Yellow_corn.jpg | Crop photo `web/public/crops/maiz.webp` (cropped and resized to 96 px) | CC BY-SA 4.0; the adapted file keeps the same licence |
| Bean photo: "Black bean, frijol negro, feijão preto 1.jpg" by Ianm1121 (Wikimedia Commons) | https://commons.wikimedia.org/wiki/File:Black_bean,_frijol_negro,_feij%C3%A3o_preto_1.jpg | Crop photo `web/public/crops/frijol.webp` (cropped and resized to 96 px) | CC BY-SA 4.0; the adapted file keeps the same licence |
| Milpa photo: "Milpa in Quiche Guatemala.JPG" by Fabian Hanneforth (Wikimedia Commons) | https://commons.wikimedia.org/wiki/File:Milpa_in_Quiche_Guatemala.JPG | Crop photo `web/public/crops/maiz_frijol.webp` (cropped and resized to 96 px) | CC BY 2.5; the adapted file keeps the same licence |
| Sorghum photo: "Sorghum bicolor flowerhead1 NWS" by Harry Rose (Wikimedia Commons) | https://commons.wikimedia.org/wiki/File:Sorghum_bicolor_flowerhead1_NWS_-_Flickr_-_Macleay_Grass_Man.jpg | Crop photo `web/public/crops/maicillo.webp` (cropped and resized to 96 px) | CC BY 2.0; the adapted file keeps the same licence |
| Pigeon pea photo: "Cajanus cajan 92A21808….jpg" by Btcpg (Wikimedia Commons) | https://commons.wikimedia.org/wiki/File:Cajanus_cajan_92A21808-64E9-4DC6-A246-39C3F605DF9A.jpg | Crop photo `web/public/crops/gandul.webp` (cropped and resized to 96 px) | CC BY-SA 4.0; the adapted file keeps the same licence |
| Velvet bean photo: "Mucuna pruriens monkey tamarind 04.jpg" by Vijayanrajapuram (Wikimedia Commons) | https://commons.wikimedia.org/wiki/File:Mucuna_pruriens_monkey_tamarind_04.jpg | Crop photo `web/public/crops/mucuna.webp` (cropped and resized to 96 px) | CC BY-SA 4.0; the adapted file keeps the same licence |
| Jack bean photo: "Canavalia ensiformis MHNT.BOT.2013.22.55.jpg" by Roger Culos (Wikimedia Commons) | https://commons.wikimedia.org/wiki/File:Canavalia_ensiformis_MHNT.BOT.2013.22.55.jpg | Crop photo `web/public/crops/canavalia.webp` (cropped and resized to 96 px) | CC BY-SA 3.0; the adapted file keeps the same licence |
| Sesame photo: "Sesame plant (Sesamum indicum).jpg" by Sabaaya (Wikimedia Commons) | https://commons.wikimedia.org/wiki/File:Sesame_plant_(Sesamum_indicum).jpg | Crop photo `web/public/crops/ajonjoli.webp` (cropped and resized to 96 px) | CC BY-SA 4.0; the adapted file keeps the same licence |
| Squash photo: "Cucurbita moschata Bell group 'Anco' mature fruit on its vine.jpg" by Carina Quiñones (Wikimedia Commons) | https://commons.wikimedia.org/wiki/File:Cucurbita_moschata_Bell_group_%22Anco%22_mature_fruit_on_its_vine.jpg | Crop photo `web/public/crops/ayote.webp` (cropped and resized to 96 px) | CC BY 3.0; the adapted file keeps the same licence |
| AgroAyuda logo (SI-generated with ChatGPT and Gemini) | https://chatgpt.com · https://gemini.google.com | App and video logo | Generated by the team with AI; carries an "AI-generated" watermark |
