$(document).ready(function() {
    /**
     * Generates a string of random numbers and letters
     * @param  {int} length [length of desired string]
     * @return {string}        [string of random letters and numbers]
     */
    function generateRandomString(length) {
		var text = '';
		var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

		for (var i = 0; i < length; i++) {
			text += possible.charAt(Math.floor(Math.random() * possible.length));
		}

		return text;
	}
	
	/**
	 * Handles OAuth params and redirects user to authorization page
	 * @return {none} window redirect
	 */
	function spotifyLogin() {

	    var client_id = '73a053a3263e4777a1424219269f36ce',
	    	redirect_uri = 'https://project-spotitube.herokuapp.com/',
	    	scopes = 'user-read-email playlist-read-private playlist-read-collaborative',
	    	state = generateRandomString(16);

	    var auth_params = {
	    	'client_id': client_id,
	    	'response_type': 'token',
	    	'redirect_uri': redirect_uri,
	    	'scope': scopes,
	    	'state': state,
	    	'show_dialog': 'false' 	// Change to 'true' for testing Oauth redirect
	    };

	    var auth_url = 'https://accounts.spotify.com/authorize?' + $.param(auth_params);

	    //	The 'state' parameter allows us to verify that it's actually Spotify
	    //	redirecting to our site. We store this in localStorage for now because the
	    //	window location is about to be changed to spotify's authorization request page.
	    localStorage.setItem(stateKey, state);

	    window.location = auth_url;
	}
	
	function requestUserData(token) {
		$.ajax({
			url: 'https://api.spotify.com/v1/me/',
			headers: {
				'Authorization': 'Bearer ' + token
			},
			success: function(response) {
				
				userData.setUserData(response);
				insertUserData(userData);
				
				console.log("user response");
				console.log(response);
			}
		});
	}
	
	function requestPlaylistsData(token, query) {
		$.ajax({
			url: query,
			headers: {
				'Authorization': 'Bearer ' + token
			},
			success: function(response) {
				
				playlistsData.total = response.total;
				playlistsData.addToPlaylists(response);
				
				if (response.next !== null) {
					
					playlistsQuery = response.next;
					requestPlaylistsData(token, playlistsQuery);
					
				} else {
					
					insertPlaylists(playlistsData);

					$('.button-collapse').sideNav('show');

				}
				
				console.log("playlists response");
				console.log(response);
			}
		});
	}

	function insertUserData(user) {
		$('#userImg').attr('src', user.image);
		$('#userName').html(user.id);
		$('#userEmail').html(user.email);
	}

	function insertPlaylists(playlistData) {

		for (let i = 0; i < playlistData.playlists.length; i++) {
			playlistTemplate(playlistData.playlists[i]);
		}

		console.log("adding playlists");
	}

	function playlistTemplate(playlistData) {

		let name = playlistData.playlistName;
		let trackTotal = playlistData.numOfTracks;
		let link = playlistData.tracksLink;
		let img = playlistData.playlistImg;
		let nameLength = playlistData.playlistName.length;
		let scrollClass = '';
		
		if (nameLength > 16) {
			scrollClass = 'title scroll-text';
		} else {
			scrollClass = 'title';
		}

		let template = $('<li>', {
			'title': 'Click to add tracks',
			'id': 'playlist-' + name.replace(/\s/g, '_'),
			'class': 'collection-item avatar grey darken-4',
			'data-tracks': link,
			'data-total': trackTotal,
			'data-img': img,
			'data-name': name
		}).html(
			`<img src="${img}" alt="playlist art" class="album-art">`
			+`<div class="text-body">`
			+`<p class="${scrollClass}"><span class="title">${name}</span></p>`
			+`<p>Tracks: ${trackTotal}</p>`
			+`</div>`
			+`<a href="#!" class="secondary-content">`
			+`<i class="material-icons">queue_play_next</i></a></div>`
		);

		$(template).on('click', function() {
			playlistClicked($(this));
		});

		$('.collection').append(template);
	}


	///////////////////////////////////////////
	// FUNCTION DECLARATIONS ABOVE THIS LINE //
	///////////////////////////////////////////
	var userData = {
		//placeholder default data
		id: "Team SpotiTube",
		email: "mail@SpotiTube.com",
		image: "assets/images/defaultuser.jpg",
		
		setUserData: function(response) {
			
			this.id = response.id;
			this.email = response.email;
			//see if user has an profile pic
			if(response.images.length !== 0){
			
				this.image = response.images[0].url;
				
			}
		}
	};
	
	var playlistsData = {
		playlists: [],
		total: 0, //total count of users playlists
		
		addToPlaylists: function(response) {
			
			let plData = response.items;
			
			for (var i = 0; i < plData.length; i++) {
				
				//using push instead of index to add to playlists
				//if this is a next page request
				this.playlists.push(
					new Playlist(plData[i].name, plData[i].tracks.total, plData[i].images, plData[i].href) 
				);
				
			}
			
			console.log(playlistsData.playlists);
		}
	};
	
	//protype function for creating playlist objects
	function Playlist(playlistName, numOfTracks, playlistImgs, tracksLink) {
		this.playlistName = playlistName;
		this.numOfTracks = numOfTracks;
		this.tracksLink = tracksLink;
		this.playlistImg = "http://placehold.it/64x64";

		if(playlistImgs.length !== 0){
		
			this.playlistImg = playlistImgs[0].url;

		}
	}

	/////////////////////////////////////////
	// OBJECT DECLARATIONS ABOVE THIS LINE //
	/////////////////////////////////////////

	/*
		We will need this var to store/retrieve state value in localstorage either way
		so rather than create two separate vars, we just make this one global.
	 */
	var stateKey = 'spotify_auth_state';
	var playlistsQuery = 'https://api.spotify.com/v1/me/playlists?limit=50';

	//////////////////////////////////////
	// GLOBAL VARIABLES ABOVE THIS LINE //
	//////////////////////////////////////


	///////////////////////////////
	// ALL LOGIC BELOW THIS LINE //
	///////////////////////////////

    $(".button-collapse").sideNav();
	
	switchTabs();

    if (/herokuapp\.com\/?$/.test(location.href)) {

	    $('.modal').modal({
	        dismissible: false
	    });

	    $('#modal1').modal('open');
	    
	    $('.login-button').on('click', function() {

	    	spotifyLogin();
	    	
	    });
	}
	else if (location.hash) {

		// Here we're using a short regular expression to replace the # in location.hash
		// then we're using a series of split() functions to get and store the key/value
		// pairs returned from spotify. 
		var hash = location.hash.replace(/#/g, '');
		var all = hash.split('&');
		var args = {};

		all.forEach(function(keyvalue) {
			var key = keyvalue.split('=')[0],
				value = keyvalue.split('=')[1];
			args[key] = value;
		});

		//	If you want to see what spotify returns, you can take a look at their docs..
		//	... or look at your console.
		console.log(args);

		//	Here we're grabbing the access token and returned state from spotify,
		//	as well as retrieving our sent state value from localStorage.

		access_token = args.access_token;
		var state = args.state,
			storedState = localStorage.getItem(stateKey);

		// Here we're making sure everything is authentic (pun intended).
		// If the redirected url doesn't contain a state parameter or if it doesn't
		// match our storedState value, we don't want to continue because something
		// went wrong somewhere (or someone is likely trying to hack us).
		if (access_token && (!state || state != storedState)) {

			window.location = 'https://project-spotitube.herokuapp.com/';

		}
		//	If everything checks out, then we continue
		else {

			// removing our stored state value from localStorage because we won't 
			// use it again. If we need to re-authenticate it will generate a new state.
			localStorage.removeItem(stateKey);

			// Obviously we only want to make our requests to spotify's api if we
			// received our access token. If it doesn't exist, we should probably add
			// some error message and handling to an else statement (TODO)
			if (access_token) {
				
				console.log("token granted!");
				requestUserData(access_token);
				requestPlaylistsData(access_token, playlistsQuery);
			}
		}
	}
	else {

		$('.modal').modal({
	        dismissible: false
	    });

	    $('#modal2').modal('open');

	    $('.login-button').on('click', function() {

	    	spotifyLogin();
	    	
	    });

		console.log('access denied');
	}
});

function playlistClicked(item) {
	console.log('FINALLY');
	tracksData.tracks.length = 0;
	requestTracksData(item[0].dataset.tracks);
	displayPlaylist(item);

	$('.button-collapse').sideNav('hide');
}

function requestTracksData(query) {
	var next = null;

	$.ajax({
		url: query,
		headers: {
			'Authorization': 'Bearer ' + access_token
		},
		success: function(response) {
			console.log("tracks response");
			console.log(response);
			
			try {
				next = response.tracks.next;
				tracksData.addToTracks(response.tracks);
			}
			catch(error) {
				next = response.next;
				tracksData.addToTracks(response);
			}
		},
		complete: function() {
			if (next) { requestTracksData(next); }
			else { player(); }
		}
	});
}

var tracksData = {
	tracks: [],
	total: 0, //total count of playlists tracks
	
	addToTracks: function(response) {
		
		let tData = response.items;
		
		for (var i = 0; i < tData.length; i++) {

			let t = tData[i].track;
			
			let arr = [];
			t.artists.map(x => arr.push(x.name));

			let mins = (t.duration_ms/1000/60) << 0;
			let secs = (Math.round((t.duration_ms/1000) % 60)).toString();
			secs = secs.length == 1 ? `0${secs}` : secs;

			let duration = mins + ':' + secs;

			let albumImg = t.album.album_type != null ? t.album.images[1].url : 'https://placehold.it/300x300';
			
			this.tracks.push(
				new Track(
					t.name,
					t.album.name,
					albumImg,
					arr,
					duration,
					t.preview_url,
					t.id
				) 
			);
		}
		console.log(this.tracks);
	}
};

function Track(trackName, albumName, albumArt, artists, trackDuration, preview_url, spot_id) {
		this.trackName = trackName;
		this.albumName = albumName;
		this.albumArt = albumArt;
		this.artists = artists; // this is an array, even if there's only one artist
		this.trackDuration = trackDuration;
		this.preview_url = preview_url;
		this.spot_id = spot_id;
	}

function player() {

	var table = $('<table>');
	table.addClass('songsContainer');
	$('.songslist').html(table);

	var tableHeader = $('<thead><tr class="tablehead"></tr></thead>');
	$('.songsContainer').append(tableHeader);

	var head = $('<th>SONG</th>'
				+'<th>ARTIST</th>'
				+'<th>ALBUM</th>'
				+'<th><i class="fa fa-clock-o fa-lg" aria-hidden="true"></i></th>');
	$('.tablehead').append(head);

	var tableBody = $('<tbody class="tableBody">');
	$('.songsContainer').append(tableBody);

	for (var i = 0; i < tracksData.tracks.length; i++) {

		var row = $('<tr>');

		var song = $('<td>');
		song.html(tracksData.tracks[i].trackName);
		$(row).append(song);

		var artist = $('<td>');
		artist.html(tracksData.tracks[i].artists.join('<br>'));
		$(row).append(artist);

		var album = $('<td>');
		album.html(tracksData.tracks[i].albumName);
		$(row).append(album);

		var duration = $('<td>');
		duration.html(tracksData.tracks[i].trackDuration);
		$(row).append(duration);

		$('.tableBody').append(row);

	}
	$('.songslist').scrollTop(0);
}

var videosData;

function displayPlaylist(item) {

	$('.player').css('display', 'block');
	
	var playlistImage = $('<img>', {
    'src': item[0].dataset.img
	});
	playlistImage.addClass('playlistImages mainImage');
	$('.playlistTitle').html(playlistImage);

	var playlistTitle = $('<h1>');
	playlistTitle.addClass('playlistName');
 	playlistTitle.html(item[0].dataset.name);
 	$('.playlistTitle').append(playlistTitle);

	var playlistTotal = $('<h2>');
 	playlistTotal.html(item[0].dataset.total + ' songs');
 	playlistTotal.addClass('totalSongs');
 	$('.playlistTitle').append(playlistTotal);

	var buttonYouTube = $('<a>').addClass('convert-button btn');
 	buttonYouTube.text('Convert to YouTube');

 	$(buttonYouTube).on('click', function() {

	    videosData = search(tracksData.tracks);

		$('#yt-tab').click();

	});

 	$('.playlistTitle').append(buttonYouTube);

}

function switchTabs() {
	$('.tab').on('click', function() {
		let tabClicked = $(this).attr('id');

		if (tabClicked == 'spot-tab') {

			$('#yt-side').addClass('hide-on-small-only');

			$('#spot-side').removeClass('hide-on-small-only');

		} else if (tabClicked == 'yt-tab'){

			$('#spot-side').addClass('hide-on-small-only');

			$('#yt-side').removeClass('hide-on-small-only');
		}

	});
}
