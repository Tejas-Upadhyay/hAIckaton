# Dependency verification

Checked November 2, 2026. Node on this machine: 26.11.1; npm: 11.20.0.

| Package | Pinned version | Evidence |
|---|---|---|
| react / react-dom | 19.3.1 | [React registry metadata](https://registry.npmjs.org/react/latest); [official React plugin manifest](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/package.json) lists matching React and React DOM 19.3.1 |
| vite | 8.3.5 | [Official Vite manifest](https://github.com/vitejs/vite/blob/main/packages/vite/package.json) |
| @vitejs/plugin-react | 6.2.1 | [Official plugin manifest](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/package.json); peer Vite ^8.0.0 |
| tailwindcss / @tailwindcss/vite | 4.3.3 | [Tailwind registry](https://registry.npmjs.org/tailwindcss/latest); [versioned plugin manifest](https://github.com/tailwindlabs/tailwindcss/blob/v4.3.3/packages/%40tailwindcss-vite/package.json); peer supports Vite ^8 |

Configuration follows the [Vite guide](https://vite.dev/guide/) and [Tailwind Vite installation](https://tailwindcss.com/docs/installation/using-vite). Versions are pinned rather than copying the plan's older speculative manifest. Icon/utility packages are omitted until needed to keep the initial dependency graph small.

The restricted terminal cannot resolve registry.npmjs.org (`ENOTFOUND`). Source metadata and peer ranges were checked via web tools, but installation, resolved transitive dependencies, a generated lockfile, and the production build remain unverified until registry access works. Do not treat source checks as a successful install/build. Run `npm install`, commit the generated package-lock.json through Codex, then run `npm run check` before integrating workers.
