var selector = {
	
	sound_0 : 'http://res.cloudinary.com/dzcadzgap/video/upload/v1485352506/simon_0_u7yeec.mp3',
	sound_1 : 'http://res.cloudinary.com/dzcadzgap/video/upload/v1485352510/simon_1_bjf9im.mp3',
	sound_2 : 'http://res.cloudinary.com/dzcadzgap/video/upload/v1485352512/simon_2_e2eri1.mp3',
	sound_3 : 'http://res.cloudinary.com/dzcadzgap/video/upload/v1485352510/simon_3_su4qao.mp3',
	sound_fail : 'http://res.cloudinary.com/dzcadzgap/video/upload/v1485352510/simon_fail_nma2qd.mp3',
	sound_success : 'http://res.cloudinary.com/dzcadzgap/video/upload/v1485353898/simon_success_wzmvcc.mp3',
	sound_click : 'http://res.cloudinary.com/dzcadzgap/video/upload/v1485352510/simon_switch_fqll4p.mp3',
	sound_win : 'http://res.cloudinary.com/dzcadzgap/video/upload/v1485436358/simon_win_syqqjq.mp3',
	button_start : '#btn_start',
	button_strict : '#btn_strict',
	button_reset : '#btn_reset',
	button_control : '.cntrl_btn',
	text_steps : '#div_steps',
	game_board : '#game_board',
	button_div : '#container_second',
	tiles : '#game_board li',
	message_box: '#message_box'	
}

function AudioManage () {
		
	function BufferLoader(context, urlList, callback) {
		this.context = context;
		this.urlList = urlList;
		this.onload = callback;
		this.bufferList = new Array();
		this.loadCount = 0;
	}	


	BufferLoader.prototype.loadBuffer = function(url, index) {
		var request = new XMLHttpRequest();
		console.log(request);
		request.open("GET", url, true);
		request.responseType = "arraybuffer";

		var loader = this;

		request.onload = function() {
			loader.context.decodeAudioData(
			request.response,
			function(buffer) {
				if (!buffer) {
				  alert('error decoding file data: ' + url);
				  return;
				}
				loader.bufferList[index] = buffer;
				if (++loader.loadCount == loader.urlList.length)
				  loader.onload(loader.bufferList);
			},
			function(error) {
				console.error('decodeAudioData error', error);
			}
		);
	}

	request.onerror = function() {
		alert('BufferLoader: XHR error');
	}

	request.send();
	}

	BufferLoader.prototype.load = function() {
		for (var i = 0; i < this.urlList.length; ++i)
		this.loadBuffer(this.urlList[i], i);
	}

	var context;
	var bufferLoader;
	var sources = [];

	function init() {
		window.AudioContext = window.AudioContext || window.webkitAudioContext;
		context = new AudioContext();
		bufferLoader = new BufferLoader(
			context,
			[
				selector.sound_0,
				selector.sound_1,
				selector.sound_2,
				selector.sound_3,
				selector.sound_fail,
				selector.sound_success,
				selector.sound_click,
				selector.sound_win
			],
			finishedLoading
		);
		bufferLoader.load();
	}

	function finishedLoading(bufferList){
		for (var i = 0; i < bufferList.length; i++) {
			var source = context.createBufferSource();
			source.buffer = bufferList[i];
			source.connect(context.destination);
			sources.push(source);			
		}			
	}

	var playSound = this.playSound = function(i){
		var source = context.createBufferSource();
		source.buffer = sources[i].buffer;
		source.connect(context.destination);
		source.start(0);
	};

	this.fail = function() {
		playSound(4);
	},

	this.success = function(){
		playSound(5);
	},

	this.click = function(){
		playSound(6);
	},
	this.win = function() {
		playSound(7);
	}

	init();
}

function Game () {
	
	var playerTurn = true;
	var strict = false;
	var audio = this.audio = new AudioManage();
	var attempts = 0;

	var tile = {

		add: function(obj, arr){
			arr.push(obj);
		},

		light: function(obj) {
			obj.css({border: '0 solid #555'}).stop().animate({'opacity': 1, borderWidth: 5}, 0)
			.animate({'opacity': .25, borderWidth: 0},1000);
			audio.playSound($(obj).index(selector.tiles));
		}
	};

	var patterns = {

		simon:[],
		user: [],
		index: 0,
		interval: null,
		time: {
			max: 1000, 
			min: 100, 
			curr: 1000, 
			reduce: function(){
				patterns.time.curr-=25;
			},
		},

		correctInput: function() {
			return patterns.user.every(function(e,i,a){
				return patterns.simon[i][0].id === patterns.user[i][0].id;
			});
		},

		match: function(){
			return patterns.user.length === patterns.simon.length;
		},

		clear: function(){
			patterns.simon = [];
			patterns.user = [];
			index = 0;
			interval = null;
			patterns.time.curr = 1000;
		},
		play: function(){
			tile.light(patterns.simon[patterns.index]);
			patterns.index++;

			if (patterns.index < patterns.simon.length) {
				patterns.interval = setTimeout(patterns.play, patterns.time.curr);
			} else {
				switchState();
				clearTimeout(patterns.interval);
			}
		}
	};

	var switchState = function() {
		attempts++;
		playerTurn = !playerTurn;
		patterns.user = [];
		patterns.index = 0;

		$("html body").animate({
			backgroundColor: playerTurn ? '#eee' : '#777',
		}, 500);
		$(selector.text_steps).html(patterns.simon.length < 10 ? '0' + patterns.simon.length : patterns.simon.length);
	};

	var simonTurn = function() {
		tile.add($('#' + Math.floor(Math.random() * 4)), patterns.simon);
		patterns.play();
		patterns.time.reduce();
	};

	var hasWon = function() {
		return patterns.simon.length === 20;
	};
	
	var displayMessage = function(_win){
		var _message = '';

		$(selector.message_box).removeClass();

		if(_win) {
			_message = '<strong>You Win!</strong> '
			if (attempts / 2 === patterns.simon.length) {
				_message += 'Amazing! You didn\'t mess up once!';
			} else if(attempts / 2 <= patterns.simon.length + 2) {
				_message += 'Great job! Almost perfect!'
			} else {
				var wrong = (attempts / 2 - patterns.simon.length);
				_message += 'You messed up ' + (attempts / 2 - patterns.simon.length) + ' times, you can do better than that!';
			}
			$(selector.message_box).addClass( "alert alert-success" );
		} else {
			_message = '<strong>You Lose!</strong> Try Again?'
			$(selector.message_box).addClass( "alert alert-danger" );			
		}
		$(selector.message_box).html(_message);
		$('#myModal').modal('show');
	}

	this.toggleStrict = function(){
		strict = !strict;
		$(selector.button_strict).css({background: strict ? '#555' : '#fff', color: strict ? '#fff' : '#000'});
	};

	this.playerTurn = function(i) {
		if (!playerTurn) return;
		var _tile = $('#' + i);
		tile.add(_tile, patterns.user)
		
		if(patterns.correctInput()) {
			tile.light(_tile);
			if (patterns.match()) {
				if (hasWon()) {
					audio.win();
					displayMessage(true);
					game.end();
				} else {
					audio.success();
					switchState();
					patterns.interval = setTimeout(simonTurn, 1000);
				}
			}
		} else {
			audio.fail();
			$(selector.game_board).effect("shake");
			if(strict) {
				displayMessage(false);
				game.end();
			} else {
				switchState();
				patterns.interval = setTimeout(patterns.play, 1000);
			}
		}
	}

	this.begin = function () {
		switchState();
		patterns.interval = setTimeout(simonTurn, 1000);
	}

	this.end = function () {
		patterns.clear();
		$("html body").css('backgroundColor', '#eee');
		$(selector.text_steps).html('00');
		clearTimeout(patterns.interval);
		$(selector.button_start).prop('disabled', false);
		$(selector.button_strict).prop('disabled', false);
	}

}




$('document').ready( function () {
	game = new Game();

	$(selector.game_board).hide();
	$(selector.button_div).hide();
	$('footer').hide();
    $(selector.game_board).fadeIn(1000).removeClass('hidden');
    $(selector.button_div).fadeIn(1000).removeClass('hidden');
    $('footer').fadeIn(1000).removeClass('hidden');


	$(selector.button_control).click(function(){
		game.audio.click();
	});

	$(selector.tiles).click(function(){
		game.playerTurn($(this).index(selector.tiles));
	});

	$(selector.button_start).click(function(){
		$(selector.button_start).prop('disabled', true);
		$(selector.button_strict).prop('disabled', true);
		game.begin();
	});

	$(selector.button_strict).click(function(){
		game.toggleStrict();
	});

	$(selector.button_reset).click(function(){
		game.end();
		game = new Game();
	});

});
