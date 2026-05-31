# 🍺 BrewBuddyNG

A friendly brewing companion for homebrewers and small breweries. Plan recipes, track your brew
days, and use a full set of brewing calculators — all from your web browser.

> [!WARNING]
>
> ## ⚠️ DISCLAIMER — Copilot rebuild, not production-tested
>
> **This application was rebuilt entirely with GitHub Copilot and has NOT been tested properly.**
> It is an experimental reimplementation of the original desktop program. Calculations may contain
> errors. Data may be lost. **Do not use this for critical brewing decisions or in production
> environments without independent verification.** Contributions, bug reports, and test coverage
> are very welcome.
>
> **Source:** <https://github.com/JoostVoskuil/brewbuddyng>

> [!IMPORTANT]
> **This application is a complete rebuild of the original
> [BrewBuddyOrg/BrewBuddy](https://github.com/BrewBuddyOrg/BrewBuddy)** (formerly **BrouwHulp** by
> **Adrie Otte**), a Free Pascal/Lazarus desktop program. It was rebuilt as a modern web app
> **entirely with GitHub Copilot**, which translated the original Pascal source — its brewing
> calculations, data models, and features — into TypeScript/Vue. See
> [Attribution](#-attribution) for details.
> New here and not a programmer? Jump straight to
> [Getting started (the easy way)](#-getting-started-the-easy-way).

## What can it do?

### Recipe management

- **All-grain & extract recipes** — Build recipes with fermentables, hops, yeasts, miscellaneous
  ingredients, and water additions.
- **Live calculations** — OG, FG, IBU, colour (EBC/SRM), ABV, and grain bill percentages update as
  you type.
- **Per-hop IBU contribution** — See each hop addition's individual bitterness contribution
  directly in the ingredient list.
- **Ingredient stock awareness** — Inventory levels from your databases are shown next to recipe
  ingredients, highlighting when you're short.
- **Grain bill breakdown** — Percentage of grist per fermentable with a running total.
- **Beer-style targeting** — Assign a BJCP style and compare your recipe against its style ranges.
- **Sorting & search** — Sort recipes by name, type, beer style, OG, IBU, or ABV.
- **Export & share** — Export to BeerXML, or copy a recipe as a forum post or as HTML.

### Brew-day tracking

- **Brew log** — Track each brew through its lifecycle: planned, brewing, fermenting, conditioning,
  and completed.
- **Measurements** — Record actual OG, FG, volumes, temperatures, and gravity readings over time.
- **Checklists & notes** — Brew-day checklists, fermentation tracking, and tasting notes.
- **Sorting** — Sort brews by name, brew date, status, or beer style.

### Ingredient & profile databases

- **Editable databases** — Fermentables, hops, yeasts, miscellaneous ingredients, water profiles,
  equipment, BJCP beer styles, and mash schedules.
- **Inventory & cost** — Track stock on hand and cost per ingredient.
- **Searchable** — Quickly filter every database, all seeded with standard reference data.

### Brewing calculators

- **Hop / IBU calculator** — IBU from a hop bill, or the hop amount needed for a target IBU
  (multiple utilisation methods: Tinseth, Rager, Garetz, Daniels, Mosher, Noonan).
- **Yeast starter** — Cell-count growth and propagation steps.
- **Water wizard** — Mineral/salt additions to match a target water profile.
- **Mash pH** — Acid or base additions to reach a target mash pH.
- **Refractometer** — Brix-to-specific-gravity conversion (with fermentation correction).
- **Hydrometer correction** — Temperature correction for gravity readings.
- **Infusion / decoction** — Strike-water and infusion/decoction volume calculator.
- **Kettle volume** — Volume from measured liquid height.
- **Carbonation** — CO₂ pressure and priming for target carbonation.
- **Priming sugar** — Priming sugar for bottle conditioning.
- **Dilution** — Adjust gravity by adding water or sugar.
- **Blending** — Resulting OG of blended worts.
- **Hop aging** — Alpha-acid loss over storage time.
- **Brew timer** — Countdown and stopwatch for the boil and additions.

### Analysis & reporting

- **Efficiency tracking** — Mash and brewhouse efficiency over your brewing history.
- **Statistics & comparison charts** — Visualise ingredients usage and compare brews.
- **Histograms** — See how often a parameter (OG, FG, ABV, efficiency, attenuation, rating,
  carbonation) falls into each value range, by count or percentage, with adjustable intervals.
- **X-Y curve-fit graphs** — Plot any two brew parameters against each other and fit a
  linear, polynomial, exponential or power relation, with the equation and r² goodness-of-fit.
- **Print / PDF export** — Print a clean recipe sheet, brew-day sheet or analysis chart, or save
  it as a PDF straight from your browser.

### Import / export

- **BeerXML import/export** — Exchange recipes in the industry-standard BeerXML format.
- **ProMash import** — Import recipes from ProMash text "Recipe Report" exports.
- **Forum & HTML copy** — Copy a recipe to the clipboard as a forum (BBCode) or HTML table.

### Settings & platform

- **Configurable calculations** — Choose IBU and colour methods, and your preferred temperature,
  gravity, and colour units.
- **Multilingual** — Dutch (primary) and English interface.
- **Runs anywhere** — Single Docker container with persistent SQLite storage.

---

## 🚀 Getting started (the easy way)

This guide is written for people who have **never used a terminal before**. You only need to copy
and paste a few commands. The whole thing takes about 10 minutes.

### Step 1 — Install Docker Desktop

Docker is a free program that runs BrewBuddyNG for you in a self-contained box, so you don't have to
install databases or programming tools yourself.

1. Go to <https://www.docker.com/products/docker-desktop/>.
2. Download the version for your computer (Windows or Mac).
3. Open the downloaded file and follow the installer.
4. Start **Docker Desktop** and wait until it says it is running (the whale icon stops animating).

### Step 2 — Create a data folder

Create a folder on your computer where BrewBuddyNG will store your data. For example:

- **Windows:** `C:\BrewBuddy`
- **Mac / Linux:** `~/brewbuddy-data`

### Step 3 — Start BrewBuddyNG

Open a terminal and run this single command (replace the path with your folder from Step 2):

**Mac / Linux:**

```bash
docker run -d \
  --name brewbuddy \
  -p 3000:3000 \
  -v ~/brewbuddy-data:/data \
  --restart unless-stopped \
  ghcr.io/joostvoskuil/brewbuddyng:latest
```

**Windows (Command Prompt):**

```cmd
docker run -d ^
  --name brewbuddy ^
  -p 3000:3000 ^
  -v C:\BrewBuddy:/data ^
  --restart unless-stopped ^
  ghcr.io/joostvoskuil/brewbuddyng:latest
```

Docker will download the pre-built image automatically — no source code needed. This takes a minute or two the first time.

### Step 4 — Open it in your browser

Go to **<http://localhost:3000>**. That's it — BrewBuddyNG is running on your own computer. 🎉

### Stopping and starting again

- **To stop:** run `docker stop brewbuddy` in a terminal.
- **To start again later:** run `docker start brewbuddy` — Docker will use the image it already downloaded.

### Updating to a newer version

New versions are published regularly. Updating downloads the latest image and restarts the
container. **Your data is safe** — recipes, brews, and settings live in the `~/brewbuddy-data`
folder (or your Windows folder), not inside the container, so they survive updates.

**If you started BrewBuddyNG with `docker run` (the steps above):**

```bash
# 1. Download the newest version
docker pull ghcr.io/joostvoskuil/brewbuddyng:latest

# 2. Stop and remove the old container (your data folder is untouched)
docker stop brewbuddy
docker rm brewbuddy

# 3. Start again with the same command you used in Step 3
docker run -d \
  --name brewbuddy \
  -p 3000:3000 \
  -v ~/brewbuddy-data:/data \
  --restart unless-stopped \
  ghcr.io/joostvoskuil/brewbuddyng:latest
```

On Windows, use your folder (e.g. `-v C:\BrewBuddy:/data`) and `^` line breaks as in Step 3.

**If you use `docker compose` (the [`docker-compose.yml`](docker-compose.yml) file):**

```bash
docker compose pull   # download the newest image
docker compose up -d  # recreate the container with the new image
```

> [!TIP]
> To go back to a specific older version, replace `:latest` with a version tag (for example
> `ghcr.io/joostvoskuil/brewbuddyng:1.0.0`). After updating, check the running version at the bottom
> of the BrewBuddyNG **Settings** page or open <http://localhost:3000/api/health>.

### Where is my data?

Everything you enter (recipes, brews, settings) is stored safely in a Docker volume named
`brewbuddy-data`. It stays on your computer even when you stop the app, so your data is not lost.

### Troubleshooting

| Problem                                  | What to do                                                                            |
| ---------------------------------------- | ------------------------------------------------------------------------------------- |
| "docker: command not found"              | Docker Desktop isn't installed or isn't running. Start it and try again.              |
| Page won't open at localhost:3000        | Run `docker ps` to confirm the container is running, then refresh your browser.       |
| Port 3000 is already in use              | Close the other app using port 3000, or change `-p 3000:3000` to e.g. `-p 3001:3000`. |
| Want a completely fresh start (no data)? | Stop and remove the container, then delete your data folder.                          |

---

## 🧑‍💻 For developers

Want to run BrewBuddyNG from the source code, contribute, or change it? See
[docs/TECHNICAL.md](docs/TECHNICAL.md) for the full developer guide: local setup, project structure,
the calculation library, database schema, API reference, configuration, and testing.

Quick version:

```bash
npm install
npm run dev        # http://localhost:3000 with hot reload
npm run db:seed    # load standard ingredient data
npm run test:run   # run the test suite
npm run lint       # lint the codebase
```

## 🛠️ Tech stack

| Layer      | Technology                                                              |
| ---------- | ----------------------------------------------------------------------- |
| Framework  | [Nuxt 4](https://nuxt.com/) (Vue 3 + Composition API)                   |
| Database   | SQLite via [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) |
| ORM        | [Drizzle ORM](https://orm.drizzle.team/)                                |
| Validation | [Zod](https://zod.dev/) + [drizzle-zod](https://orm.drizzle.team/)      |
| UI         | [Tailwind CSS](https://tailwindcss.com/)                                |
| Charts     | [Apache ECharts](https://echarts.apache.org/) (via vue-echarts)         |
| i18n       | [@nuxtjs/i18n](https://i18n.nuxtjs.org/) (Dutch + English)              |
| Testing    | [Vitest](https://vitest.dev/)                                           |
| Deployment | Docker (Node 26 Alpine, multi-stage build, published to `ghcr.io`)      |

## 🙏 Attribution

This web application is a rebuild of the original **BrewBuddy** (formerly **BrouwHulp**), a desktop
application originally developed by **Adrie Otte** in Free Pascal/Lazarus. All credit for the
original concept, brewing calculations, and data models belongs to the original author and project.

**Original project & source code:**
[github.com/BrewBuddyOrg/BrewBuddy](https://github.com/BrewBuddyOrg/BrewBuddy)

### Rebuilt with GitHub Copilot

This modern web version was **rebuilt entirely with GitHub Copilot**. Copilot read the original
Pascal source code and faithfully translated its brewing calculations, data models, and feature set
into a TypeScript/Vue (Nuxt 4) application. It is an independent reimplementation that aims to stay
true to the behaviour of the original desktop program.

## 📄 License

GNU General Public License v3.0 — see [LICENSE](LICENSE) for details.
