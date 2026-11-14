# Crop sources for `crops.csv`

Starting material for the engine owner (package 02) to fill `data/catalog/crops.csv`. Every fact below was checked in the source on 2026-11-14; page or table references are given so you can cite them. **The tier values (low/medium/high) are still yours to decide**, with the source written in the `source` column. Do not copy a number from here without opening the source.

## Sources

| Key | Source | What it gives | Local? |
|---|---|---|---|
| CGIAR-FRIJOL | Morales, H.; Pérez, S. (2024). *Guía para buenas prácticas en el manejo del cultivo de frijol en Guatemala*. CGIAR AgriLAC Resiliente. https://cgspace.cgiar.org/server/api/core/bitstreams/9964fd5e-e848-4cf3-963b-1b2c72516e3c/content | ICTA bean varieties with days to harvest; postrera sowing window in the east; relay and intercrop with maize | yes (Guatemala) |
| ICTA-MAIZ | Fuentes López, M. R. (2002). *El cultivo del maíz en Guatemala: una guía para su manejo agronómico*. ICTA. https://www.icta.gob.gt/publicaciones/Maiz/cultivoMaizManejoAgronomico.pdf | Lowland maize varieties and hybrids with cycle days; Dry Corridor departments as the "limited moisture" zone | yes (Guatemala) |
| ICTA-SORGO | ICTA, Memoria de Labores 2019. https://www.icta.gob.gt/publicaciones/Memoriasicta/Memoria%20labores%202019.pdf | Sorghum variety ICTA Rendidor: photo-insensitive, white grain, for the "segunda" season | yes (Guatemala) |
| ZAMORANO-RELEVO | Rodríguez Sandoval, R. *Aspectos socioeconómicos de los sistemas de cultivos con maicillos criollos*. Revista CEIBA (Zamorano). https://revistas.zamorano.edu/CEIBA/article/download/986/930/2409 | Maize-maicillo relay and intercrop calendar (El Salvador, same Dry Corridor system) | regional (not Guatemala) |
| FAO-56 | Allen et al. (1998). FAO Irrigation and Drainage Paper 56, ch. 8, Table 22. https://www.fao.org/4/x0490e/x0490e0e.htm | Max effective root depth Zr and depletion fraction p per crop | no (generic) |
| ECOCROP | FAO ECOCROP data sheets (links per crop below) | Crop cycle range, climate and soil tolerances | no (generic) |

## Per crop

| `CropId` | Verified facts (source) | Suggested `local_source` |
|---|---|---|
| `maiz` | Lowland varieties: ICTA B-5 "can be bent at 80 days and harvested at 95", recommended for low or badly distributed rain, fits intercrop with bean and sorghum; ICTA A-6 cycle 90 days, can go in intercrop or relay with sesame or sorghum; hybrids HB-83 / HB-PROTICTA harvested at 120 days (ICTA-MAIZ, pp. 22-23). Jutiapa, Chiquimula, Jalapa, Zacapa and El Progreso are the "limited moisture" zone with recurrent drought (ICTA-MAIZ). Root depth 1.0-1.7 m, p = 0.55 (FAO-56 "Maize, Field (grain)"). ECOCROP: https://ecocrop.apps.fao.org/ecocrop/srv/en/dataSheet?id=2175 | true |
| `frijol` | ICTA Chortí 75 days, ICTA Patriarca 80, ICTA Ligero 65, ICTA Tahual 80 days to harvest (CGIAR-FRIJOL, variety table). In the east, sow between 15 August and 15 September; three systems: relay into maize, intercrop with maize, monocrop (CGIAR-FRIJOL, "Siembra"). Root depth 0.6-0.9 m, p = 0.45 (FAO-56 "Beans, dry and Pulses"). Fixes nitrogen. ECOCROP: https://ecocrop.apps.fao.org/ecocrop/srv/en/dataSheet?id=1668 | true |
| `maiz_frijol` | Intercrop: both sown at the same place and time (CGIAR-FRIJOL, "asocio"). Combine the `maiz` and `frijol` sources; document how you derived each tier. | true |
| `maicillo` | ICTA Rendidor: photo-insensitive white grain sorghum for "segunda" (ICTA-SORGO 2019); harvest 105-110 days per ICTA as reported by AGN (verify in an ICTA sheet before citing). Root depth 1.0-2.0 m, p = 0.55 (FAO-56 "Sorghum, grain"). ECOCROP: https://ecocrop.apps.fao.org/ecocrop/srv/en/dataSheet?id=48747 | true if you cite ICTA |
| `maiz_maicillo` | Relay: maize sown in May and bent in August, when maicillo is sown (ZAMORANO-RELEVO); creole maicillo is photoperiodic and grows mainly after the maize is bent. **Modelling decision needed (talk to the lead):** it occupies the field from May into the postrera, so it probably fits as a primera crop with a long `cycle_days` and `none` in postrera. | false (regional source) |
| `caupi` | ECOCROP: pods in 60-160 days, seed in 90-240 days; pH about 5.5-7.5. https://ecocrop.apps.fao.org/ecocrop/srv/en/dataSheet?id=10835. Root depth 0.6-1.0 m, p = 0.45 (FAO-56 "Green Gram and Cowpeas"). Fixes nitrogen. | false |
| `canavalia` | ECOCROP: bushy or climbing legume; uses include green manure. https://ecocrop.apps.fao.org/ecocrop/srv/en/dataSheet?id=609. Not in FAO-56 Table 22: say so in `source`. Fixes nitrogen. | false |
| `ajonjoli` | ECOCROP: cycle about 40-180 days. https://ecocrop.apps.fao.org/ecocrop/srv/en/dataSheet?id=1937. Root depth 1.0-1.5 m, p = 0.60 (FAO-56 "Sesame"). ICTA-MAIZ mentions sesame in relay or intercrop with maize. | false unless a Guatemalan source is found |
| `ayote` | *Cucurbita moschata*. ECOCROP: fruits harvested 80-140 days after sowing. https://ecocrop.apps.fao.org/ecocrop/srv/en/dataSheet?id=820. Root depth 1.0-1.5 m, p = 0.35 (FAO-56 "Pumpkin, Winter Squash"). | false |
| `none` | No source needed; values are fixed by Scoring v1 in `docs/spec.md`. | true (not a crop) |

## Notes

- **Calendar check:** `calendar.py` pins primera in May and postrera in September. CGIAR-FRIJOL gives 15 August - 15 September for postrera bean in the east, so September is consistent. With maize 120 days (May-Aug) and bean 75 days (Sep-Nov), the bare months are Dec-Apr = 5, matching the spec test.
- **p (depletion fraction):** a lower p means the crop suffers sooner when the soil dries. It can back `drought_tolerance` or `water_need`, but the tier cut-offs are your call: write them in `crops.csv`'s `source` text or in a comment at the top of the test.
- **Still missing:** a Guatemalan source for caupí, canavalia, ajonjolí and ayote, and a current ICTA sheet for maicillo days to harvest. ICTA's regional centre in Zacapa or MAGA extension material are the likely places.
