# Changelog

## [1.3.0](https://github.com/Elessiah-sTeam/c15-tour-webapp/compare/v1.2.0...v1.3.0) (2026-07-10)


### Features

* remplace l'icône Vite par les favicons du logo C15 Tour
* met en évidence les segments hors bornes de durée au lieu de bloquer la sauvegarde ([#165](https://github.com/Elessiah-sTeam/c15-tour-webapp/issues/165))
* partage du code organisateur en plus du code membre


### Bug Fixes

* corrige les remarques Sonar a11y et contraste sur l'alerte de durée
* garde les bornes de segment réactives sous la mémoïsation React Compiler
* annote le type de retour de flatMap pour que le build tsc passe

## [1.2.0](https://github.com/Elessiah-sTeam/c15-tour-webapp/compare/v1.1.0...v1.2.0) (2026-06-17)


### Features

* adresse réelle au clic sur la carte (géocodage inverse) ([#143](https://github.com/Elessiah-sTeam/c15-tour-webapp/issues/143)) ([b14785b](https://github.com/Elessiah-sTeam/c15-tour-webapp/commit/b14785b05ab226a8f30688ebf6f73986a656d61d))
* Ajout d'un bouton d'export dans l'historique des convois ([9321fcf](https://github.com/Elessiah-sTeam/c15-tour-webapp/commit/9321fcf2d845eaa4c98adcb3fa0f1bc3925a2b20))
* Ajout d'un bouton d'export dans l'historique des convois ([4703dad](https://github.com/Elessiah-sTeam/c15-tour-webapp/commit/4703dad5da1920b710e31353ee68ecc3af88a5f4))
* centralise backend URL via VITE_BACKEND_URL env var ([#140](https://github.com/Elessiah-sTeam/c15-tour-webapp/issues/140)) ([4a7f460](https://github.com/Elessiah-sTeam/c15-tour-webapp/commit/4a7f460212672ffa8a0c0d014804599bc36f097a))
* export unifié GPX/PDF et points de passage au PDF ([#86](https://github.com/Elessiah-sTeam/c15-tour-webapp/issues/86) [#141](https://github.com/Elessiah-sTeam/c15-tour-webapp/issues/141) [#142](https://github.com/Elessiah-sTeam/c15-tour-webapp/issues/142)) ([085cecd](https://github.com/Elessiah-sTeam/c15-tour-webapp/commit/085cecd763441f814a4f97f9d7064670c36f8445))
* ligne pause entre les segments ([#144](https://github.com/Elessiah-sTeam/c15-tour-webapp/issues/144)) ([8eb18e2](https://github.com/Elessiah-sTeam/c15-tour-webapp/commit/8eb18e2d18557943cf2e1a8222c5dee91cabe860))
* suppression de compte depuis les paramètres ([#145](https://github.com/Elessiah-sTeam/c15-tour-webapp/issues/145)) ([b3da8f8](https://github.com/Elessiah-sTeam/c15-tour-webapp/commit/b3da8f8f8b578c4ba53f4844ca82eab789e122c8))


### Bug Fixes

* correction dragNdrop + ajout temps de pause et horaires sur les étapes ([b0b09eb](https://github.com/Elessiah-sTeam/c15-tour-webapp/commit/b0b09eb1d4b287dd8f61eabed828fd2bc4d20b4d))
* correction dragNdrop + ajout temps de pause et horaires sur les étapes ([6fedad2](https://github.com/Elessiah-sTeam/c15-tour-webapp/commit/6fedad2606a619fba2c7f75df804bed25c3a639a))
* Correction map pdf ([7c7fbd3](https://github.com/Elessiah-sTeam/c15-tour-webapp/commit/7c7fbd3866eda41be4fa87fc5c655ccadad9eded))
* Correction map pdf ([9d25609](https://github.com/Elessiah-sTeam/c15-tour-webapp/commit/9d25609c5d4326fe151dd9f2344b70df5da75b75))
* géocodage via proxy /nominatim (CORS/403 OSM) ([#143](https://github.com/Elessiah-sTeam/c15-tour-webapp/issues/143)) ([0a7f84f](https://github.com/Elessiah-sTeam/c15-tour-webapp/commit/0a7f84f67218483676c2b11d21412bfbf8f9fb84))
* marqueurs des points de passage sur la carte du PDF ([#142](https://github.com/Elessiah-sTeam/c15-tour-webapp/issues/142)) ([ede0e4f](https://github.com/Elessiah-sTeam/c15-tour-webapp/commit/ede0e4fa630ad6e517867a5df59fb2a225781f27))
* noms d'étape restent les coordonnées GPS au clic carte ([#143](https://github.com/Elessiah-sTeam/c15-tour-webapp/issues/143)) ([db52f68](https://github.com/Elessiah-sTeam/c15-tour-webapp/commit/db52f68973fae2b330da820f2ca70c7df3a37329))
* remove unused catch bindings in ConvoyThumbnail and gpx ([d6f8eb5](https://github.com/Elessiah-sTeam/c15-tour-webapp/commit/d6f8eb522c54f276b20bfa240ae1dae0ea4e8af3))
* replace console.error with pushErrorToast across production code ([167a64c](https://github.com/Elessiah-sTeam/c15-tour-webapp/commit/167a64c0185cc59fd6519201a5b10c6acb26195e))
* resolve SonarQube S106 console output violations ([f0ccabf](https://github.com/Elessiah-sTeam/c15-tour-webapp/commit/f0ccabf3e37bd23a46d7f3b39393fb14d7f22bc8))
* saisie d'espaces dans les noms de segment/étape ([#146](https://github.com/Elessiah-sTeam/c15-tour-webapp/issues/146)) ([9348bb9](https://github.com/Elessiah-sTeam/c15-tour-webapp/commit/9348bb92aff17ffb6f4c9f26196e4b93c09e66ee))
* tous les points de passage en colonnes dans le bloc détails PDF ([#142](https://github.com/Elessiah-sTeam/c15-tour-webapp/issues/142)) ([60464e5](https://github.com/Elessiah-sTeam/c15-tour-webapp/commit/60464e52b17a446081c60bfeac9190f0efadb876))

## [1.1.0](https://github.com/Elessiah-sTeam/c15-tour-webapp/compare/v1.0.1...v1.1.0) (2026-05-19)


### Features

* ajout des heures sur chaque étape ([6119b07](https://github.com/Elessiah-sTeam/c15-tour-webapp/commit/6119b07ae15d71ee5b73c64c4a1e7a237f4a8e23))
* publish Docker image to GHCR on release ([b630c31](https://github.com/Elessiah-sTeam/c15-tour-webapp/commit/b630c319e0019ce4c5aad747c8d2394a70eb6721))
* publish Docker image to GHCR on release ([18ad1ed](https://github.com/Elessiah-sTeam/c15-tour-webapp/commit/18ad1ed46c47ce1b6c87d21d8353d59ec23eb90e))

## [1.0.1](https://github.com/Elessiah-sTeam/c15-tour-webapp/compare/v1.0.0...v1.0.1) (2026-05-19)


### Bug Fixes

* move snapshot creation into release workflow job ([3cfa8ea](https://github.com/Elessiah-sTeam/c15-tour-webapp/commit/3cfa8ea29d4d7773463d18dd07b296db1c8497a4))
* move snapshot creation into release workflow job ([c8e2444](https://github.com/Elessiah-sTeam/c15-tour-webapp/commit/c8e244446c8211adf9b100494de03be878e92302))

## 1.0.0 (2026-05-19)


### Bug Fixes

* correction sur l'export pdf ([448286c](https://github.com/Elessiah-sTeam/c15-tour-webapp/commit/448286c1b7bbb30a003fb7a5c4d8c436b67dbaac))

## Changelog

Toutes les versions notables de ce projet seront documentées dans ce fichier.

Le format suit Keep a Changelog et la numérotation suit Semantic Versioning.
