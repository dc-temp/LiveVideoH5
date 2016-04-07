$(function() {
  var sanitize = function(s) {
    return s.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
  }
  var getParam = function(name) {
    var search = location.search;
    var exp = new RegExp('(?:\\?|&)' + sanitize(name) + '=([^&]+)');
    var value = search.match(exp);
    if (value) {
      return value[1];
    }
    return null;
  };
  window.loadedHandler = function() {};
  window.showError = function() {
    $('.poster').show().find('img').attr('src', 'images/error.png');
    $('#ckplayer').hide();
    $('.user-area').hide();
  };
  window.playerstop = function() {
    $('.poster').show().find('img').attr('src', 'images/poster.png');
    $('#ckplayer').hide();
    $('#player').hide();
  }
  var videoInfo;
  var width = $('#player').width();
  var height = width / 16 * 9;
  var embedCKPlayer = function(videoUrl, imageUrl) {
    var flashvars = {
      f: videoUrl, //视频地址
      a: '', //调用时的参数，只有当s>0的时候有效
      s: '0', //调用方式，0=普通方法（f=视频地址），1=网址形式,2=xml形式，3=swf形式(s>0时f=网址，配合a来完成对地址的组装)
      c: '1', //是否读取文本配置,0不是，1是
      i: imageUrl, //初始图片地址
      u: '', //暂停时如果是图片的话，加个链接地址
      e: '4', //视频结束后的动作，0是调用js函数，1是循环播放，2是暂停播放并且不调用广告，3是调用视频推荐列表的插件，4是清除视频流并调用js功能和1差不多，5是暂停播放并且调用暂停广告
      v: '80', //默认音量，0-100之间
      p: '0', //视频默认0是暂停，1是播放，2是不加载视频
      h: '3', //播放http视频流时采用何种拖动方法，=0不使用任意拖动，=1是使用按关键帧，=2是按时间点，=3是自动判断按什么(如果视频格式是.mp4就按关键帧，.flv就按关键时间)，=4也是自动判断(只要包含字符mp4就按mp4来，只要包含字符flv就按flv来)
      lv: '1', //是否是直播流，=1则锁定进度栏
      loaded: 'loadedHandler', //当播放器加载完成后发送该js函数loaded
      //调用播放器的所有参数列表结束
      //以下为自定义的播放器参数用来在插件里引用的
      my_url: encodeURIComponent(window.location.href) //本页面地址
        //调用自定义播放器参数结束
    };
    var params = {
      bgcolor: '#FFF',
      allowFullScreen: true,
      allowScriptAccess: 'always'
    }; //这里定义播放器的其它参数如背景色（跟flashvars中的b不同），是否支持全屏，是否支持交互
    var video = [videoUrl];
    CKobject.embed('ckplayer/ckplayer.swf', 'player', 'ckplayer', width, height, false, flashvars, video, params);
  };
  var vid = getParam('videoid');
  var usericon = getParam('usericon');
  $('#player').css({
    height: 'auto'
  });
  if (vid) {
    $.ajax({
      url: 'http://122.112.13.176:81/livenotes/livenotes/service/video/getInfo',
      method: 'POST',
      contentType: 'application/json',
      crossDomain: true,
      data: JSON.stringify({
        "id": "123456",
        "type": "m1_get_videoinfo",
        "action": "request",
        "videoID": vid,
        "account": ""
      }),
      dataType: 'json',
      success: function(data, status, xhr) {
        videoInfo = data.videoInfo;
        if (videoInfo == null) {
          showError();
          return;
        }
        if (videoInfo.isLive == 0) {
          document.title = (videoInfo.title || '视频标题') + " - 回放中";
        } else {
          document.title = (videoInfo.title || '视频标题') + " - 直播中";
        }
        //if (navigator.userAgent.match(/iPhone/) || navigator.userAgent.match(/Android/)) {
        if ((navigator.userAgent.match(/(iPhone|iPod|Android|ios|iOS|iPad|Backerry|WebOS|Symbian|Windows Phone|Phone)/i))) {
          $.ajax({
            url: 'http://122.112.13.176:81/livenotes/livenotes/service/video/gethls',
            method: 'POST',
            contentType: 'application/json',
            crossDomain: true,
            data: JSON.stringify({
              "id": "123456",
              "type": "m1_get_videoinfo",
              "action": "request",
              "videoID": vid
            }),
            dataType: 'json',
            success: function(data, status, xhr) {
              if (data.hlsUrl) {
                embedCKPlayer(data.hlsUrl, videoInfo.videoImage);
              } else {
                showError();
              }
            },
            error: function() {
              showError();
            }
          });
        } else {
          embedCKPlayer((videoInfo.playUrl).replace(/([^:]{1})\/\//g, '$1|'), videoInfo.videoImage);
        }
        $('#player').css({
          height: 'auto'
        });
        if (videoInfo.account) {
          $.ajax({
            url: 'http://122.112.13.176:81/livenotes/livenotes/service/account/info/fetch',
            method: 'POST',
            contentType: 'application/json',
            crossDomain: true,
            data: JSON.stringify({
              "id": "123456",
              "type": "m1_get_personalInfo",
              "action": "request",
              "account": videoInfo.account,
              "version": "1.0"
            }),
            dataType: 'json',
            success: function(data, status, xhr) {
              $('.name').html(data.nickName || '用户昵称');
              $('.icon-gender').addClass('icon-gender-' + data.sex);
              var age = new Date().getFullYear() - (data.birthDay.substring(0, 4) * 1);
              $('.text2 .age').html(age + '岁');
              $('.text2 .loc').html(data.location || '北京');
              if (data.sign) {
                $('.desc').html('“' + data.sign + '”');
              }
              $('.user-icon').attr('src', usericon);
            }
          });
        }
      },
      error: function() {
        showError();
      }
    })
  } else {
    showError();
  }

  var createNonceStr = function() {
    return Math.random().toString(36).substr(2, 15);
  };

  var createTimestamp = function() {
    return parseInt(new Date().getTime() / 1000) + '';
  };

  var raw = function(args) {
    var keys = Object.keys(args);
    keys = keys.sort()
    var newArgs = {};
    keys.forEach(function(key) {
      newArgs[key.toLowerCase()] = args[key];
    });

    var string = '';
    for (var k in newArgs) {
      string += '&' + k + '=' + newArgs[k];
    }
    string = string.substr(1);
    return string;
  };

  function weixinSign() {
    wx.ready(function() {
      function shareSuccess() {
        alert('分享成功');
      }
      wx.onMenuShareTimeline({
        title: videoInfo.title, // 分享标题
        link: document.location.href, // 分享链接
        imgUrl: videoInfo.videoImage, //
        success: shareSuccess
      });
      wx.onMenuShareAppMessage({
        title: videoInfo.title, // 分享标题
        desc: '我在看这个，很有意思，你也来看看吧',
        link: document.location.href, // 分享链接
        imgUrl: videoInfo.videoImage, //
        success: shareSuccess
      });
    });
    $.ajax({
      url: 'http://122.112.13.176/weixin/ticket',
      success: function(data) {
        var ticket = data.result.ticket;
        var now = createTimestamp();
        var nonceStr = createNonceStr();
        var ret = {
          jsapi_ticket: ticket,
          nonceStr: nonceStr,
          timestamp: now,
          url: location.href.replace(/#.*$/, '')
        };
        var string = raw(ret);
        var sign = shalUtil.hex_sha1(string);

        wx.config({
          debug: false, // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
          appId: 'wx3cd38514f41d89d4', // 必填，公众号的唯一标识
          timestamp: now, // 必填，生成签名的时间戳
          nonceStr: nonceStr, // 必填，生成签名的随机串
          signature: sign, // 必填，签名，见附录1
          jsApiList: [
                  'checkJsApi',
                  'onMenuShareTimeline',
                  'onMenuShareAppMessage',
                  'onMenuShareQQ',
                  'onMenuShareWeibo',
                  'hideMenuItems',
                  'showMenuItems',
                  'hideAllNonBaseMenuItem',
                  'showAllNonBaseMenuItem',
                  'translateVoice',
                  'startRecord',
                  'stopRecord',
                  'onRecordEnd',
                  'playVoice',
                  'pauseVoice',
                  'stopVoice',
                  'uploadVoice',
                  'downloadVoice',
                  'chooseImage',
                  'previewImage',
                  'uploadImage',
                  'downloadImage',
                  'getNetworkType',
                  'openLocation',
                  'getLocation',
                  'hideOptionMenu',
                  'showOptionMenu',
                  'closeWindow',
                  'scanQRCode',
                  'chooseWXPay',
                  'openProductSpecificView',
                  'addCard',
                  'chooseCard',
                  'openCard'
                ] // 必填，需要使用的JS接口列表，所有JS接口列表见附录2
        });
      }
    });
  }
  weixinSign();

  // $('.down-area').on('click', function() {
  //   if (navigator.userAgent.match('iPhone')) {
  //     alert('下载iPhone');
  //     // location.href = '';
  //   } else {
  //     alert('下载安卓')
  //   }
  // });
});

