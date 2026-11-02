# Dependency verification

Checked November 2, 2026. Node on this machine: 26.11.1; npm: 11.20.0.

| Package | Pinned version | Evidence |
|---|---|---|
| react / react-dom | 19.3.1 | [React registry metadata](https://registry.npmjs.org/react/latest); [official React plugin manifest](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/package.json) lists matching React and React DOM 19.3.1 |
| vite | 8.3.5 | [Official Vite manifest](https://github.com/vitejs/vite/blob/main/packages/vite/package.json) |
| @vitejs/plugin-react | 6.2.1 | [Official plugin manifest](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/package.json); peer Vite ^8.0.0 |
| tailwindcss / @tailwindcss/vite | 4.3.3 | [Tailwind registry](https://registry.npmjs.org/tailwindcss/latest); [versioned plugin manifest](https://github.com/tailwindlabs/tailwindcss/blob/v4.3.3/packages/%40tailwindcss-vite/package.json); peer supports Vite ^8 |

Configuration follows the [Vite guide](https://vite.dev/guide/) and [Tailwind Vite installation](https://tailwindcss.com/docs/installation/using-vite). Versions are pinned rather than copying the plan's older speculative manifest. Icon/utility packages are omitted until needed to keep the initial dependency graph small.

Initial scaffold installation was blocked by registry DNS access. During worker implementation, dependencies and package-lock.json were generated. Integration verified `npm ls --depth=0` against all six pinned versions and built the production app successfully. The lockfile remains ready to commit with integration. Full HTTP transport tests need a terminal permitted to bind localhost ports; targeted checks run independently of that restriction.

For reproducible browser QA, integration added exact dev-only pins `@playwright/test@1.64.1` and `@axe-core/playwright@4.14.0`, verified with npm registry metadata and installed successfully. Playwright runs against installed Google Chrome. Runtime dependencies remain React/React DOM only. Lockfile updated and full Node/render/browser suites passed.
