## NUS module prerequisite graph

Traces the prerequisite chain for a set of NUS modules, for planning modules or CS focus areas. It's a static site, and your plan is saved in your browser.

Live: https://hiroc.dev/nus-prereq-graph/

Data comes from the [NUSMods API](https://api.nusmods.com/v2/).

![Preview](assets/preview.png)

### Using it

- Search by code or title, or add modules from the focus area, foundation and maths presets.
- Tick a module to mark it completed. You can also click a node in the graph.
- Modules show a tag if they only run in one semester or aren't offered this AY. No tag means both semesters. The sidebar also shows the minimum semesters to finish each one.
- Select a module to give it a planned term. The sidebar then groups by term with MC totals, and warns about a prerequisite planned too late or a module not offered that semester.
- **Full chain** expands modules outside your plan to show the whole path. **Fit** recentres the graph.
- **Share** copies a link to your plan. Nothing is sent to a server; the plan is in the link itself.
- The legend explains node and arrow colours. Hover over a node to highlight its neighbours.

### Limits

- Minimum semesters is a lower bound. It assumes no workload limit, this year's offerings repeating, and no MA1301 needed.
- Planner warnings use this AY's offerings, so they're estimates for later years.
- Non-course conditions, such as cohort rules, aren't checked.

### Development

```bash
npm install
npm run dev
```

| Command | What it does |
|---|---|
| `npm test` | Runs the tests |
| `npm run lint` | Runs ESLint |
| `npm run build` | Type-checks and builds to `dist/` |
| `npm run deploy` | Builds and publishes to GitHub Pages. CI does this on every push to `main` |
| `npm run snapshot` | Rebuilds `public/data/snapshot.json` from NUSMods |

PRs go to `dev`. A release is a PR from `dev` to `main`, which deploys.

Once a semester, or when moving to a new AY: update `CURR_ACAD_YEAR` in `src/constants.ts` if needed, then run `npm run snapshot`.
