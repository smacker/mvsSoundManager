/*global angular */

/*
 SoundManager 2 service & directive
 */

angular.module('mvsSoundManager', []);

// Simple service around SoundManager
angular.module('mvsSoundManager')
  .factory('SoundManager', ['$rootScope', '$timeout', function ($rootScope, $timeout) {
    var PBXSoundManager = function () {};

    PBXSoundManager.prototype.createSound = function(url) {
      var _this = this;

      this.sound = soundManager.createSound({
        id: url,
        url: url,
        autoPlay: false,
        stream: false,
        volume: 100,
        loops: 1,
        whileplaying: function () {
          _this.whileplaying();
        },
        onfinish: function () {
          _this.onfinish();
        }
      });
    };

    PBXSoundManager.prototype.whileplaying = function () {
      $timeout(function() { $rootScope.$broadcast('soundUpdate'); });
    };

    PBXSoundManager.prototype.onfinish = function () {
      $timeout(function() { $rootScope.$broadcast('soundStop'); });
    };

    PBXSoundManager.prototype.getSound = function (url) {
      // try to get it from cache
      this.sound = soundManager.getSoundById(url);
      if (!this.sound) {
        this.createSound(url);
      }
    };

    PBXSoundManager.prototype.play = function (url) {
      if (!url && !this.sound) {
        throw Error('Trying to play without url');
      }

      if (url) {
        // No track yet
        if (!this.sound) {
          this.getSound(url);
        }
        // Current track and query track are not same
        else if (this.sound.id !== url) {
          this.stop();
          this.getSound(url);
        }
      }

      // ♪♪♪
      this.sound.play();
      $timeout(function() {
        // global notification
        $rootScope.$broadcast('soundStart');
      });

      return this.sound;
    };

    PBXSoundManager.prototype.pause = function () {
      this.sound.pause();
    };


    PBXSoundManager.prototype.stop = function () {
      this.sound.stop();
      $timeout(function() {
        // global notification
        $rootScope.$broadcast('soundStop');
      });
    };

    pbxSoundManager = new PBXSoundManager();

    return {
      play: pbxSoundManager.play.bind(pbxSoundManager),
      pause: pbxSoundManager.pause.bind(pbxSoundManager),
      stop: pbxSoundManager.stop.bind(pbxSoundManager)
    };
  }]);

// jQuery UI slider for current track
angular.module('mvsSoundManager')
  .directive('soundSlider', function() {
    return {
      scope: {
        sound: '='
      },
      link: function(scope, element, attrs) {
        element.slider({
          min: 0,
          max: scope.sound.durationEstimate,
          stop: function(e, ui) { // dragging slider stopped
            scope.sound.setPosition(ui.value);
          }
        });

        scope.$on('soundUpdate', function () {
          if (scope.sound.loaded) {
            element.slider('option', 'max', scope.sound.duration);
          } else {
            element.slider('option', 'max', scope.sound.durationEstimate);
          }
          element.slider('value', scope.sound.position);
        });
      }
    };
  });
