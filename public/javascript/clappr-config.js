/* eslint-disable */
var mp4Source = 'http://clappr.io/highline.mp4';
Clappr.Log.setLevel(Clappr.Log.LEVEL_INFO);

var onReadyCallback = function() {
  var _hideTimeout;

  this.core.listenTo(this.core, Clappr.Events.Custom.CORE_SMART_TV_KEY_PRESSED, function(_, data) {
    Clappr.Log.info('keyName', data.keyName);
    clearTimeout(_hideTimeout);
    document.querySelector('.snackbar').innerText = 'The key pressed has the code ' + data.keyEvent.keyCode + ' and is mapped to the "' + data.keyName + '" value.';
    document.querySelector('.snackbar').className += ' show';
    _hideTimeout = setTimeout(function() { document.querySelector('.snackbar').className = 'snackbar' }, 3000);

    if (data.keyName === window.TVsKeyMappingPlugin.KeyNames.KEY_CODE_PLAY) player.core.activePlayback.play();
    if (data.keyName === window.TVsKeyMappingPlugin.KeyNames.KEY_CODE_PAUSE) player.core.activePlayback.pause();
  });

};

var searchParams;
window.URLSearchParams && (searchParams = new window.URLSearchParams(window.location.search));

var player = new Clappr.Player({
  source: searchParams && searchParams.get('source') || mp4Source,
  height: searchParams && searchParams.get('height') || '100%',
  width: searchParams && searchParams.get('width') || '100%',
  tvsKeyMapping: { deviceToMap: 'panasonic' },
  playback: { controls: true },
  plugins: [window.TVsKeyMappingPlugin.Watcher, window.HTML5TVsPlayback],
  events: { onReady: onReadyCallback },
});

player.attachTo(document.body);