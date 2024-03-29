import { Events, Log, Playback, PlayerError, version } from '@clappr/core'
import DRMHandler from './drm/drm_handler'
import {
  MIME_TYPES,
  MIME_TYPES_BY_EXTENSION,
  READY_STATE_STAGES,
  UNKNOWN_ERROR,
  DEFAULT_MINIMUM_DVR_SIZE,
  LIVE_STATE_THRESHOLD,
  getExtension,
} from './utils/constants'

/**
 * HTML5 playback implementation for HbbTV 2.0.1 capable devices.
 * @class HTML5TVsPlayback
 */
export default class HTML5TVsPlayback extends Playback {
  static canPlay(resourceUrl, mimeType) {
    const isSupportedMimetype = Object.values(MIME_TYPES).find(item => mimeType === item)
    const sourceExtension = getExtension(resourceUrl)
    const isSourceExtensionSupported = MIME_TYPES_BY_EXTENSION[sourceExtension]

    return !!(isSupportedMimetype || isSourceExtensionSupported)
  }

  get name() { return 'html5_tvs_playback' }

  get supportedVersion() { return { min: version } }

  get tagName() { return 'video' }

  get attributes() { return { width: '100%', height: '100%' } }

  get mediaType() { return this.el.duration === Infinity ? Playback.LIVE : Playback.VOD }

  get isReady() { return this.el.readyState >= READY_STATE_STAGES.HAVE_FUTURE_DATA }

  get playing() { return !this.el.paused && !this.el.ended }

  get currentTime() { return this.el.currentTime }

  get _liveDuration() {
    try {
      return this.el.seekable.end(this.el.seekable.length - 1) - this.el.seekable.start(0)
    } catch (error) {
      Log.warn(this.name, 'Fail to determine live duration.', error)
    }
    return this.el.duration
  }

  get duration() {
    // The HTMLMediaElement.duration returns Infinity for live streams: https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/duration#value
    return this.isLive ? this._liveDuration : this.el.duration
  }

  get ended() { return this.el.ended }

  get buffering() { return this._isBuffering }

  get audioTracks() {
    if (!this.el.audioTracks) return []

    const { audioTracks } = this.el
    const audioTracksFormatted = []
    for (let i = 0 ; i < audioTracks.length ; i++)
      audioTracksFormatted.push(this._formatAudioTrack(audioTracks[i]))

    return audioTracksFormatted
  }

  get currentAudioTrack() {
    if (!this.el.audioTracks) return null

    let currentTrack = null
    const { audioTracks } = this.el
    for (let i = 0; i < audioTracks.length; i++)
      if (audioTracks[i].enabled) {
        currentTrack = audioTracks[i]
        break
      }

    return currentTrack && this._formatAudioTrack(currentTrack)
  }

  get isLive() { return this.mediaType === Playback.LIVE }

  get minimumDvrSizeConfig() {
    const dvrSizeConfig = this.options.playback && this.options.playback.minimumDvrSize
    return typeof dvrSizeConfig !== 'undefined' && typeof dvrSizeConfig === 'number' && dvrSizeConfig
  }

  get dvrSize() { return this.minimumDvrSizeConfig ? this.minimumDvrSizeConfig : DEFAULT_MINIMUM_DVR_SIZE }

  get dvrEnabled() { return this.duration >= this.dvrSize && this.isLive }

  get config() { return this.options.html5TvsPlayback }

  get events() {
    return {
      canplay: this._onCanPlay,
      canplaythrough: this._onCanPlayThrough,
      loadstart: this._onLoadStart,
      loadedmetadata: this._onLoadedMetadata,
      loadeddata: this._onLoadedData,
      waiting: this._onWaiting,
      stalled: this._onStalled,
      emptied: this._onEmptied,
      play: this._onPlay,
      playing: this._onPlaying,
      pause: this._onPause,
      ratechange: this._onRateChange,
      volumechange: this._onVolumeChange,
      seeking: this._onSeeking,
      seeked: this._onSeeked,
      progress: this._onProgress,
      timeupdate: this._onTimeUpdate,
      durationchange: this._onDurationChange,
      abort: this._onAbort,
      suspend: this._onSuspend,
      ended: this._onEnded,
      error: this._onError,
    }
  }

  get playbackType() {
    return this._playbackType
  }

  set playbackType(newPlaybackType) {
    this._playbackType = newPlaybackType
  }

  get sourceMedia() {
    return this._src
  }

  constructor(options, i18n, playerError) {
    super(options, i18n, playerError)
    this._onAudioTracksUpdated = this._onAudioTracksUpdated.bind(this)
    this._sourceElementErrorHandler = this._onError.bind(this)
    this._playbackType = this.mediaType

    this._drmConfigured = false
    this._isReady = false
    this._isBuffering = false
    this._isStopped = false
    this._isDestroyed = false

    this._setAudioTrackListeners()
    this._setupSource(this.options.src)
  }

  _setupSource(sourceURL) {
    const currentSource = this.$sourceElement && this.$sourceElement.src
    if (sourceURL === currentSource) return

    this.$sourceElement = document.createElement('source')
    this.$sourceElement.type = MIME_TYPES_BY_EXTENSION[getExtension(sourceURL)]
    this.$sourceElement.src = sourceURL
    this.$sourceElement.addEventListener('error', this._sourceElementErrorHandler)
    this._src = this.$sourceElement.src
    this._appendSourceElement()
  }

  _appendSourceElement() {
    const shouldConfigureDRM = !this.config?.disableDRMSetup && this.config?.drm && !this._drmConfigured
    if (shouldConfigureDRM) return DRMHandler.sendLicenseRequest.call(this, this.config.drm, this._onDrmConfigured, this._onDrmError)

    this.el.appendChild(this.$sourceElement)
    this.el.load()
  }

  _onDrmConfigured() {
    this._drmConfigured = true
    this._appendSourceElement()
  }

  _onDrmCleared() {
    this._drmConfigured = false
  }

  _onDrmError(errorMessage) {
    this._drmConfigured = false

    const formattedError = this.createError({
      code: 'DRM',
      description: errorMessage,
      level: PlayerError.Levels.FATAL,
    })

    this.trigger(Events.PLAYBACK_ERROR, formattedError)
  }

  _setAudioTrackListeners() {
    const tracks = this.el.audioTracks
    if (!tracks) return

    tracks.addEventListener('addtrack', this._onAudioTracksUpdated)
    tracks.addEventListener('removetrack', this._onAudioTracksUpdated)
  }

  _onAudioTracksUpdated() {
    this.trigger(Events.PLAYBACK_AUDIO_AVAILABLE, this.audioTracks)
  }

  _formatAudioTrack(htmlAudioTrack) {
    return {
      id: htmlAudioTrack.id,
      language: htmlAudioTrack.language,
      label: htmlAudioTrack.label,
      kind: htmlAudioTrack.kind,
    }
  }

  _updateDvr(status) {
    this.trigger(Events.PLAYBACK_DVR, status)
    this.trigger(Events.PLAYBACK_STATS_ADD, { dvr: status })
  }

  _onCanPlay(e) {
    Log.info(this.name, 'The HTMLMediaElement canplay event is triggered: ', e)
    !this._isReady && this._signalizeReadyState()
    if (this._isBuffering) {
      this._isBuffering = false
      this.trigger(Events.PLAYBACK_BUFFERFULL, this.name)
    }
  }

  _onCanPlayThrough(e) {
    Log.info(this.name, 'The HTMLMediaElement canplaythrough event is triggered: ', e)
  }

  _onLoadStart(e) {
    Log.info(this.name, 'The HTMLMediaElement loadstart event is triggered: ', e)
  }

  _onLoadedMetadata(e) {
    Log.info(this.name, 'The HTMLMediaElement loadedmetadata event is triggered: ', e)
    this.trigger(Events.PLAYBACK_LOADEDMETADATA, { duration: e.target.duration, data: e })
  }

  _onLoadedData(e) {
    Log.info(this.name, 'The HTMLMediaElement loadeddata event is triggered: ', e)
  }

  _onWaiting(e) {
    this._isBuffering = true
    Log.info(this.name, 'The HTMLMediaElement waiting event is triggered: ', e)
    this.trigger(Events.PLAYBACK_BUFFERING, this.name)
  }

  _onStalled(e) {
    Log.info(this.name, 'The HTMLMediaElement stalled event is triggered: ', e)
  }

  _onEmptied(e) {
    Log.info(this.name, 'The HTMLMediaElement emptied event is triggered: ', e)
  }

  _onPlay(e) {
    Log.info(this.name, 'The HTMLMediaElement play event is triggered: ', e)
    this.trigger(Events.PLAYBACK_PLAY_INTENT)
  }

  _onPlaying(e) {
    Log.info(this.name, 'The HTMLMediaElement playing event is triggered: ', e)
    this.trigger(Events.PLAYBACK_PLAY)
  }

  _onPause(e) {
    Log.info(this.name, 'The HTMLMediaElement pause event is triggered: ', e)
    this.trigger(Events.PLAYBACK_PAUSE)
  }

  _onRateChange(e) {
    Log.info(this.name, 'The HTMLMediaElement ratechange event is triggered: ', e)
  }

  _onVolumeChange(e) {
    Log.info(this.name, 'The HTMLMediaElement volumechange event is triggered: ', e)
  }

  _onSeeking(e) {
    Log.info(this.name, 'The HTMLMediaElement seeking event is triggered: ', e)
    this.trigger(Events.PLAYBACK_SEEK)
  }

  _onSeeked(e) {
    Log.info(this.name, 'The HTMLMediaElement seeked event is triggered: ', e)
    this.trigger(Events.PLAYBACK_SEEKED)
  }

  _onProgress(e) {
    Log.debug(this.name, 'The HTMLMediaElement progress event is triggered: ', e) // Preferring to debug level because of the high frequency of calls.
  }

  _onTimeUpdate(e) {
    Log.debug(this.name, 'The HTMLMediaElement timeupdate event is triggered: ', e) // Preferring to debug level because of the high frequency of calls.
    this.trigger(Events.PLAYBACK_TIMEUPDATE, { current: this.el.currentTime, total: this.duration }, this.name)
  }

  _onDurationChange(e) {
    Log.info(this.name, 'The HTMLMediaElement durationchange event is triggered: ', e)
  }

  _onAbort(e) {
    Log.info(this.name, 'The HTMLMediaElement abort event is triggered: ', e)
  }

  _onSuspend(e) {
    Log.info(this.name, 'The HTMLMediaElement suspend event is triggered: ', e)
  }

  _onEnded(e) {
    Log.info(this.name, 'The HTMLMediaElement ended event is triggered: ', e)
    this._wipeUpMedia()
    this.trigger(Events.PLAYBACK_ENDED, this.name)
  }

  _onError(e) {
    Log.warn(this.name, 'The HTMLMediaElement error event is triggered: ', e)
    const rawError = this.$sourceElement?.error || this.el.error || UNKNOWN_ERROR
    const { code, message } = rawError

    const formattedError = this.createError({
      code,
      description: message,
      raw: rawError,
      level: PlayerError.Levels.FATAL,
    })

    this.trigger(Events.PLAYBACK_ERROR, formattedError)
  }

  load(sourceURL) {
    this._wipeUpMedia()
    this._setupSource(sourceURL)
  }

  play() {
    this._isStopped = false
    this._setupSource(this._src)

    const promise = this.el.play()
    promise && promise.catch && promise.catch(error => Log.warn(this.name, 'The play promise throws one error: ', error))
  }

  pause() {
    this.el.pause()
    this.dvrEnabled && this._updateDvr(true)
  }

  seek(time) {
    if (time < 0) return Log.warn(this.name, 'Attempting to seek to a negative time. Ignoring this operation.')

    let timeToSeek = time

    // Assumes that is a live state if the time is within the LIVE_STATE_THRESHOLD of the end of the stream.
    const dvrStatus = timeToSeek < this.duration - LIVE_STATE_THRESHOLD

    this.dvrEnabled && this._updateDvr(dvrStatus)
    try {
      timeToSeek += this.el.seekable.start(0)
    } catch (error) {
      Log.warn(this.name, 'The seekable.start(0) is not available', error)
    }

    this.el.currentTime = timeToSeek
  }

  switchAudioTrack(id) {
    const track = this.el.audioTracks?.getTrackById(id)
    if (!track || track.enabled) return

    const { audioTracks } = this.el
    for (let i = 0; i < audioTracks.length; i++)
      audioTracks[i].enabled = audioTracks[i].id === id

    this.trigger(Events.PLAYBACK_AUDIO_CHANGED, this._formatAudioTrack(track))
  }

  stop() {
    this.pause()
    this._isStopped = true
    this._wipeUpMedia()
    this.trigger(Events.PLAYBACK_STOP)
  }

  destroy() {
    this._isDestroyed = true
    super.destroy()
    this._wipeUpMedia()
    const { audioTracks } = this.el
    audioTracks?.removeEventListener('addtrack', this._onAudioTracksUpdated)
    audioTracks?.removeEventListener('removetrack', this._onAudioTracksUpdated)
    this._src = null
  }

  _wipeUpMedia() {
    this._isReady = false
    this._drmConfigured && DRMHandler.clearLicenseRequest.call(this, this._onDrmCleared, this._onDrmError)
    if (this.$sourceElement) {
      this.$sourceElement.removeEventListener('error', this._sourceElementErrorHandler)
      this.$sourceElement.src = '' // The src attribute will be added again in play().
      this.el.load() // Loads with no src attribute to stop the loading of the previous source and avoid leaks.
      this.$sourceElement.parentNode && this.$sourceElement.parentNode.removeChild(this.$sourceElement)
      this.$sourceElement = null
    }
  }

  /**
   * Triggers the Clappr playback ready event if the isReady getter returns a true value.
   * If isReady getter returns a false value, invoke itself with a delay that's grown exponentially at every new auto invocation.
   * The initial delay value is 100 milliseconds.
   * Also, set the _isReady flag with true value.
   * @private
   * @param {number} backOff - interval interval between retries (in milliseconds).
   */
  _signalizeReadyState(backOff = 100) {
    if (!this.isReady) return setTimeout(() => { this._signalizeReadyState(backOff * 2) }, backOff)

    this._isReady = true
    this.trigger(Events.PLAYBACK_READY, this.name)
  }

  /**
   * @deprecated
   * This method currently exists for backward compatibility reasons.
   * Use the currentTime getter instead of it.
   */
  getCurrentTime() { return this.currentTime }

  /**
   * @deprecated
   * This method currently exists for backward compatibility reasons.
   * Use the duration getter instead of it.
   */
  getDuration() { return this.duration }

  /**
   * @deprecated
   * This method currently exists for backward compatibility reasons.
   * Use the playing getter instead of it.
   */
  isPlaying() { return this.playing }

  /**
   * @deprecated
   * This method currently exists for backward compatibility reasons.
   * Use the mediaType getter instead of it.
   */
  getPlaybackType() { return this.mediaType }
}
