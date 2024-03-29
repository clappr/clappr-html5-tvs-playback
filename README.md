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
* Supports VoD and Live content;
  * Current mime types: [`video/mp4`, `application/vnd.apple.mpegurl`, `application/vnd.ms-sstr+xml`, `application/dash+xml`].
* Supports DRM content;
  * Using [`oipfDrmAgent`](https://www.oipf.tv/docs/OIPF-T1-R2_Specification-Volume-5-Declarative-Application-Environment-v2_3-2014-01-24.pdf#page=121).

## Configuration
The options for the playback must be placed in the `html5TvsPlayback` property as shown below:

```javascript
var player = new Clappr.Player({
  source: 'http://your.video/here.mp4',
  plugins: [HTML5TVsPlayback],
  html5TvsPlayback: {
    drm: {
      licenseServerURL: 'https://my-license-server.com/keys/my-key',
      xmlLicenceAcquisition: '<WRMHEADER xmlns="http://schemas.microsoft.com/DRM/2007/03 PlayReadyHeader" version="4.0.0.0"><DATA><PROTECTINFO><ALGID>AESCTR</ALGID><KEYLEN>16</KEYLEN></PROTECTINFO><KID>base64-encoded kid</KID><CHECKSUM>checksum of the content key for verification</CHECKSUM><LA_URL>URL for license acquisition</LA_URL></DATA></WRMHEADER>',
    },
  },
});
```

### `drm {Object}`
Group all DRM-related config. The currently available configs are:

* #### `licenseServerURL {String}`
  The license server URL used on the license acquisition. Only used to do the post acquisition.

* #### `xmlLicenceAcquisition {String}`
  The part of XML that contains all necessary info to do the full challenge of license acquisition. See more about the PlayReady Header Specification [here](https://docs.microsoft.com/en-us/playready/specifications/playready-header-specification).

## API Documentation

### Playback API
| static method | arguments | description |
|---------------|-----------|-------------|
| `HTML5TVsPlayback.canPlay` | <ul><li>`{String} - resourceUrl`</li><li>`{String} - mimeType (optional)`</li></ul> | Returns a {Boolean} response accordingly to the given media URL (`resourceUrl`). If a `mimeType` is provided then this will be used instead of inferring the mimetype via the given URL. |

| instance method | arguments | description |
|-----------------|-----------|-------------|
| `playback.load` | `{String} - resourceUrl` | Loads the media on the video element creating one `<source>` element inside it with the received source URL. |
| `playback.play` |  | Begins/resume playback of the media. |
| `playback.pause` |  | Pauses the media playback. |
| `playback.stop` | | Stops the media playback. This implies on the removing the src attribute from the video element and calling the load() method without a valid source to stop downloading the source that was removed. |
| `playback.seek` | `{Number} - time in seconds` | Updates the media playback position with the received value. |
| `playback.destroy` |  | Removes the video component from the DOM. |
| `playback.getCurrentTime (deprecated)` |  | This method only exists for backward compatibility reasons. Prefer currentTime getter. |
| `playback.getDuration (deprecated)` |  | This method only exists for backward compatibility reasons. Prefer duration getter. |
| `playback.isPlaying (deprecated)` |  | This method only exists for backward compatibility reasons. Prefer playing getter. |
| `playback.getPlaybackType (deprecated)` |  | This method only exists for backward compatibility reasons. Prefer mediaType getter. |
| `playback.switchAudioTrack` | `{String} - track id` | Updates the current audio track to the one with the provided id. |

| getter | description | response |
|--------|-------------|----------|
| `playback.config` | Returns the `options.html5TvsPlayback` value. | `{Object}` |
| `playback.mediaType` | Returns if the media is `live` or `vod`. | `{String}` |
| `playback.isReady` |  Indicates if the video is  ready to play, checking if [HTMLMediaElement.readyState](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/readyState) is greater than or equal [HAVE_CURRENT_DATA](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/readyState#value) value. | `{Boolean}` |
| `playback.playing` | Indicates if the video is playing or not. | `{Boolean}` |
| `playback.currentTime` | Returns the position the media is at the current moment. | `{Number} - time in seconds` |
| `playback.duration` | Returns the duration of the current media. | `{Number} - time in seconds` |
| `playback.ended` | Indicates whether the media has finished playing. | `{Boolean}` |
| `playback.buffering` | Indicates whether the media on the buffering state. | `{Boolean}` |
| `playback.audioTracks` | Returns a list of audio tracks currently available. | [`{AudioTrack[]}`](#audiotrack) |
| `playback.currentAudioTrack` | Returns the audio track currenlty in use. | [`{AudioTrack}`](#audiotrack) |
| `playback.isLive` | Indicates whether the media is a live content. | `{Boolean}` |
| `playback.minimumDvrSizeConfig` | Returns `options.playback.minimumDvrSize` if is configured and is a valid value. | `{Number}` |
| `playback.dvrSize` | Returns `playback.minimumDvrSizeConfig` if is a valid value or one default value. (Currently, is 60 seconds) | `{Number}` |
| `playback.dvrEnabled` | Indicates whether the live media is on DVR state. | `{Boolean}` |
| `playback.playbackType` | Returns if the type of media when this property was not change the value is `live` or `vod`. | `{String}` |
| `playback.sourceMedia` | Returns a media url in use. | `{String}` |

| setter | description | parameter |
|--------|-------------|----------|
| `playback.playbackType` | Set the new value of playback.playbackType property. | `{String}` |

## Types
#### `AudioTrack`
```javascript
/**
 * An object representing a single audio track.
 * @typedef {Object} AudioTrack
 * @property {String} id - A unique identifier for the track. Used to identify it among the others.
 * @property {String} language - The language of the track (e.g., 'en', 'pt-BR').
 * @property {String} label - An optional label to be used in the UI to describe the track.
 * @property {String} kind - The category this track belongs to (e.g., 'main', 'description').
 */
{
  id: '0',
  language: 'en',
  label: 'English (audio description)',
  kind: 'description',
}
```

## Next Steps
- [x] Media with DRM;
- [x] Live media;
- [ ] subtitles/closed captions;
- [x] multi-audio;
- [ ] Advertisement;

## Development
Install dependencies: `npm install`

Run: `npm start`

Test: `npm test`

Lint: `npm run lint`

Build: `npm run build`

Minified version: `npm run release`
