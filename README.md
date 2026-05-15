# The Day I'll Live

> _"Donner une forme physique à ce que les mots ne peuvent pas décrire."_

**The Day I'll Live** a pour objectif d'être un Metroidvania narratif développé avec **Babylon.js**. C'est une plongée interactive dans une phase de reconstruction personnelle, explorant le silence des émotions et le poids de l'absence.

Lien du jeu [disponible ici](https://luisjuniora.github.io/The-Day-I-ll-Live-BabylonJS/)

## L'Histoire

Depuis mon enfance, les émotions sont un territoire étranger. Je n'ai jamais vraiment réussi à les comprendre ou à les exprimer correctement. Grandir a été particulier : chaque moment difficile devenait une épreuve personnelle silencieuse. Comment expliquer ce que l'on ressent... quand on ne le comprend pas soi-même ?

En 2022, je me suis mis en couple. Après presque deux ans de relation, dont plus d'un an et demi à vivre ensemble, cette histoire s'est terminée par un adultère. Sur le coup, je ne me suis jamais senti aussi mal de ma vie. C’est une douleur inimaginable, que beaucoup connaissent ou connaitront, mais qui reste terrible. C'est difficile d'imaginer qu'un être humain puisse souffrir aussi intensément sans la moindre blessure physique. Tout se passe à l'intérieur, mais l'impact sur le physique est total.

Face à cela, mon vieux problème est revenu : comment mettre des mots sur ce chaos ? Comment réussir à chercher de l'aide quand on est incapable de formuler sa détresse ?

C'est là que c'est venu. Lorsque je fermais les yeux, je voyais un monde. Un monde triste, délabré, qui ne cherchait qu'à être reconstruit. En avançant dans la vie, en essayant de regagner confiance en moi, je voyais ce monde devenir peu à peu plus chaleureux.

The Day I'll Live est le reflet de ce processus. C’est un jeu que je souhaite développer, qui permettrais aux gens, peu importe leur niveau de détresse, de rêver d'un monde meilleur. Un monde où, même en partant du plus bas, on finit par se relever.

Un monde où l'on se dit enfin : "Aujourd'hui, je vivrai."

## Thème: Intelligence Artificielle

Le projet intègre plusieurs couches d'IA, allant de la prise de décision des ennemis à la gestion intelligente de la mise en scène.

### 1. IA de Comportement (Ennemis)

- **Utility AI & Scoring (L'Effroi)** : Utilisation d'un système de poids et de scores pour choisir l'action la plus cohérente selon la distance, le cooldown et l'état du joueur.

- **Raycasting & Perception** : Simulation d'une ligne de vue physique pour éviter les comportements "tricheurs" à travers les murs.

- **Steering & Scanning (Le Slime)** : Algorithme de scan environnemental pour trouver des points d'ancrage valides et éviter les répétitions de trajectoires.

### 2. IA de Structure (Architecture)

- **FSM (Finite State Machine)** : Le cerveau du jeu repose sur une machine à états finis. C’est elle qui gère la transition logique entre les phases (Idle, Chasse, Attaque, Mort), garantissant qu'une entité ne puisse pas effectuer deux actions contradictoires.

### 3. IA de Mise en scène (Caméra Intelligente)

Plutôt qu'un simple lien de parenté avec le joueur, la caméra utilise une logique prédictive :

- **Anticipation Bias** : La caméra "devine" où le joueur regarde en appliquant un décalage basé sur l'input et la vélocité.

- **Interpolation Adaptative** : Le système ajuste dynamiquement sa vitesse de réaction (Lerp) selon que le joueur tombe, saute ou regarde aux alentours, pour maintenir un cadrage optimal sans intervention manuelle.

### 🕹️ Gameplay & Contrôles

Le jeu a été pensé pour offrir une expérience de plateforme et de combat **100% au clavier**, idéale pour jouer confortablement sur n'importe quelle configuration.

- **En Jeu (In-Game) :** **100% Clavier**.
- **Configuration par défaut :** Le jeu est configuré par défaut pour les claviers **AZERTY**.
- **Déplacement :** Touches `ZQSD` ou flèches directionnelles.
- **Saut :** Barre `Espace`.
- **Remapping :** Toutes les touches sont **entièrement configurables** via le menu des options pour s'adapter à vos préférences ou aux claviers QWERTY.
- **Menus & Interface (GUI) :** La navigation dans les menus et les options nécessite l'usage de la souris (un **trackpad** est suffisant).

## Game Feel & Sensations de jeu

Au-delà des systèmes d'IA, un soin particulier a été apporté aux "petits détails" qui rendent les contrôles réactifs et gratifiants (Game Feel). L'objectif est d'offrir une précision chirurgicale malgré les contraintes du support web.

### 1. Mécaniques de plateforme "Pardonner & Réagir"

Pour éviter la frustration liée à la rigidité des moteurs physiques classiques, plusieurs aides au gameplay ont été codées :

- **Coyote Time** : Le joueur dispose d'une courte fenêtre de temps (quelques frames) pour sauter même s'il vient de quitter le bord d'une plateforme.
- **Input Buffer** : Si la touche de saut est pressée quelques instants avant de toucher le sol, l'action est mémorisée et déclenchée automatiquement à l'impact.
- **Ajustement de la gravité** : La vitesse de chute est légèrement augmentée par rapport à la vitesse de montée pour éviter l'effet "flottant" et donner une sensation de poids.

### 2. Dynamisme des combats et impacts

Chaque interaction doit être ressentie physiquement par le joueur :

- **Hitstop (Freeze Frame)** : Lors d'un coup porté ou reçu, le temps s'arrête pendant une fraction de seconde pour souligner l'impact et donner du "poids" à l'attaque.
- **Knockback (Recul)** : Chaque coup génère une force vectorielle qui projette l'ennemi (et le joueur), pour souligner l'impact.
- **Vitesse de réaction** : Les animations d'attaque possèdent des "startup frames" très courtes pour une réactivité instantanée à l'appui d'une touche.

## Défis Techniques & Contexte de production

- **Gestion du temps critique** : Ce projet a été mené en parallèle d'un émulateur GameBoy en Rust et d'autres projets scolaires et personnels chronophages, notamment l'implémentation d'un cryptosystème basé sur le **Learning With Errors (LWE)** en Rust.
- **WorldSkills 2026** : En plus de mes études, je prépare actuellement les finales mondiales des **WorldSkills à Shanghai** (septembre prochain) où je représenterai la France. Ce parcours d'excellence a limité le temps disponible pour le polish visuel, mais a renforcé ma rigueur technique.
- **Pipeline 3D** : Toute la map a été modélisée sur **Blender** par mes soins pour garantir une cohérence artistique totale avec le récit.
- **Optimisation Assets (SVG vers PNG)** : Initialement, j'avais prévu d'utiliser des SVG pour la netteté des assets. Cependant, pour des raisons de performances rendant le jeu injouable (70% du CPU utilisé par le refresh du layout pour une raison que j'ignore toujours), j'ai dû basculer sur des formats PNG pour garantir la fluidité du gameplay.

## Note de l'Auteur

Ce projet est une **Preuve de Concept (PoC)**. Mener ce développement en parallèle d'un émulateur GameBoy en Rust et d'un projet de groupe a été un défi temporel immense. Si l'esthétique actuelle est encore un "chantier", l'intention et les mécaniques de base sont là pour témoigner d'un projet qui me tient à cœur.
Certaines armes proviennent d'internet. D'autres sont faites par moi, ou en partie.

## Équipe

- **Luis-Junior ARAUJO DA COSTA** : Game Design, Code, Histoire, Musique (Projet Solo). Toute la map a été fait sur Blender par mes soins.
- **Gemini** : La plupart des assets visuels 2D sont générés pas IA. Je n'ai pas les compétences nécessaires. Beaucoup d'assets 3D sont fait par mes soins, bien qu'il y ait un monstre généré par IA.
