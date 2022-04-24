# msfs2020-electron

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Lints and fixes files
```
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).

## TODO

- background.ts - add EVENT_ADD_STARTUP handling to set services to auto and add a startup shortcut
- sc query to check if services need to be started at all
- Something is causing UI to freeze while exec is happening. Move these to a new thread off the UI
- Add CI
- Add E2E tests
- Add unit tests
