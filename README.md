<!-- [![](https://data.jsdelivr.com/v1/package/npm/@joaopaulo.vieira/clappr-html5-tvs-playback//badge)](https://www.jsdelivr.com/package/npm/@joaopaulo.vieira/clappr-html5-tvs-playback/) -->
<!-- [![](https://img.shields.io/npm/v/@joaopaulo.vieira/clappr-html5-tvs-playback/.svg?style=flat-square)](https://npmjs.org/package/@joaopaulo.vieira/clappr-html5-tvs-playback/) -->
<!-- [![](https://img.shields.io/npm/dt/@joaopaulo.vieira/clappr-html5-tvs-playback/.svg?style=flat-square)](https://npmjs.org/package/@joaopaulo.vieira/clappr-html5-tvs-playback/) -->
<!-- [![npm bundle size](https://img.shields.io/bundlephobia/min/@joaopaulo.vieira/clappr-html5-tvs-playback/?style=flat-square)](https://bundlephobia.com/result?p=@joaopaulo.vieira/clappr-html5-tvs-playback/) -->
<!-- [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com) -->
<!-- ![Travis (.com)](https://img.shields.io/travis/com/joaopaulovieira/clappr-html5-tvs-playback/?style=flat-square) -->
<!-- ![Coveralls github](https://img.shields.io/coveralls/github/joaopaulovieira/clappr-html5-tvs-playback/?style=flat-square) -->
<!-- [![](https://img.shields.io/github/license/joaopaulovieira/clappr-context-menu-plugin?style=flat-square)](https://github.com/joaopaulovieira/clappr-context-menu-plugin/blob/master/LICENSE) -->

<h3 align=center><b>This project is still in progress. Check the next steps to see the path to the first stable version.</b></h1>

---

<h1 align=center>Clappr HTML5 TVs playback</h1>

A Clappr HTML5 playback for smart TVs devices that implement the [HbbTV 2.0.1 specs](https://www.hbbtv.org/wp-content/uploads/2020/10/HbbTV-SPEC20-00039-027-HbbTV_2_0_1_with_errata_5_integrated-2020-10-14-1.pdf).

---

## Features
* Supports VoD (for `.mp4` and `.m3u8`);

## Configuration
```javascript
var player = new Clappr.Player({
  source: 'http://your.video/here.mp4',
  plugins: [HTML5TVsPlayback]
});
```

## API Documentation

### Playback API
| static method | arguments | description |
|---------------|-----------|-------------|
| `HTML5TVsPlayback.canPlay` | <ul><li>`{String} - resourceUrl`</li><li>`{String} - mimeType (optional)`</li></ul> | Returns a {Boolean} response accordingly to the given media URL (`resourceUrl`). If a `mimeType` is provided then this will be used instead of inferring the mimetype via the given URL. |

| instance method | arguments | description |
|-----------------|-----------|-------------|
| `playback.play` |  | Begins/resume playback of the media. |
| `playback.pause` |  | Pauses the media playback. |
| `playback.stop` | | Stops the media playback. This implies on the removing the src attribute from the video element and calling the load() method without a valid source to stop downloading the source that was removed. |
| `playback.seek` | `{Number} - time in seconds` | Updates the media playback position with the received value. |
| `playback.destroy` |  | Removes the video component from the DOM. |
| `playback.getCurrentTime (deprecated)` |  | This method only exists for backward compatibility reasons. Prefer currentTime getter. |
| `playback.getDuration (deprecated)` |  | This method only exists for backward compatibility reasons. Prefer duration getter. |
| `playback.isPlaying (deprecated)` |  | This method only exists for backward compatibility reasons. Prefer playing getter. |

| getter | description | response |
|--------|-------------|----------|
| `playback.isReady` |  Indicates if the video is  ready to play, checking if [HTMLMediaElement.readyState](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/readyState) is greater than or equal [HAVE_CURRENT_DATA](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/readyState#value) value. | `{Boolean}` |
| `playback.playing` | Indicates if the video is playing or not. | `{Boolean}` |
| `playback.currentTime` |Returns the current position of the media is at the moment. | `{Number} - time in seconds` |
| `playback.duration` | Returns the duration of the current media. | `{Number} - time in seconds` |
| `playback.ended` | Indicates whether the media has finished playing. | `{Boolean}` |
| `playback.buffering` | Indicates whether the media on the buffering state. | `{Boolean}` |

## Next Steps
- [ ] Media with DRM;
- [ ] Live media;
- [ ] subtitles/closed captions;
- [ ] multi-audio;
- [ ] DVR for live media;
- [ ] Advertisement;

## Development
Install dependencies: `npm install`

Run: `npm start`

Test: `npm test`

Lint: `npm run lint`

Build: `npm run build`

Minified version: `npm run release`
